import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import InvestmentCategory from '@/models/InvestmentCategory';
import { authenticate } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch system categories or categories owned by this user
    const categories = await InvestmentCategory.find({
      $or: [{ is_system: true }, { user_id: user._id }],
      deletedAt: null,
    })
      .sort({ sort_order: 1, name: 1 })
      .exec();

    // Map fields for client compatibility (supporting both spellings)
    const mappedCategories = categories.map((cat) => {
      const obj = cat.toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        tax_catergories: obj.tax_categories.join(','), // compatibility mapping
        tax_benefit_ammount: obj.tax_benefit_amount,    // compatibility mapping
      };
    });

    return NextResponse.json({
      success: true,
      data: mappedCategories,
    });
  } catch (error: any) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    const name = body.name;
    const icon = body.icon || 'folder';
    const color = body.color || '#0D69FF';
    const investment_type = body.investment_type ? body.investment_type.toUpperCase() : 'OTHER';
    
    // Handle both spellings for backward compatibility
    const tax_categories_raw = body.tax_categories || body.tax_catergories;
    const tax_categories = Array.isArray(tax_categories_raw)
      ? tax_categories_raw
      : typeof tax_categories_raw === 'string'
      ? tax_categories_raw.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const tax_benefit_amount = Number(body.tax_benefit_amount ?? body.tax_benefit_ammount ?? 0);
    const sort_order = Number(body.sort_order ?? 0);
    const is_active = body.is_active !== false;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Category name is required.' }, { status: 400 });
    }

    // Slugify name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check if category with same slug already exists for this user
    const existing = await InvestmentCategory.findOne({
      slug,
      user_id: user._id,
      deletedAt: null,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'You already have an investment category with this name.' },
        { status: 422 }
      );
    }

    const isSystemAdmin = user.roles.includes('admin') && body.is_system === true;

    const category = new InvestmentCategory({
      name,
      slug,
      icon,
      color,
      investment_type,
      tax_categories,
      tax_benefit_amount,
      is_system: isSystemAdmin,
      user_id: user._id,
      sort_order,
      is_active,
    });

    await category.save();

    const responseData = {
      ...category.toObject(),
      id: category._id.toString(),
      tax_catergories: category.tax_categories.join(','),
      tax_benefit_ammount: category.tax_benefit_amount,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Category created successfully.',
        data: responseData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
