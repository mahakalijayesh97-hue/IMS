import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Investment from '@/models/Investment';
import User from '@/models/User';
import Agent from '@/models/Agent';
import InvestmentCategory from '@/models/InvestmentCategory';
import { authenticate } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const adminUser = await authenticate(req, { requiredRoles: ['admin', 'manager', 'agent'] });
    if (!adminUser) {
      return new Response('Unauthorized', { status: 403 });
    }

    await dbConnect();

    // Prevent tree-shaking of the InvestmentCategory model import
    const _categoryModel = InvestmentCategory;

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Security check: Agents can only view their own clients
    const isAgent = adminUser.roles.includes('agent') && !adminUser.roles.includes('admin') && !adminUser.roles.includes('manager');
    if (isAgent) {
      const agentProfile = await Agent.findOne({ user_id: adminUser._id });
      if (!agentProfile || !user.agent_id || user.agent_id.toString() !== agentProfile._id.toString()) {
        return new Response('Unauthorized access to this portfolio export', { status: 403 });
      }
    }

    // Fetch investments
    const investments = await Investment.find({ user_id: userId, deletedAt: null })
      .populate('category_id')
      .sort({ createdAt: -1 });

    // Generate CSV content
    const headers = [
      'Investment Name',
      'Provider Name',
      'Type',
      'Category',
      'Invested Amount',
      'Current Value',
      'Start Date',
      'Maturity Date',
      'Status'
    ];
    const csvRows = [headers.join(',')];

    investments.forEach((inv) => {
      const name = `"${(inv.name || '').replace(/"/g, '""')}"`;
      const provider = `"${(inv.provider_name || 'N/A').replace(/"/g, '""')}"`;
      const type = `"${(inv.investment_type || '').toUpperCase()}"`;
      const category = inv.category_id && (inv.category_id as any).name
        ? `"${(inv.category_id as any).name.replace(/"/g, '""')}"`
        : '"Uncategorized"';
      const invested = (inv.invested_amount || 0).toFixed(2);
      const current = (inv.current_value || 0).toFixed(2);
      const start = inv.start_date ? new Date(inv.start_date).toISOString().split('T')[0] : 'N/A';
      const maturity = inv.maturity_date ? new Date(inv.maturity_date).toISOString().split('T')[0] : 'N/A';
      const status = `"${(inv.status || '').charAt(0).toUpperCase() + (inv.status || '').slice(1)}"`;

      csvRows.push([
        name,
        provider,
        type,
        category,
        invested,
        current,
        start,
        maturity,
        status
      ].join(','));
    });

    const csvContent = csvRows.join('\n');
    const safeUserName = (user.name || 'user').toLowerCase().replace(/\s+/g, '_');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="portfolio_${safeUserName}.csv"`,
      },
    });
  } catch (error: any) {
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}
