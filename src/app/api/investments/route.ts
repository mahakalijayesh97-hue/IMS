import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Investment from '@/models/Investment';
import InvestmentCategory from '@/models/InvestmentCategory';
import { authenticate } from '@/lib/auth';

// Helper to format/map the investment document for frontend compatibility
function formatInvestment(inv: any) {
  const obj = inv.toObject ? inv.toObject() : inv;
  obj.id = obj._id.toString();

  // Rename category_id to category for frontend expectation
  if (obj.category_id) {
    obj.category = {
      ...obj.category_id,
      id: obj.category_id._id?.toString(),
    };
  }

  // Provide details under both camelCase and snake_case keys to support all client implementations
  const type = obj.investment_type?.toLowerCase();
  const isFd = type === 'fd' || type === 'fixed deposit';
  const isLic = type === 'lic' || type === 'life insurance';
  const isMf = type === 'mf' || type === 'mutual fund' || type === 'mutual_fund';
  const isStock = type === 'stock' || type === 'stocks' || type === 'equity' || type === 'equities';
  const isCrypto = type === 'crypto' || type === 'cryptocurrency';

  if (isFd) {
    obj.fdDetail = obj.details;
    obj.fd_detail = obj.details;
  } else if (isLic) {
    obj.licDetail = obj.details;
    obj.lic_detail = obj.details;
  } else if (isMf) {
    obj.mutualFundDetail = obj.details;
    obj.mutual_fund_detail = obj.details;
  } else if (isStock) {
    obj.stockDetail = obj.details;
    obj.stock_detail = obj.details;
  } else if (isCrypto) {
    obj.cryptoDetail = obj.details;
    obj.crypto_detail = obj.details;
  }

  return obj;
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch investments for authenticated user
    const investments = await Investment.find({
      user_id: user._id,
      deletedAt: null,
    })
      .populate('category_id')
      .sort({ createdAt: -1 })
      .exec();

    const formatted = investments.map(formatInvestment);

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Get investments error:', error);
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

    const {
      category_id,
      investment_type,
      name,
      provider_name,
      account_number,
      policy_number,
      folio_number,
      start_date,
      maturity_date,
      invested_amount,
      current_value,
      maturity_value,
      interest_rate,
      frequency,
      installment_amount,
      premium_amount,
      premium_frequency,
      next_premium_date,
      agent_id,
      status,
      is_taxable,
      tax_category,
      tax_benefit_amount,
      currency,
      notes,
      metadata,
    } = body;

    if (!category_id || !investment_type || !name) {
      return NextResponse.json(
        { success: false, message: 'Category, investment type, and name are required fields.' },
        { status: 400 }
      );
    }

    // Verify category exists and is valid for this user
    const category = await InvestmentCategory.findOne({
      _id: category_id,
      $or: [{ is_system: true }, { user_id: user._id }],
      deletedAt: null,
    });

    if (!category) {
      return NextResponse.json({ success: false, message: 'Invalid category selected.' }, { status: 422 });
    }

    // Define detail field mappings
    const fdFields = ['bank_name', 'branch', 'ifsc', 'fd_number', 'deposit_type', 'compounding_frequency', 'auto_renewal', 'tds_applicable'];
    const licFields = ['plan_name', 'plan_number', 'sum_assured', 'bonus_accumulated', 'surrender_value', 'loan_eligibility_date', 'revival_date', 'policy_term_years', 'premium_paying_term', 'mode_of_payment'];
    const mfFields = ['fund_name', 'fund_house', 'scheme_code', 'fund_type', 'nav_current', 'nav_purchase', 'units_held', 'xirr', 'is_sip', 'sip_amount', 'sip_date', 'lock_in_end_date', 'demat_account'];
    const stockFields = ['exchange', 'symbol', 'company_name', 'isin', 'quantity', 'avg_buy_price', 'current_price', 'demat_account', 'broker', 'sector'];
    const cryptoFields = ['coin_name', 'coin_symbol', 'quantity', 'avg_buy_price', 'current_price', 'exchange_name', 'wallet_address'];

    // Separate type-specific details
    const type = investment_type.toLowerCase();
    const isFd = type === 'fd' || type === 'fixed deposit';
    const isLic = type === 'lic' || type === 'life insurance';
    const isMf = type === 'mf' || type === 'mutual fund' || type === 'mutual_fund';
    const isStock = type === 'stock' || type === 'stocks' || type === 'equity' || type === 'equities';
    const isCrypto = type === 'crypto' || type === 'cryptocurrency';

    const details: Record<string, any> = {};

    let targetFields: string[] = [];
    if (isFd) targetFields = fdFields;
    else if (isLic) targetFields = licFields;
    else if (isMf) targetFields = mfFields;
    else if (isStock) targetFields = stockFields;
    else if (isCrypto) targetFields = cryptoFields;

    targetFields.forEach((field) => {
      if (body[field] !== undefined) {
        details[field] = body[field];
      }
    });

    const investment = new Investment({
      user_id: user._id,
      category_id,
      investment_type,
      name,
      provider_name,
      account_number,
      policy_number,
      folio_number,
      start_date,
      maturity_date,
      invested_amount: Number(invested_amount || 0),
      current_value: Number(current_value || 0),
      maturity_value: maturity_value ? Number(maturity_value) : undefined,
      interest_rate: interest_rate ? Number(interest_rate) : undefined,
      frequency,
      installment_amount: installment_amount ? Number(installment_amount) : undefined,
      premium_amount: premium_amount ? Number(premium_amount) : undefined,
      premium_frequency,
      next_premium_date,
      agent_id,
      status: status || 'active',
      is_taxable: !!is_taxable,
      tax_category,
      tax_benefit_amount: tax_benefit_amount ? Number(tax_benefit_amount) : 0,
      currency: currency || 'INR',
      notes,
      metadata: metadata || {},
      details,
    });

    await investment.save();

    // Populate category_id for response formatting
    const populated = await Investment.findById(investment._id).populate('category_id');

    return NextResponse.json(
      {
        success: true,
        message: 'Investment created successfully.',
        data: formatInvestment(populated),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create investment error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
