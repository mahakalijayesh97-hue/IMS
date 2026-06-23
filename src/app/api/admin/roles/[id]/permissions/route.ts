import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Role from '@/models/Role';
import { authenticate } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await authenticate(req, { requiredRoles: ['admin', 'manager'] });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      permissions: role.permissions || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await authenticate(req, { requiredRoles: ['admin'] });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { permissions } = await req.json(); // Array of strings (permission names)
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
      message: 'Role permissions updated successfully!',
      role,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
