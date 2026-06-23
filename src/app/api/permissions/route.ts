import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Permission from '@/models/Permission';
import { authenticate } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req, { requiredRoles: ['admin'] });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const permissions = await Permission.find({});
    return NextResponse.json({ success: true, permissions });
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
      return NextResponse.json({ success: false, message: 'Permission name is required' }, { status: 400 });
    }

    await dbConnect();

    // Check if permission already exists
    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return NextResponse.json({ success: false, message: 'Permission already exists' }, { status: 409 });
    }

    const permission = await Permission.create({
      name,
      guard_name: guard_name || 'web',
    });

    return NextResponse.json(
      { success: true, message: 'Permission created successfully', permission },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
