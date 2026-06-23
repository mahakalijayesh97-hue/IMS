import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Role from '@/models/Role';
import { authenticate } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req, { requiredRoles: ['admin'] });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const roles = await Role.find({});
    return NextResponse.json({ success: true, roles });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req, { requiredRoles: ['admin'] });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { name, guard_name } = await req.json();
    if (!name) {
      return NextResponse.json({ success: false, message: 'Role name is required' }, { status: 400 });
    }

    await dbConnect();

    // Check if role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return NextResponse.json({ success: false, message: 'Role already exists' }, { status: 409 });
    }

    const role = await Role.create({
      name,
      guard_name: guard_name || 'web',
    });

    return NextResponse.json(
      { success: true, message: 'Role created successfully', role },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
