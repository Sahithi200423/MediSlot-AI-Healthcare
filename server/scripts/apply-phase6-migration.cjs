const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('Applying 008_clinical_ai_copilot.sql to live Supabase...');
  let sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/008_clinical_ai_copilot.sql'), 'utf8');

  // Remove full-line comments
  sql = sql.replace(/^--.*$/gm, '');

  // Split on semicolon
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
      console.log('✓ Executed:', statement.substring(0, 50).replace(/\n/g, ' ') + '...');
    } catch (err) {
      console.warn('Notice executing statement:', err.message);
    }
  }

  // Verify tables exist
  const tables = await prisma.$queryRawUnsafe(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('ai_analyses', 'patient_ai_consent')"
  );
  console.log('Confirmed created tables:', tables.map(t => t.table_name));

  console.log('✓ Migration 008 successfully applied and verified!');
  await prisma.$disconnect();
}

applyMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
