import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Agent from '@/models/Agent';
import User from '@/models/User';
import { authenticate } from '@/lib/auth';
import bcrypt from 'bcryptjs';

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

    const agent = await Agent.findById(id).populate('user_id');
    if (!agent) {
      return NextResponse.json({ success: false, message: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, agent });
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
      agent_type,
      agency_name,
      license_number,
      license_expiry,
      certification_body,
      experience_years,
      bio,
      status,
    } = body;

    if (!name || !email || !agent_type || !status) {
      return NextResponse.json({ success: false, message: 'Name, email, agent type, and status are required' }, { status: 400 });
    }

    await dbConnect();

    const agent = await Agent.findById(id);
    if (!agent) {
      return NextResponse.json({ success: false, message: 'Agent not found' }, { status: 404 });
    }

    // Check unique constraints for email and phone in Users
    const userIdStr = agent.user_id ? agent.user_id.toString() : '';
    const existingUserEmail = await User.findOne({ email, _id: { $ne: userIdStr } });
    if (existingUserEmail) {
      return NextResponse.json({ success: false, message: 'The email has already been taken by another user.' }, { status: 422 });
    }

    if (phone) {
      const existingUserPhone = await User.findOne({ phone, _id: { $ne: userIdStr } });
      if (existingUserPhone) {
        return NextResponse.json({ success: false, message: 'The phone number has already been taken by another user.' }, { status: 422 });
      }
    }

    // Check unique constraints in Agents
    const existingAgentEmail = await Agent.findOne({ email, _id: { $ne: id } });
    if (existingAgentEmail) {
      return NextResponse.json({ success: false, message: 'The email has already been taken by another agent.' }, { status: 422 });
    }

    if (phone) {
      const existingAgentPhone = await Agent.findOne({ phone, _id: { $ne: id } });
      if (existingAgentPhone) {
        return NextResponse.json({ success: false, message: 'The phone number has already been taken by another agent.' }, { status: 422 });
      }
    }

    // Prepare agent update payload
    const agentUpdateData: any = {
      name,
      email,
      phone,
      agent_type,
      agency_name,
      license_number,
      license_expiry: license_expiry ? new Date(license_expiry) : undefined,
      certification_body,
      experience_years: experience_years || 0,
      bio,
    };

    let hashedPassword = '';
    if (password) {
      const salt = await bcrypt.genSalt(12);
      hashedPassword = await bcrypt.hash(password, salt);
      agentUpdateData.password = hashedPassword;
    }

    // Handle status change transitions
    if (status === 'active' && agent.status !== 'active') {
      if (!agent.user_id) {
        // Create user account for agent
        const newUser = await User.create({
          name,
          email,
          phone,
          password: hashedPassword || agent.password,
          status: 'active',
          roles: ['agent'],
          agent_id: agent._id,
        });
        agentUpdateData.user_id = newUser._id;
      } else {
        // Update user status
        await User.findByIdAndUpdate(agent.user_id, { status: 'active' });
      }

      agentUpdateData.approved_at = new Date();
      agentUpdateData.approved_by = adminUser._id;
    } else if (status !== 'active' && agent.user_id) {
      // Deactivate associated user
      await User.findByIdAndUpdate(agent.user_id, { status: 'inactive' });
    }

    // Sync other user profile edits if user account exists
    if (agent.user_id) {
      const userUpdateData: any = {
        name,
        email,
        phone,
      };
      if (hashedPassword) {
        userUpdateData.password = hashedPassword;
      }
      await User.findByIdAndUpdate(agent.user_id, userUpdateData);
    }

    agentUpdateData.status = status;

    const updatedAgent = await Agent.findByIdAndUpdate(id, agentUpdateData, { new: true }).populate('user_id');

    return NextResponse.json({
      success: true,
      message: 'Agent updated successfully!',
      agent: updatedAgent,
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
    const user = await authenticate(req, { requiredRoles: ['admin'] });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const agent = await Agent.findById(id);
    if (!agent) {
      return NextResponse.json({ success: false, message: 'Agent not found' }, { status: 404 });
    }

    // Soft delete associated user if present
    if (agent.user_id) {
      await User.findByIdAndUpdate(agent.user_id, { deletedAt: new Date() });
    }

    // Soft delete agent
    agent.deletedAt = new Date();
    await agent.save();

    return NextResponse.json({ success: true, message: 'Agent deleted successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
