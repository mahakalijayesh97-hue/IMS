import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';
import Role from '../src/models/Role';
import Permission from '../src/models/Permission';
import InvestmentCategory from '../src/models/InvestmentCategory';
import Investment from '../src/models/Investment';
import Agent from '../src/models/Agent';

async function seed() {
  // 1. Resolve MONGODB_URI from .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  let MONGODB_URI = '';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('MONGODB_URI=')) {
        MONGODB_URI = line.split('MONGODB_URI=')[1].trim();
        break;
      }
    }
  }

  if (!MONGODB_URI) {
    MONGODB_URI = 'mongodb://127.0.0.1:27017/ims';
  }

  console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully!');

  // 2. Clear existing collections
  console.log('Clearing existing collections...');
  await User.deleteMany({});
  await Role.deleteMany({});
  await Permission.deleteMany({});
  await InvestmentCategory.deleteMany({});
  await Investment.deleteMany({});
  console.log('Collections cleared.');

  // 3. Seed Permissions
  console.log('Seeding Permissions...');
  const permissionsList = [
    'user_list',
    'user_create',
    'user_edit',
    'user_delete',
    'role_list',
    'role_create',
    'role_edit',
    'role_delete',
    'investment_list',
    'investment_view',
    'investment_export',
    'agent_list',
    'agent_create',
    'agent_edit',
    'agent_delete',
  ];

  for (const perm of permissionsList) {
    await Permission.create({ name: perm, guard_name: 'web' });
  }
  console.log('Permissions seeded.');

  // 4. Seed Roles
  console.log('Seeding Roles...');
  const adminRole = await Role.create({
    name: 'admin',
    guard_name: 'web',
    permissions: permissionsList,
  });

  const managerRole = await Role.create({
    name: 'manager',
    guard_name: 'web',
    permissions: [
      'user_list',
      'user_create',
      'user_edit',
      'user_delete',
      'investment_list',
      'investment_view',
      'investment_export',
    ],
  });

  const agentRole = await Role.create({
    name: 'agent',
    guard_name: 'web',
    permissions: [],
  });

  const investorRole = await Role.create({
    name: 'investor',
    guard_name: 'web',
    permissions: [],
  });
  console.log('Roles seeded.');

  // 5. Seed Users
  console.log('Seeding Default Users...');
  // Admin User
  const adminUser = await User.create({
    name: 'System Administrator',
    email: 'admin@gmail.com',
    phone: '1234567890',
    password: 'admin@123',
    status: 'active',
    roles: ['admin'],
    permissions: permissionsList,
  });

  // Manager User
  const managerUser = await User.create({
    name: 'Manager',
    email: 'manager@example.com',
    phone: '1234567891',
    password: '12345678',
    status: 'active',
    roles: ['manager'],
    permissions: managerRole.permissions,
  });

  // Investor User
  const investorUser = await User.create({
    name: 'Investor',
    email: 'investor@example.com',
    phone: '1234567892',
    password: '12345678',
    status: 'active',
    roles: ['investor'],
    permissions: [],
  });

  // Agent User
  const agentUser = await User.create({
    name: 'Agent',
    email: 'agent@example.com',
    phone: '1234567893',
    password: '12345678',
    status: 'active',
    roles: ['agent'],
    permissions: [],
  });

  const agentProfile = await Agent.create({
    user_id: agentUser._id,
    name: agentUser.name,
    email: agentUser.email,
    phone: agentUser.phone,
    password: agentUser.password,
    agent_type: 'individual',
    status: 'active',
    experience_years: 3,
  });

  agentUser.agent_id = agentProfile._id;
  await agentUser.save();

  // Jayesh User
  const jayeshUser = await User.create({
    name: 'Jayesh',
    email: 'jayeshvanjara167@gmail.com',
    phone: '9876543210',
    password: '12345678',
    status: 'active',
    roles: ['investor'],
    permissions: [],
  });

  console.log('Users seeded.');

  // 6. Seed System Investment Categories
  console.log('Seeding System Categories...');
  const systemCategories = [
    {
      name: 'Stocks',
      slug: 'stocks',
      icon: 'trending-up',
      color: '#0D69FF',
      investment_type: 'stock',
      is_system: true,
      sort_order: 1,
      is_active: true,
    },
    {
      name: 'Mutual Funds',
      slug: 'mutual-funds',
      icon: 'pie-chart',
      color: '#10B981',
      investment_type: 'mutual_fund',
      is_system: true,
      sort_order: 2,
      is_active: true,
    },
    {
      name: 'Bonds',
      slug: 'bonds',
      icon: 'shield',
      color: '#F59E0B',
      investment_type: 'other',
      is_system: true,
      sort_order: 3,
      is_active: true,
    },
    {
      name: 'Cash',
      slug: 'cash',
      icon: 'credit-card',
      color: '#6B7280',
      investment_type: 'other',
      is_system: true,
      sort_order: 4,
      is_active: true,
    },
  ];

  for (const cat of systemCategories) {
    await InvestmentCategory.create(cat);
  }
  console.log('System Categories seeded.');

  // 7. Seed Admin Categories & Investments
  console.log('Seeding Admin custom categories and investments...');
  const adminCategories = [
    {
      name: 'Fixed Deposit',
      slug: 'fixed-deposit-admin',
      icon: 'briefcase',
      color: '#8B5CF6',
      is_system: false,
      user_id: adminUser._id,
      investment_type: 'fd',
      tax_categories: ['Section 80C'],
      tax_benefit_amount: 150000.00,
      sort_order: 1,
      is_active: true,
    },
    {
      name: 'Cryptocurrency',
      slug: 'cryptocurrency-admin',
      icon: 'activity',
      color: '#EC4899',
      is_system: false,
      user_id: adminUser._id,
      investment_type: 'crypto',
      tax_categories: [],
      tax_benefit_amount: 0.00,
      sort_order: 2,
      is_active: true,
    },
    {
      name: 'Life Insurance',
      slug: 'life-insurance-admin',
      icon: 'heart',
      color: '#EF4444',
      is_system: false,
      user_id: adminUser._id,
      investment_type: 'lic',
      tax_categories: ['Section 80C'],
      tax_benefit_amount: 50000.00,
      sort_order: 3,
      is_active: true,
    },
    {
      name: 'Real Estate',
      slug: 'real-estate-admin',
      icon: 'home',
      color: '#F59E0B',
      is_system: false,
      user_id: adminUser._id,
      investment_type: 'other',
      tax_categories: ['Section 24'],
      tax_benefit_amount: 200000.00,
      sort_order: 4,
      is_active: true,
    },
    {
      name: 'Stocks',
      slug: 'stocks-admin',
      icon: 'trending-up',
      color: '#0D69FF',
      is_system: false,
      user_id: adminUser._id,
      investment_type: 'stock',
      tax_categories: ['Section 80CCG'],
      tax_benefit_amount: 50000.00,
      sort_order: 5,
      is_active: true,
    },
  ];

  const adminCategoryModels: Record<string, any> = {};
  for (const cat of adminCategories) {
    adminCategoryModels[cat.name] = await InvestmentCategory.create(cat);
  }

  // Admin Investments
  const adminInvestments = [
    {
      user_id: adminUser._id,
      category_id: adminCategoryModels['Fixed Deposit']._id,
      investment_type: 'fd',
      name: 'SBI Tax Saver FD',
      provider_name: 'State Bank of India',
      account_number: '30094857112',
      folio_number: 'FD-SBI-402',
      start_date: new Date('2026-03-01'),
      maturity_date: new Date('2031-03-01'),
      invested_amount: 150000.00,
      current_value: 152500.00,
      maturity_value: 210000.00,
      interest_rate: 6.50,
      status: 'active',
      is_taxable: true,
      tax_category: 'Section 80C',
      tax_benefit_amount: 150000.00,
      currency: 'INR',
      notes: 'Admin test tax saver fixed deposit.',
      frequency: 'yearly',
      installment_amount: 0.00,
      premium_amount: 0.00,
      details: {
        bank_name: 'State Bank of India',
        branch: 'Corporate Branch',
        ifsc: 'SBIN0000987',
        fd_number: '30094857112',
        deposit_type: 'cumulative',
        compounding_frequency: 'quarterly',
        auto_renewal: true,
        tds_applicable: true,
      },
    },
    {
      user_id: adminUser._id,
      category_id: adminCategoryModels['Cryptocurrency']._id,
      investment_type: 'crypto',
      name: 'Ethereum Holdings',
      provider_name: 'WazirX Exchange',
      account_number: 'ETH-Wallet-Admin',
      start_date: new Date('2026-04-10'),
      invested_amount: 50000.00,
      current_value: 56000.00,
      status: 'active',
      is_taxable: false,
      tax_benefit_amount: 0.00,
      currency: 'INR',
      notes: 'Admin Ethereum portfolio.',
      frequency: 'one-time',
      details: {
        fund_name: 'Ethereum Index Fund',
        fund_house: 'WazirX AMC',
        scheme_code: 'ETH-IDX',
        fund_type: 'equity',
        nav_current: 56000.00,
        nav_purchase: 50000.00,
        units_held: 1.0000,
        xirr: 12.00,
        is_sip: false,
        sip_amount: null,
        sip_date: null,
        lock_in_end_date: null,
        demat_account: 'ACC-ADMIN-ETH',
      },
    },
    {
      user_id: adminUser._id,
      category_id: adminCategoryModels['Stocks']._id,
      investment_type: 'stock',
      name: 'Infosys Technologies',
      provider_name: 'Groww',
      account_number: 'ACC-ADMIN-DEMAT',
      start_date: new Date('2026-02-18'),
      invested_amount: 80000.00,
      current_value: 84200.00,
      status: 'active',
      is_taxable: true,
      tax_category: 'Section 80CCG',
      tax_benefit_amount: 40000.00,
      currency: 'INR',
      notes: 'Infosys shares purchased in admin demat account.',
      frequency: 'one-time',
      details: {
        exchange: 'NSE',
        symbol: 'INFY',
        company_name: 'Infosys Technologies',
        isin: 'INE009A01021',
        quantity: 50.0000,
        avg_buy_price: 1600.00,
        current_price: 1684.00,
        demat_account: 'ACC-ADMIN-DEMAT',
        broker: 'Groww',
        sector: 'Technology',
      },
    },
  ];

  for (const inv of adminInvestments) {
    await Investment.create(inv);
  }
  console.log('Admin investments seeded.');

  // 8. Seed Jayesh Categories & Investments
  console.log('Seeding Jayesh custom categories and investments...');
  const jayeshCategories = [
    {
      name: 'Fixed Deposit',
      slug: 'fixed-deposit-u4',
      icon: 'briefcase',
      color: '#8B5CF6',
      is_system: false,
      user_id: jayeshUser._id,
      investment_type: 'fd',
      tax_categories: ['Section 80C'],
      tax_benefit_amount: 150000.00,
      sort_order: 1,
      is_active: true,
    },
    {
      name: 'Cryptocurrency',
      slug: 'cryptocurrency-u4',
      icon: 'activity',
      color: '#EC4899',
      is_system: false,
      user_id: jayeshUser._id,
      investment_type: 'crypto',
      tax_categories: [],
      tax_benefit_amount: 0.00,
      sort_order: 2,
      is_active: true,
    },
    {
      name: 'Life Insurance',
      slug: 'life-insurance-u4',
      icon: 'heart',
      color: '#EF4444',
      is_system: false,
      user_id: jayeshUser._id,
      investment_type: 'lic',
      tax_categories: ['Section 80C'],
      tax_benefit_amount: 50000.00,
      sort_order: 3,
      is_active: true,
    },
    {
      name: 'Real Estate',
      slug: 'real-estate-u4',
      icon: 'home',
      color: '#F59E0B',
      is_system: false,
      user_id: jayeshUser._id,
      investment_type: 'other',
      tax_categories: ['Section 24'],
      tax_benefit_amount: 200000.00,
      sort_order: 4,
      is_active: true,
    },
    {
      name: 'Stocks',
      slug: 'stocks-u4',
      icon: 'trending-up',
      color: '#0D69FF',
      is_system: false,
      user_id: jayeshUser._id,
      investment_type: 'stock',
      tax_categories: ['Section 80CCG'],
      tax_benefit_amount: 50000.00,
      sort_order: 5,
      is_active: true,
    },
  ];

  const jayeshCategoryModels: Record<string, any> = {};
  for (const cat of jayeshCategories) {
    jayeshCategoryModels[cat.name] = await InvestmentCategory.create(cat);
  }

  // Jayesh Investments
  const jayeshInvestments = [
    {
      user_id: jayeshUser._id,
      category_id: jayeshCategoryModels['Fixed Deposit']._id,
      investment_type: 'fd',
      name: 'HDFC Fixed Deposit',
      provider_name: 'HDFC Bank',
      account_number: '10020495811',
      folio_number: 'FD-HDFC-902',
      start_date: new Date('2026-01-10'),
      maturity_date: new Date('2031-01-10'),
      invested_amount: 120000.00,
      current_value: 123800.00,
      maturity_value: 175000.00,
      interest_rate: 6.95,
      status: 'active',
      is_taxable: true,
      tax_category: 'Section 80C',
      tax_benefit_amount: 120000.00,
      currency: 'INR',
      notes: '5 Year Tax Saver FD with quarterly compounding.',
      frequency: 'yearly',
      installment_amount: 0.00,
      premium_amount: 0.00,
      details: {
        bank_name: 'HDFC Bank',
        branch: 'Main Branch',
        ifsc: 'HDFC0000123',
        fd_number: '10020495811',
        deposit_type: 'cumulative',
        compounding_frequency: 'quarterly',
        auto_renewal: false,
        tds_applicable: true,
      },
    },
    {
      user_id: jayeshUser._id,
      category_id: jayeshCategoryModels['Cryptocurrency']._id,
      investment_type: 'crypto',
      name: 'Bitcoin Holdings',
      provider_name: 'Binance Exchange',
      account_number: 'BTC-Wallet-U4',
      start_date: new Date('2026-02-15'),
      invested_amount: 18000.00,
      current_value: 21450.00,
      status: 'active',
      is_taxable: false,
      tax_benefit_amount: 0.00,
      currency: 'INR',
      notes: 'Long term cold storage hodl.',
      frequency: 'one-time',
      details: {
        fund_name: 'Bitcoin Index Fund',
        fund_house: 'Binance AMC',
        scheme_code: 'BTC-IDX',
        fund_type: 'equity',
        nav_current: 21450.00,
        nav_purchase: 18000.00,
        units_held: 1.0000,
        xirr: 19.17,
        is_sip: false,
        sip_amount: null,
        sip_date: null,
        lock_in_end_date: null,
        demat_account: 'ACC-U4-BTC',
      },
    },
    {
      user_id: jayeshUser._id,
      category_id: jayeshCategoryModels['Life Insurance']._id,
      investment_type: 'lic',
      name: 'Jeevan Anand Policy',
      provider_name: 'LIC of India',
      policy_number: 'POL-LIC-38491',
      start_date: new Date('2025-05-20'),
      maturity_date: new Date('2045-05-20'),
      invested_amount: 30000.00,
      current_value: 31000.00,
      maturity_value: 100000.00,
      status: 'active',
      is_taxable: true,
      tax_category: 'Section 80C',
      tax_benefit_amount: 15000.00,
      currency: 'INR',
      notes: 'Annual premium life assurance plan.',
      frequency: 'yearly',
      installment_amount: 15000.00,
      premium_amount: 15000.00,
      premium_frequency: 'yearly',
      next_premium_date: new Date('2027-05-20'),
      details: {
        plan_name: 'Jeevan Anand Policy',
        plan_number: '915',
        sum_assured: 100000.00,
        bonus_accumulated: 5000.00,
        surrender_value: 31000.00,
        loan_eligibility_date: '2028-05-20',
        revival_date: null,
        policy_term_years: 20,
        premium_paying_term: 20,
        mode_of_payment: 'yearly',
      },
    },
    {
      user_id: jayeshUser._id,
      category_id: jayeshCategoryModels['Real Estate']._id,
      investment_type: 'other',
      name: 'DLF Mall Shop #402',
      provider_name: 'DLF Properties',
      start_date: new Date('2024-08-12'),
      invested_amount: 450000.00,
      current_value: 495000.00,
      status: 'active',
      is_taxable: true,
      tax_category: 'Section 24',
      tax_benefit_amount: 180000.00,
      currency: 'INR',
      notes: 'Commercial retail outlet leasing property.',
      frequency: 'one-time',
    },
    {
      user_id: jayeshUser._id,
      category_id: jayeshCategoryModels['Stocks']._id,
      investment_type: 'stock',
      name: 'Reliance Industries Ltd',
      provider_name: 'Zerodha',
      account_number: 'ACC-U4-DEMAT',
      start_date: new Date('2025-10-15'),
      invested_amount: 50000.00,
      current_value: 58250.00,
      status: 'active',
      is_taxable: true,
      tax_category: 'Section 80CCG',
      tax_benefit_amount: 25000.00,
      currency: 'INR',
      notes: 'Bluechip Indian conglomerate equity holding.',
      frequency: 'one-time',
      details: {
        exchange: 'NSE',
        symbol: 'RELIANCE',
        company_name: 'Reliance Industries Ltd',
        isin: 'INE002A01018',
        quantity: 20.0000,
        avg_buy_price: 2500.00,
        current_price: 2912.50,
        demat_account: 'ACC-U4-DEMAT',
        broker: 'Zerodha',
        sector: 'Energy / Conglomerate',
      },
    },
    {
      user_id: jayeshUser._id,
      category_id: jayeshCategoryModels['Stocks']._id,
      investment_type: 'stock',
      name: 'Tata Consultancy Services',
      provider_name: 'Zerodha',
      account_number: 'ACC-U4-DEMAT',
      start_date: new Date('2025-11-20'),
      invested_amount: 45000.00,
      current_value: 49500.00,
      status: 'active',
      is_taxable: true,
      tax_category: 'Section 80CCG',
      tax_benefit_amount: 22500.00,
      currency: 'INR',
      notes: 'Major IT services & consulting equity holding.',
      frequency: 'one-time',
      details: {
        exchange: 'NSE',
        symbol: 'TCS',
        company_name: 'Tata Consultancy Services',
        isin: 'INE467B01029',
        quantity: 12.0000,
        avg_buy_price: 3750.00,
        current_price: 4125.00,
        demat_account: 'ACC-U4-DEMAT',
        broker: 'Zerodha',
        sector: 'Technology',
      },
    },
  ];

  for (const inv of jayeshInvestments) {
    await Investment.create(inv);
  }
  console.log('Jayesh investments seeded.');

  console.log('Database seeding completed successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
