import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Investment from '@/models/Investment';
import InvestmentCategory from '@/models/InvestmentCategory';
import { authenticate } from '@/lib/auth';

function formatInvestment(inv: any) {
  const obj = inv.toObject ? inv.toObject() : inv;
  obj.id = obj._id.toString();

  if (obj.category_id) {
    obj.category = {
      ...obj.category_id,
      id: obj.category_id._id?.toString(),
    };
  }

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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const investment = await Investment.findOne({
      _id: id,
      user_id: user._id,
      deletedAt: null,
    });

    if (!investment) {
      return NextResponse.json({ success: false, message: 'Investment not found.' }, { status: 404 });
    }

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

    // Verify category if changed
    if (category_id && category_id !== investment.category_id.toString()) {
      const category = await InvestmentCategory.findOne({
        _id: category_id,
        $or: [{ is_system: true }, { user_id: user._id }],
        deletedAt: null,
      });

      if (!category) {
        return NextResponse.json({ success: false, message: 'Invalid category selected.' }, { status: 422 });
      }
      investment.category_id = category_id;
    }

    // Update primary fields
    if (investment_type) investment.investment_type = investment_type;
    if (name) investment.name = name;
    if (provider_name !== undefined) investment.provider_name = provider_name;
    if (account_number !== undefined) investment.account_number = account_number;
    if (policy_number !== undefined) investment.policy_number = policy_number;
    if (folio_number !== undefined) investment.folio_number = folio_number;
    if (start_date !== undefined) investment.start_date = start_date;
    if (maturity_date !== undefined) investment.maturity_date = maturity_date;
    if (invested_amount !== undefined) investment.invested_amount = Number(invested_amount || 0);
    if (current_value !== undefined) investment.current_value = Number(current_value || 0);
    if (maturity_value !== undefined) investment.maturity_value = maturity_value ? Number(maturity_value) : undefined;
    if (interest_rate !== undefined) investment.interest_rate = interest_rate ? Number(interest_rate) : undefined;
    if (frequency !== undefined) investment.frequency = frequency;
    if (installment_amount !== undefined) investment.installment_amount = installment_amount ? Number(installment_amount) : undefined;
    if (premium_amount !== undefined) investment.premium_amount = premium_amount ? Number(premium_amount) : undefined;
    if (premium_frequency !== undefined) investment.premium_frequency = premium_frequency;
    if (next_premium_date !== undefined) investment.next_premium_date = next_premium_date;
    if (agent_id !== undefined) investment.agent_id = agent_id;
    if (status !== undefined) investment.status = status;
    if (is_taxable !== undefined) investment.is_taxable = !!is_taxable;
    if (tax_category !== undefined) investment.tax_category = tax_category;
    if (tax_benefit_amount !== undefined) investment.tax_benefit_amount = tax_benefit_amount ? Number(tax_benefit_amount) : 0;
    if (currency !== undefined) investment.currency = currency;
    if (notes !== undefined) investment.notes = notes;
    if (metadata !== undefined) investment.metadata = metadata;

    // Handle updates to details
    const fdFields = ['bank_name', 'branch', 'ifsc', 'fd_number', 'deposit_type', 'compounding_frequency', 'auto_renewal', 'tds_applicable'];
    const licFields = ['plan_name', 'plan_number', 'sum_assured', 'bonus_accumulated', 'surrender_value', 'loan_eligibility_date', 'revival_date', 'policy_term_years', 'premium_paying_term', 'mode_of_payment'];
    const mfFields = ['fund_name', 'fund_house', 'scheme_code', 'fund_type', 'nav_current', 'nav_purchase', 'units_held', 'xirr', 'is_sip', 'sip_amount', 'sip_date', 'lock_in_end_date', 'demat_account'];
    const stockFields = ['exchange', 'symbol', 'company_name', 'isin', 'quantity', 'avg_buy_price', 'current_price', 'demat_account', 'broker', 'sector'];
    const cryptoFields = ['coin_name', 'coin_symbol', 'quantity', 'avg_buy_price', 'current_price', 'exchange_name', 'wallet_address'];

    const type = investment.investment_type.toLowerCase();
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
      // Use new values from request if provided, otherwise preserve existing if type matches
      if (body[field] !== undefined) {
        details[field] = body[field];
      } else if (investment.details && investment.details[field] !== undefined && investment.investment_type === investment_type) {
        details[field] = investment.details[field];
      }
    });

    investment.details = details;
    // Mark details field as modified since it is Mixed
    investment.markModified('details');

    await investment.save();

    const populated = await Investment.findById(investment._id).populate('category_id');

    return NextResponse.json({
      success: true,
      message: 'Investment updated successfully.',
      data: formatInvestment(populated),
    });
  } catch (error: any) {
    console.error('Update investment error:', error);
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

    const investment = await Investment.findOne({
      _id: id,
      user_id: user._id,
      deletedAt: null,
    });

    if (!investment) {
      return NextResponse.json({ success: false, message: 'Investment not found.' }, { status: 404 });
    }

    // Soft delete
    investment.deletedAt = new Date();
    await investment.save();

    return NextResponse.json({
      success: true,
      message: 'Investment deleted successfully.',
    });
  } catch (error: any) {
    console.error('Delete investment error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
