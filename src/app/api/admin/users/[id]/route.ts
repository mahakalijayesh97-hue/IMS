import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Agent from '@/models/Agent';
import { authenticate } from '@/lib/auth';
import bcrypt from 'bcryptjs';

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

    const user = await User.findById(id).populate('agent_id');
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Security: Agents can only fetch their own clients
    const isAgent = adminUser.roles.includes('agent') && !adminUser.roles.includes('admin') && !adminUser.roles.includes('manager');
    if (isAgent) {
      const agentProfile = await Agent.findOne({ user_id: adminUser._id });
      if (!agentProfile || !user.agent_id || user.agent_id._id.toString() !== agentProfile._id.toString()) {
        return NextResponse.json({ success: false, message: 'Access denied to this user portfolio.' }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const adminUser = await authenticate(req, { requiredRoles: ['admin', 'manager'] });
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      status,
      roles,
      dob,
      pan_number,
      aadhaar_number,
      address,
      city,
      state,
      pincode,
      agent_id,
    } = body;

    if (!name || !email || !roles || !Array.isArray(roles)) {
      return NextResponse.json({ success: false, message: 'Name, email, and roles array are required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Unique email and phone checks
    const existingEmail = await User.findOne({ email, _id: { $ne: id } });
    if (existingEmail) {
      return NextResponse.json({ success: false, message: 'The email has already been taken.' }, { status: 422 });
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: id } });
      if (existingPhone) {
        return NextResponse.json({ success: false, message: 'The phone number has already been taken.' }, { status: 422 });
      }
    }

    // Build update payload
    const userUpdate: any = {
      name,
      email,
      phone,
      status: status || 'active',
      roles,
      dob: dob ? new Date(dob) : undefined,
      pan_number,
      aadhaar_number,
      address,
      city,
      state,
      pincode,
    };

    if (password) {
      const salt = await bcrypt.genSalt(12);
      userUpdate.password = await bcrypt.hash(password, salt);
    }

    // Handle agent_id reassignment count synchronization
    const oldAgentId = user.agent_id ? user.agent_id.toString() : null;
    const newAgentId = agent_id || null;

    if (oldAgentId !== newAgentId) {
      // Decrement client count of previous agent
      if (oldAgentId) {
        await Agent.findByIdAndUpdate(oldAgentId, { $inc: { total_clients: -1 } });
      }
      // Increment client count of new agent
      if (newAgentId) {
        await Agent.findByIdAndUpdate(newAgentId, { $inc: { total_clients: 1 } });
      }
      userUpdate.agent_id = newAgentId;
    }

    const updatedUser = await User.findByIdAndUpdate(id, userUpdate, { new: true });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully!',
      user: updatedUser,
    });
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
    const adminUser = await authenticate(req, { requiredRoles: ['admin'] });
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    if (adminUser._id.toString() === id) {
      return NextResponse.json({ success: false, message: 'You cannot delete your own account.' }, { status: 403 });
    }

    await dbConnect();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Soft delete the user
    user.deletedAt = new Date();
    await user.save();

    // Decrement agent's client count if user was assigned to an agent
    if (user.agent_id) {
      await Agent.findByIdAndUpdate(user.agent_id, { $inc: { total_clients: -1 } });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
