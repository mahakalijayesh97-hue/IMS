import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInvestment extends Document {
  user_id: mongoose.Types.ObjectId;
  category_id: mongoose.Types.ObjectId;
  investment_type: string; // 'stock', 'fd', 'lic', 'crypto', 'mutual_fund', 'other'
  name: string;
  provider_name?: string;
  account_number?: string;
  policy_number?: string;
  folio_number?: string;
  start_date?: Date;
  maturity_date?: Date;
  invested_amount: number;
  current_value: number;
  maturity_value?: number;
  interest_rate?: number;
  frequency?: string;
  installment_amount?: number;
  premium_amount?: number;
  premium_frequency?: string;
  next_premium_date?: Date;
  agent_id?: mongoose.Types.ObjectId;
  status: string; // 'active', 'matured', 'closed', 'cancelled'
  is_taxable: boolean;
  tax_category?: string;
  tax_benefit_amount?: number;
  currency: string;
  notes?: string;
  metadata?: Record<string, any>;
  details?: Record<string, any>; // Dynamic object matching the specific investment type's details
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema: Schema<IInvestment> = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category_id: { type: Schema.Types.ObjectId, ref: 'InvestmentCategory', required: true, index: true },
    investment_type: { type: String, required: true },
    name: { type: String, required: true },
    provider_name: { type: String },
    account_number: { type: String },
    policy_number: { type: String },
    folio_number: { type: String },
    start_date: { type: Date },
    maturity_date: { type: Date },
    invested_amount: { type: Number, default: 0 },
    current_value: { type: Number, default: 0 },
    maturity_value: { type: Number },
    interest_rate: { type: Number },
    frequency: { type: String },
    installment_amount: { type: Number },
    premium_amount: { type: Number },
    premium_frequency: { type: String },
    next_premium_date: { type: Date },
    agent_id: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, default: 'active' },
    is_taxable: { type: Boolean, default: false },
    tax_category: { type: String },
    tax_benefit_amount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    notes: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    details: { type: Schema.Types.Mixed, default: {} },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Soft delete query filter
InvestmentSchema.pre(/^find/, function (next) {
  (this as any).where({ deletedAt: null });
  next();
});

const Investment: Model<IInvestment> =
  mongoose.models.Investment || mongoose.model<IInvestment>('Investment', InvestmentSchema);

export default Investment;
