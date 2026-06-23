import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  guard_name: string;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema: Schema<IPermission> = new Schema(
  {
    name: { type: String, required: true, unique: true },
    guard_name: { type: String, default: 'web' },
  },
  { timestamps: true }
);

const Permission: Model<IPermission> = mongoose.models.Permission || mongoose.model<IPermission>('Permission', PermissionSchema);
export default Permission;
