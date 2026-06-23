import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Agent from '@/models/Agent';
import { authenticate } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await authenticate(req, { requiredRoles: ['admin', 'manager', 'agent'] });
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const role = searchParams.get('role') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {
      deletedAt: null,
      roles: { $ne: 'agent' }, // Exclude agents from user lists
    };

    // If current user is an agent, restrict list to their clients
    const isAgent = adminUser.roles.includes('agent') && !adminUser.roles.includes('admin') && !adminUser.roles.includes('manager');
    if (isAgent) {
      // Find the agent profile
      const agentProfile = await Agent.findOne({ user_id: adminUser._id });
      if (agentProfile) {
        filter.agent_id = agentProfile._id;
      } else {
        // No agent profile, return empty list
        return NextResponse.json({ success: true, users: [], pagination: { total: 0, page, limit, pages: 0 } });
      }
    }

    // Apply search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Apply status filter
    if (status) {
      filter.status = status;
    }

    // Apply role filter
    if (role) {
      filter.roles = role;
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate('agent_id', 'name email agent_type')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    // Validation
    if (!name || !email || !password || !roles || !Array.isArray(roles)) {
      return NextResponse.json({ success: false, message: 'Name, email, password, and roles array are required' }, { status: 400 });
    }

    await dbConnect();

    // Check if email or phone is already taken
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ success: false, message: 'The email has already been taken.' }, { status: 422 });
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return NextResponse.json({ success: false, message: 'The phone number has already been taken.' }, { status: 422 });
      }
    }

    // Create user
    const userPayload: any = {
      name,
      email,
      phone,
      password,
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

    if (agent_id) {
      userPayload.agent_id = agent_id;
    }

    const user = await User.create(userPayload);

    // If agent_id is provided, increment agent's client count
    if (agent_id) {
      await Agent.findByIdAndUpdate(agent_id, { $inc: { total_clients: 1 } });
    }

    return NextResponse.json({ success: true, message: 'User created successfully!', user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
