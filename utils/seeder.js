/**
 * Database Seeder
 *
 * Populates the database with realistic sample data for development and testing.
 * Usage:
 *   node utils/seeder.js          → seed the database
 *   node utils/seeder.js --clear  → wipe all data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const FinancialRecord = require('../models/FinancialRecord');
const connectDB = require('../config/db');

// ── Sample Users ──────────────────────────────────────────────────────────────
const SEED_USERS = [
  {
    name: 'Alice Admin',
    email: 'admin@example.com',
    password: 'Admin1234',
    role: 'admin',
    status: 'active',
  },
  {
    name: 'Anna Analyst',
    email: 'analyst@example.com',
    password: 'Analyst1234',
    role: 'analyst',
    status: 'active',
  },
  {
    name: 'Victor Viewer',
    email: 'viewer@example.com',
    password: 'Viewer1234',
    role: 'viewer',
    status: 'active',
  },
];

// ── Sample Categories ─────────────────────────────────────────────────────────
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investments', 'Rental Income', 'Bonus'];
const EXPENSE_CATEGORIES = [
  'Rent', 'Utilities', 'Groceries', 'Transport', 'Dining',
  'Entertainment', 'Healthcare', 'Insurance', 'Subscriptions', 'Education',
];

// ── Record Generator ──────────────────────────────────────────────────────────
const randomBetween = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateRecords = (adminId, count = 120) => {
  const records = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const isIncome = Math.random() > 0.45;
    const daysAgo = Math.floor(Math.random() * 365);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    records.push({
      amount: isIncome ? randomBetween(500, 8000) : randomBetween(20, 2000),
      type: isIncome ? 'income' : 'expense',
      category: isIncome ? randomFrom(INCOME_CATEGORIES) : randomFrom(EXPENSE_CATEGORIES),
      date,
      note: isIncome
        ? `${randomFrom(['Monthly', 'Quarterly', 'One-time'])} ${randomFrom(['payment', 'deposit', 'transfer'])}`
        : `${randomFrom(['Regular', 'Unexpected', 'Planned'])} ${randomFrom(['payment', 'purchase', 'bill'])}`,
      createdBy: adminId,
    });
  }

  return records;
};

// ── Seed Logic ────────────────────────────────────────────────────────────────
const seed = async () => {
  await connectDB();
  console.log('\n🌱 Starting database seed...\n');

  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      FinancialRecord.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create users one by one so pre-save hook hashes passwords
    const users = [];
    for (const userData of SEED_USERS) {
      const user = await User.create(userData);
      users.push(user);
    }
    console.log(`👤 Created ${users.length} users`);

    const admin = users.find((u) => u.role === 'admin');

    // Generate and insert financial records
    const records = generateRecords(admin._id, 120);
    await FinancialRecord.insertMany(records);
    console.log(`💰 Created ${records.length} financial records`);

    console.log('\n✅ Seed complete!\n');
    console.log('─'.repeat(50));
    console.log('Test credentials:');
    console.log('  Admin:    admin@example.com    / Admin1234');
    console.log('  Analyst:  analyst@example.com  / Analyst1234');
    console.log('  Viewer:   viewer@example.com   / Viewer1234');
    console.log('─'.repeat(50) + '\n');
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// ── Clear Logic ───────────────────────────────────────────────────────────────
const clear = async () => {
  await connectDB();
  console.log('\n🗑️  Clearing all data...');

  try {
    await Promise.all([
      User.deleteMany({}),
      FinancialRecord.deleteMany({}),
    ]);
    console.log('✅ All data cleared\n');
  } catch (error) {
    console.error('❌ Clear failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// ── Entry Point ───────────────────────────────────────────────────────────────
if (process.argv.includes('--clear')) {
  clear();
} else {
  seed();
}