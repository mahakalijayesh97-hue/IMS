import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInvestmentCategory extends Document {
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  investment_type: string; // 'stock', 'fd', 'lic', 'crypto', 'mutual_fund', 'other'
  tax_categories: string[];
  tax_benefit_amount: number;
  is_system: boolean;
  user_id?: mongoose.Types.ObjectId;
  sort_order: number;
  is_active: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentCategorySchema: Schema<IInvestmentCategory> = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    icon: { type: String },
    color: { type: String },
    investment_type: { type: String, required: true },
    tax_categories: { type: [String], default: [] },
    tax_benefit_amount: { type: Number, default: 0 },
    is_system: { type: Boolean, default: false },
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    sort_order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto slug generation before validate
InvestmentCategorySchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

// Soft delete query filter
InvestmentCategorySchema.pre(/^find/, function (next) {
  (this as any).where({ deletedAt: null });
  next();
});

const InvestmentCategory: Model<IInvestmentCategory> =
  mongoose.models.InvestmentCategory ||
  mongoose.model<IInvestmentCategory>('InvestmentCategory', InvestmentCategorySchema);

export default InvestmentCategory;
