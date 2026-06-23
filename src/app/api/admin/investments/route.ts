import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Investment from '@/models/Investment';
import User from '@/models/User';
import Agent from '@/models/Agent';
import { authenticate } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await authenticate(req, { requiredRoles: ['admin', 'manager', 'agent'] });
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const skip = (page - 1) * limit;

    // Agent check
    const isAgent = adminUser.roles.includes('agent') && !adminUser.roles.includes('admin') && !adminUser.roles.includes('manager');
    let agentProfileId: mongoose.Types.ObjectId | null = null;

    if (isAgent) {
      const agentProfile = await Agent.findOne({ user_id: adminUser._id });
      if (!agentProfile) {
        return NextResponse.json({ success: true, users: [], stats: { total_invested: 0, total_current: 0, total_return: 0, return_percentage: 0 } });
      }
      agentProfileId = agentProfile._id as mongoose.Types.ObjectId;
    }

    // Build matching stage for investments query (to calculate total stats)
    const statsMatch: any = { deletedAt: null };
    if (isAgent && agentProfileId) {
      // Find all user IDs belonging to this agent
      const clients = await User.find({ agent_id: agentProfileId, deletedAt: null }).select('_id');
      const clientIds = clients.map(c => c._id);
      statsMatch.user_id = { $in: clientIds };
    }

    // Calculate Summary Stats
    const statsAggregation = await Investment.aggregate([
      { $match: statsMatch },
      {
        $group: {
          _id: null,
          total_invested: { $sum: '$invested_amount' },
          total_current: { $sum: '$current_value' },
        }
      }
    ]);

    const totalInvested = statsAggregation[0]?.total_invested || 0;
    const totalCurrent = statsAggregation[0]?.total_current || 0;
    const totalReturn = totalCurrent - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    const stats = {
      total_invested: totalInvested,
      total_current: totalCurrent,
      total_return: totalReturn,
      return_percentage: returnPercentage,
    };

    // User aggregation list pipeline
    const pipeline: any[] = [
      { $match: { deletedAt: null } }
    ];

    // Filter by user client IDs if agent
    if (isAgent && agentProfileId) {
      const clients = await User.find({ agent_id: agentProfileId, deletedAt: null }).select('_id');
      const clientIds = clients.map(c => c._id);
      pipeline.push({ $match: { user_id: { $in: clientIds } } });
    }

    // Group by user
    pipeline.push(
      {
        $group: {
          _id: '$user_id',
          investments_count: { $sum: 1 },
          investments_sum_invested_amount: { $sum: '$invested_amount' },
          investments_sum_current_value: { $sum: '$current_value' },
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        }
      },
      { $unwind: '$user' }
    );

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.name': { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } },
            { 'user.phone': { $regex: search, $options: 'i' } },
          ]
        }
      });
    }

    // Count total matched records
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Investment.aggregate(countPipeline);
    const totalMatched = countResult[0]?.total || 0;

    // Apply pagination
    pipeline.push(
      { $sort: { investments_sum_invested_amount: -1 } },
      { $skip: skip },
      { $limit: limit }
    );

    const usersWithInvestments = await Investment.aggregate(pipeline);

    const portfolios = usersWithInvestments.map((u) => ({
      user_id: u._id,
      name: u.user.name,
      email: u.user.email,
      total_invested: u.investments_sum_invested_amount || 0,
      total_current: u.investments_sum_current_value || 0,
      investment_count: u.investments_count || 0,
    }));

    return NextResponse.json({
      success: true,
      portfolios,
      users: usersWithInvestments,
      stats,
      pagination: {
        total: totalMatched,
        page,
        limit,
        pages: Math.ceil(totalMatched / limit),
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
