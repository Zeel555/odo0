/**
 * Seed script: Inserts the 3 default ECO stages into MongoDB.
 * Run once after first startup: node seed.js
 */
require('dotenv').config();
require('express-async-errors');
const mongoose = require('mongoose');
const ECOStage = require('./models/ECOStage');
const { DEFAULT_STAGES } = require('./config/constants');

const Company = require('./models/Company');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Ensure there is at least a development company to attach stages to
  let testCompany = await Company.findOne({ name: 'Development Company' });
  if (!testCompany) {
    testCompany = await Company.create({
      name: 'Development Company',
      domain: 'dev.local',
      isActive: true,
    });
    console.log(`Created Development Company (${testCompany._id})`);
  }

  const count = await ECOStage.countDocuments({ companyId: testCompany._id });
  if (count > 0) {
    console.log(`Stages already seeded for Development Company (${count} found). Skipping.`);
    process.exit(0);
  }

  const stagesWithCompany = DEFAULT_STAGES.map(s => ({ ...s, companyId: testCompany._id }));
  await ECOStage.insertMany(stagesWithCompany);
  console.log('✅ Default stages seeded for Development Company:', DEFAULT_STAGES.map((s) => s.name).join(', '));
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
