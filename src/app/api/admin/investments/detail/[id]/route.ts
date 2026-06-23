import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Investment from '@/models/Investment';
import User from '@/models/User';
import Agent from '@/models/Agent';
import InvestmentCategory from '@/models/InvestmentCategory';
import { authenticate } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const adminUser = await authenticate(req, { requiredRoles: ['admin', 'manager', 'agent'] });
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Prevent tree-shaking of the InvestmentCategory model import
    const _categoryModel = InvestmentCategory;

    const investment = await Investment.findById(id)
      .populate('user_id')
      .populate('category_id');

    if (!investment) {
      return NextResponse.json({ success: false, message: 'Investment not found' }, { status: 404 });
    }

    // Security check: Agents can only view their own clients' investments
    const isAgent = adminUser.roles.includes('agent') && !adminUser.roles.includes('admin') && !adminUser.roles.includes('manager');
    if (isAgent) {
      const agentProfile = await Agent.findOne({ user_id: adminUser._id });
      const investmentUser = investment.user_id as any;
      if (!agentProfile || !investmentUser || !investmentUser.agent_id || investmentUser.agent_id.toString() !== agentProfile._id.toString()) {
        return NextResponse.json({ success: false, message: 'Unauthorized access to this investment details.' }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      investment,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
