import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAgent extends Document {
  user_id?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  agent_type: string;
  agency_name?: string;
  license_number?: string;
  license_expiry?: Date;
  certification_body?: string;
  experience_years: number;
  bio?: string;
  rating: number;
  total_clients: number;
  status: string; // 'pending', 'active', 'inactive'
  approved_at?: Date;
  approved_by?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema: Schema<IAgent> = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    agent_type: { type: String, required: true },
    agency_name: { type: String },
    license_number: { type: String },
    license_expiry: { type: Date },
    certification_body: { type: String },
    experience_years: { type: Number, default: 0 },
    bio: { type: String },
    rating: { type: Number, default: 0 },
    total_clients: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'active', 'inactive'], default: 'pending' },
    approved_at: { type: Date },
    approved_by: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Exclude soft-deleted agents in queries
AgentSchema.pre(/^find/, function (next) {
  (this as any).where({ deletedAt: null });
  next();
});

const Agent: Model<IAgent> = mongoose.models.Agent || mongoose.model<IAgent>('Agent', AgentSchema);
export default Agent;
