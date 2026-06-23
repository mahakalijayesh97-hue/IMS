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
      return new Response('Unauthorized', { status: 403 });
    }

    await dbConnect();

    // Query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    // Agent check
    const isAgent = adminUser.roles.includes('agent') && !adminUser.roles.includes('admin') && !adminUser.roles.includes('manager');
    let agentProfileId: mongoose.Types.ObjectId | null = null;

    if (isAgent) {
      const agentProfile = await Agent.findOne({ user_id: adminUser._id });
      if (!agentProfile) {
        return new Response('Agent profile not found', { status: 404 });
      }
      agentProfileId = agentProfile._id as mongoose.Types.ObjectId;
    }

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

    pipeline.push({ $sort: { investments_sum_invested_amount: -1 } });

    const usersWithInvestments = await Investment.aggregate(pipeline);

    // Generate CSV content
    const headers = ['Name', 'Email', 'Phone', 'Joined At', 'Total Investments', 'Total Invested Amount'];
    const csvRows = [headers.join(',')];

    usersWithInvestments.forEach((item) => {
      const name = `"${(item.user.name || '').replace(/"/g, '""')}"`;
      const email = `"${(item.user.email || '').replace(/"/g, '""')}"`;
      const phone = `"${(item.user.phone || 'N/A').replace(/"/g, '""')}"`;
      const joinedAt = item.user.createdAt ? new Date(item.user.createdAt).toISOString().split('T')[0] : 'N/A';
      const count = item.investments_count || 0;
      const totalAmount = (item.investments_sum_invested_amount || 0).toFixed(2);

      csvRows.push([name, email, phone, joinedAt, count, totalAmount].join(','));
    });

    const csvContent = csvRows.join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="user_investments_list.csv"',
      },
    });
  } catch (error: any) {
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}
