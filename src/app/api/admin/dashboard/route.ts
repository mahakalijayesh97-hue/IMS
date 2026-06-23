import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Agent from '@/models/Agent';
import Investment from '@/models/Investment';
import { authenticate } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req, { requiredRoles: ['admin', 'manager', 'agent', 'investor', 'user'] });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Check role boundaries
    const isAdminOrManager = user.roles.some((r) => ['admin', 'manager'].includes(r));
    const isAgent = user.roles.includes('agent');
    const isInvestor = user.roles.some((r) => ['investor', 'user'].includes(r));

    let totalUsers = 0;
    let activeUsers = 0;
    let admins = 0;
    let managers = 0;
    let agentsCount = 0;
    let investors = 0;
    let totalInvested = 0;
    let totalCurrent = 0;
    let agentPerformance: any[] = [];

    if (isAdminOrManager) {
      // System wide counts
      totalUsers = await User.countDocuments({ deletedAt: null });
      activeUsers = await User.countDocuments({ status: 'active', deletedAt: null });
      admins = await User.countDocuments({ roles: 'admin', deletedAt: null });
      managers = await User.countDocuments({ roles: 'manager', deletedAt: null });
      agentsCount = await Agent.countDocuments({ deletedAt: null });
      investors = await User.countDocuments({ roles: { $in: ['user', 'investor'] }, deletedAt: null });

      // Aggregate investments
      const investmentAgg = await Investment.aggregate([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: null,
            totalInvested: { $sum: '$invested_amount' },
            totalCurrent: { $sum: '$current_value' },
          },
        },
      ]);
      if (investmentAgg.length > 0) {
        totalInvested = investmentAgg[0].totalInvested;
        totalCurrent = investmentAgg[0].totalCurrent;
      }

      // Fetch all agents and map details
      const agents = await Agent.find({ deletedAt: null }).populate('user_id');
      agentPerformance = agents.map((agent: any) => {
        return {
          id: agent._id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone || 'N/A',
          clients_count: agent.clients_count || 0,
          status: agent.status,
          user: agent.user_id ? { last_login_at: agent.user_id.last_login_at } : null,
        };
      });
    } else if (isAgent) {
      // Agent is restricted to their own clients
      const agentProfile = await Agent.findOne({ user_id: user._id });
      const agentId = agentProfile ? agentProfile._id : null;

      totalUsers = await User.countDocuments({ agent_id: agentId, deletedAt: null });
      activeUsers = await User.countDocuments({ agent_id: agentId, status: 'active', deletedAt: null });
      investors = totalUsers;

      if (agentId) {
        // Aggregate investments for this agent's clients
        const clientUsers = await User.find({ agent_id: agentId, deletedAt: null }).select('_id');
        const clientIds = clientUsers.map((u) => u._id);

        const investmentAgg = await Investment.aggregate([
          { $match: { user_id: { $in: clientIds }, deletedAt: null } },
          {
            $group: {
              _id: null,
              totalInvested: { $sum: '$invested_amount' },
              totalCurrent: { $sum: '$current_value' },
            },
          },
        ]);
        if (investmentAgg.length > 0) {
          totalInvested = investmentAgg[0].totalInvested;
          totalCurrent = investmentAgg[0].totalCurrent;
        }
      }
    } else if (isInvestor) {
      // Investor is restricted to their own investments
      const investmentAgg = await Investment.aggregate([
        { $match: { user_id: user._id, deletedAt: null } },
        {
          $group: {
            _id: null,
            totalInvested: { $sum: '$invested_amount' },
            totalCurrent: { $sum: '$current_value' },
          },
        },
      ]);
      if (investmentAgg.length > 0) {
        totalInvested = investmentAgg[0].totalInvested;
        totalCurrent = investmentAgg[0].totalCurrent;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        total_users: totalUsers,
        active_users: activeUsers,
        admins,
        managers,
        agents: agentsCount,
        investors,
        total_invested: totalInvested,
        total_current_value: totalCurrent,
      },
      agentPerformance,
    });
  } catch (error: any) {
    console.error('Dashboard aggregation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
