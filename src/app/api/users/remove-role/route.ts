import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { authenticate } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req, { requiredRoles: ['admin'] });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { user_id, role } = await req.json();
    if (!user_id || !role) {
      return NextResponse.json(
        { success: false, message: 'user_id and role are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const targetUser = await User.findById(user_id);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    targetUser.roles = targetUser.roles.filter((r) => r !== role);
    await targetUser.save();

    return NextResponse.json({
      success: true,
      message: 'Role removed from user successfully',
      user: targetUser,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
