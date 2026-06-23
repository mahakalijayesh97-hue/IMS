import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from './dbConnect';
import User, { IUser } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'ims_development_jwt_secret_key_9876543210!';

export interface DecodedToken {
  id: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

export function signToken(user: IUser): string {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      roles: user.roles,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (error) {
    return null;
  }
}

export async function authenticate(req: NextRequest, options?: { requiredRoles?: string[]; requiredPermission?: string }): Promise<IUser | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  await dbConnect();
  const user = await User.findById(decoded.id);
  if (!user || user.status !== 'active') {
    return null;
  }

  // Check roles if required
  if (options?.requiredRoles && options.requiredRoles.length > 0) {
    const hasRole = user.roles.some((role) => options.requiredRoles!.includes(role));
    if (!hasRole) {
      return null;
    }
  }

  // Check permission if required
  if (options?.requiredPermission) {
    const hasPermission = user.permissions.includes(options.requiredPermission);
    if (!hasPermission) {
      return null;
    }
  }

  return user;
}
