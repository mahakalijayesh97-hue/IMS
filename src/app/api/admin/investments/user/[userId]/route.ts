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
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Prevent tree-shaking of the InvestmentCategory model import
    const _categoryModel = InvestmentCategory;

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Security check: Agents can only view their own clients
    const isAgent = adminUser.roles.includes('agent') && !adminUser.roles.includes('admin') && !adminUser.roles.includes('manager');
    if (isAgent) {
      const agentProfile = await Agent.findOne({ user_id: adminUser._id });
      if (!agentProfile || !user.agent_id || user.agent_id.toString() !== agentProfile._id.toString()) {
        return NextResponse.json({ success: false, message: 'Unauthorized access to this portfolio.' }, { status: 403 });
      }
    }

    // Fetch investments
    const investments = await Investment.find({ user_id: userId, deletedAt: null })
      .populate('category_id')
      .sort({ createdAt: -1 });

    // Calculate stats
    const totalInvested = investments.reduce((sum, inv) => sum + inv.invested_amount, 0);
    const totalCurrent = investments.reduce((sum, inv) => sum + inv.current_value, 0);
    const totalReturn = totalCurrent - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    const filterByType = (types: string[]) =>
      investments
        .filter((inv) => types.includes(inv.investment_type.toLowerCase()))
        .reduce((sum, inv) => sum + inv.invested_amount, 0);

    const stats = {
      total_invested: totalInvested,
      total_current: totalCurrent,
      total_return: totalReturn,
      return_percentage: returnPercentage,
      total_fd: filterByType(['fd', 'fixed_deposit', 'fixed deposit']),
      total_lic: filterByType(['lic', 'life insurance', 'life_insurance']),
      total_mf: filterByType(['mf', 'mutual_fund', 'mutual fund']),
      total_stock: filterByType(['stock', 'stocks', 'equity']),
    };

    return NextResponse.json({
      success: true,
      user,
      investments,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
