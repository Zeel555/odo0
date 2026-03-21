require('dotenv').config();
const mongoose = require('mongoose');
const ECOStage = require('./models/ECOStage');
const ApprovalRule = require('./models/ApprovalRule');
const Company = require('./models/Company');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let defaultCompany = await Company.findOne({ name: 'Default Company (Legacy)' });
    if (!defaultCompany) {
      console.log('No default company found. Run main migration script first.');
      process.exit(0);
    }

    const stageRes = await ECOStage.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: defaultCompany._id } }
    );
    console.log(`Migrated ${stageRes.modifiedCount} ECO stages.`);

    const ruleRes = await ApprovalRule.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: defaultCompany._id } }
    );
    console.log(`Migrated ${ruleRes.modifiedCount} Approval rules.`);

    console.log('Settings migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
