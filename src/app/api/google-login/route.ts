import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, name, phone, avatar } = body;

    if (!email || !name) {
      return NextResponse.json(
        { success: false, message: 'Email and name are required fields.' },
        { status: 400 }
      );
    }

    // Find or create user by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user with randomized password
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = new User({
        name,
        email: email.toLowerCase(),
        phone,
        avatar,
        password: randomPassword,
        roles: ['investor'],
        status: 'active',
      });
      await user.save();
    } else {
      // Update phone or avatar if they don't exist yet
      let shouldUpdate = false;
      if (phone && !user.phone) {
        user.phone = phone;
        shouldUpdate = true;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
        shouldUpdate = true;
      }
      if (shouldUpdate) {
        await user.save();
      }
    }

    // Update last login
    user.last_login_at = new Date();
    await user.save();

    // Generate JWT token
    const token = signToken(user);

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      roles: user.roles,
      permissions: user.permissions,
      status: user.status,
      last_login_at: user.last_login_at,
    };

    return NextResponse.json({
      success: true,
      message: 'Google authentication successful',
      user: userResponse,
      token,
    });
  } catch (error: any) {
    console.error('Google login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
