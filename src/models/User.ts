import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  avatar?: string;
  dob?: Date;
  pan_number?: string;
  aadhaar_number?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status: string; // 'active', 'inactive', 'pending'
  roles: string[]; // ['user'], ['admin'], ['agent']
  permissions: string[];
  agent_id?: mongoose.Types.ObjectId;
  last_login_at?: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true },
    phone: { type: String },
    password: { type: String },
    avatar: { type: String },
    dob: { type: Date },
    pan_number: { type: String },
    aadhaar_number: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    status: { type: String, default: 'active' },
    roles: { type: [String], default: ['user'] },
    permissions: { type: [String], default: [] },
    agent_id: { type: Schema.Types.ObjectId, ref: 'Agent' },
    last_login_at: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash password before saving if it is modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (!this.password) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

// Exclude deleted users in queries by default unless specified
UserSchema.pre(/^find/, function (next) {
  (this as any).where({ deletedAt: null });
  next();
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
