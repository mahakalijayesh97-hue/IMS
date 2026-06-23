import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Role from '@/models/Role';
import { authenticate } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticate(req, { requiredRoles: ['admin'] });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { permissions } = await req.json();
    if (!Array.isArray(permissions)) {
      return NextResponse.json({ success: false, message: 'Permissions must be an array' }, { status: 400 });
    }

    await dbConnect();

    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
    }

    role.permissions = permissions;
    await role.save();

    return NextResponse.json({
      success: true,
      message: 'Permissions synced to role successfully',
      role,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
