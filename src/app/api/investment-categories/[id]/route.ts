import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import InvestmentCategory from '@/models/InvestmentCategory';
import { authenticate } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const category = await InvestmentCategory.findById(id);

    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found.' }, { status: 404 });
    }

    // Authorization: only the owner or an admin can update this category
    const isAdmin = user.roles.includes('admin');
    if (category.user_id?.toString() !== user._id.toString() && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. You cannot edit this category.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const name = body.name;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Category name is required.' }, { status: 400 });
    }

    // Check slug uniqueness (excluding current category)
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existing = await InvestmentCategory.findOne({
      slug,
      user_id: user._id,
      _id: { $ne: category._id },
      deletedAt: null,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'You already have another investment category with this name.' },
        { status: 422 }
      );
    }

    // Handle both spellings for backward compatibility
    const tax_categories_raw = body.tax_categories || body.tax_catergories;
    const tax_categories = Array.isArray(tax_categories_raw)
      ? tax_categories_raw
      : typeof tax_categories_raw === 'string'
      ? tax_categories_raw.split(',').map((s: string) => s.trim()).filter(Boolean)
      : category.tax_categories;

    const tax_benefit_amount = Number(body.tax_benefit_amount ?? body.tax_benefit_ammount ?? category.tax_benefit_amount);
    const sort_order = Number(body.sort_order ?? category.sort_order);
    const is_active = body.is_active !== undefined ? body.is_active : category.is_active;
    const icon = body.icon ?? category.icon;
    const color = body.color ?? category.color;
    const investment_type = body.investment_type ? body.investment_type.toUpperCase() : category.investment_type;

    category.name = name;
    category.slug = slug;
    category.icon = icon;
    category.color = color;
    category.investment_type = investment_type;
    category.tax_categories = tax_categories;
    category.tax_benefit_amount = tax_benefit_amount;
    category.sort_order = sort_order;
    category.is_active = is_active;

    if (isAdmin && body.is_system !== undefined) {
      category.is_system = body.is_system;
    }

    await category.save();

    const responseData = {
      ...category.toObject(),
      id: category._id.toString(),
      tax_catergories: category.tax_categories.join(','),
      tax_benefit_ammount: category.tax_benefit_amount,
    };

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully.',
      data: responseData,
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const category = await InvestmentCategory.findById(id);

    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found.' }, { status: 404 });
    }

    const isAdmin = user.roles.includes('admin');
    if (category.user_id?.toString() !== user._id.toString() && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. You cannot delete this category.' },
        { status: 403 }
      );
    }

    if (category.is_system && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'System categories can only be deleted by admins.' },
        { status: 403 }
      );
    }

    // Soft delete
    category.deletedAt = new Date();
    await category.save();

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
