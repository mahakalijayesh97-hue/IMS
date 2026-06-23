import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Agent from '@/models/Agent';
import { authenticate } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const adminUser = await authenticate(req, { requiredRoles: ['admin', 'manager'] });
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { user_ids, agent_id } = await req.json();

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ success: false, message: 'user_ids must be a non-empty array' }, { status: 400 });
    }

    await dbConnect();

    // Fetch all users to be updated
    const users = await User.find({ _id: { $in: user_ids }, deletedAt: null });

    const newAgentIdStr = agent_id || null;

    // Track old agent counts to decrement
    const oldAgentCounts: Record<string, number> = {};

    for (const user of users) {
      const oldAgentId = user.agent_id ? user.agent_id.toString() : null;
      if (oldAgentId && oldAgentId !== newAgentIdStr) {
        oldAgentCounts[oldAgentId] = (oldAgentCounts[oldAgentId] || 0) + 1;
      }
    }

    // Decrement previous agents' client counts
    await Promise.all(
      Object.entries(oldAgentCounts).map(([oldAgentId, count]) =>
        Agent.findByIdAndUpdate(oldAgentId, { $inc: { total_clients: -count } })
      )
    );

    // Update users
    await User.updateMany(
      { _id: { $in: user_ids }, deletedAt: null },
      { agent_id: newAgentIdStr }
    );

    // If new agent assigned, increment their client count
    if (newAgentIdStr) {
      // Count how many users actually changed to this new agent
      const newlyAssignedCount = users.filter(
        (u) => !u.agent_id || u.agent_id.toString() !== newAgentIdStr
      ).length;

      if (newlyAssignedCount > 0) {
        await Agent.findByIdAndUpdate(newAgentIdStr, {
          $inc: { total_clients: newlyAssignedCount },
        });
      }
    }

    const message = newAgentIdStr
      ? `Successfully assigned ${users.length} users to the selected agent.`
      : `Successfully removed agent assignment from ${users.length} users.`;

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
