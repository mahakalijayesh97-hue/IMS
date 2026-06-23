import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      dob: user.dob,
      pan_number: user.pan_number,
      aadhaar_number: user.aadhaar_number,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      roles: user.roles,
      permissions: user.permissions,
      status: user.status,
      createdAt: user.createdAt,
    };

    return NextResponse.json({
      success: true,
      user: userResponse,
    });
  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authenticatedUser = await authenticate(req);
    if (!authenticatedUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const body = await req.json();

    // Fields that standard users are allowed to edit on their own profile
    const allowedFields = [
      'name',
      'phone',
      'dob',
      'pan_number',
      'aadhaar_number',
      'address',
      'city',
      'state',
      'pincode',
    ];

    const user = await User.findById(authenticatedUser._id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Apply updates
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        (user as any)[field] = body[field];
      }
    });

    await user.save();

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      dob: user.dob,
      pan_number: user.pan_number,
      aadhaar_number: user.aadhaar_number,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      roles: user.roles,
      permissions: user.permissions,
      status: user.status,
      createdAt: user.createdAt,
    };

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse,
    });
  } catch (error: any) {
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

