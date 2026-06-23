import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Role from '@/models/Role';
import { authenticate } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await authenticate(req, { requiredRoles: ['admin'] });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ success: false, message: 'Role name is required' }, { status: 400 });
    }

    await dbConnect();

    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
    }

    // Prevent renaming system-critical roles
    if (['admin', 'manager', 'investor', 'agent'].includes(role.name)) {
      return NextResponse.json({ success: false, message: 'Default roles cannot be modified.' }, { status: 403 });
    }

    role.name = name;
    await role.save();

    return NextResponse.json({ success: true, message: 'Role updated successfully!', role });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await authenticate(req, { requiredRoles: ['admin'] });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
    }

    // Prevent deleting default roles
    if (['admin', 'manager', 'investor', 'agent'].includes(role.name)) {
      return NextResponse.json({ success: false, message: 'Default roles cannot be deleted.' }, { status: 403 });
    }

    await Role.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Role deleted successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
