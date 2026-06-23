import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Agent from '@/models/Agent';
import User from '@/models/User';
import { authenticate } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req, { requiredRoles: ['admin', 'manager'] });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { deletedAt: null };
    if (status) {
      filter.status = status;
    }

    if (search) {
      // Find matching users first to match agent.user_id search
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ]
      }).select('_id');
      const userIds = matchingUsers.map(u => u._id);

      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { license_number: { $regex: search, $options: 'i' } },
        { user_id: { $in: userIds } }
      ];
    }

    const total = await Agent.countDocuments(filter);
    const agents = await Agent.find(filter)
      .populate('user_id', 'name email phone avatar status')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Fetch client count for each agent
    const agentsWithClientsCount = await Promise.all(
      agents.map(async (agent) => {
        const clientsCount = await User.countDocuments({
          agent_id: agent._id,
          roles: { $ne: 'agent' }, // whereDoesntHave roles: agent
        });

        return {
          ...agent.toObject(),
          clients_count: clientsCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      agents: agentsWithClientsCount,
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
    const user = await authenticate(req, { requiredRoles: ['admin', 'manager'] });
    if (!user) {
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
    } = body;

    // Validation
    if (!name || !email || !password || !agent_type) {
      return NextResponse.json({ success: false, message: 'Name, email, password, and agent type are required' }, { status: 400 });
    }

    await dbConnect();

    // Check if email or phone is already taken in Users
    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) {
      return NextResponse.json({ success: false, message: 'The email has already been taken by a user.' }, { status: 422 });
    }

    if (phone) {
      const existingUserPhone = await User.findOne({ phone });
      if (existingUserPhone) {
        return NextResponse.json({ success: false, message: 'The phone number has already been taken by a user.' }, { status: 422 });
      }
    }

    // Check if email or phone is already taken in Agents
    const existingAgentEmail = await Agent.findOne({ email });
    if (existingAgentEmail) {
      return NextResponse.json({ success: false, message: 'The email has already been taken by another agent.' }, { status: 422 });
    }

    if (phone) {
      const existingAgentPhone = await Agent.findOne({ phone });
      if (existingAgentPhone) {
        return NextResponse.json({ success: false, message: 'The phone number has already been taken by another agent.' }, { status: 422 });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const agent = await Agent.create({
      name,
      email,
      phone,
      password: hashedPassword,
      agent_type,
      agency_name,
      license_number,
      license_expiry: license_expiry ? new Date(license_expiry) : undefined,
      certification_body,
      experience_years: experience_years || 0,
      bio,
      status: 'pending', // default pending approval
    });

    return NextResponse.json({ success: true, message: 'Agent created and is pending approval!', agent }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
