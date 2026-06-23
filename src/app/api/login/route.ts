import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { login, password } = body;

    if (!login || !password) {
      return NextResponse.json(
        { success: false, message: 'Login field (email/phone) and password are required.' },
        { status: 400 }
      );
    }

    // Check if login is email or phone
    const isEmail = login.includes('@');
    const query = isEmail ? { email: login.toLowerCase() } : { phone: login };

    // Find the user (using +password to include the field which might be hidden/selected off if we did that, but in mongoose schema we didn't specify select: false, so it is returned by default)
    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login timestamp
    user.last_login_at = new Date();
    await user.save();

    // Generate JWT token
    const token = signToken(user);

    // Don't return password in response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      permissions: user.permissions,
      status: user.status,
      last_login_at: user.last_login_at,
    };

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
