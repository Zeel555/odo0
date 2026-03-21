require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const BOM = require('./models/BOM');
const ECO = require('./models/ECO');
const Company = require('./models/Company');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Check if we need to migrate
    const usersWithoutCompany = await User.countDocuments({ companyId: null });
    const productsWithoutCompany = await Product.countDocuments({ companyId: { $exists: false } });
    
    if (usersWithoutCompany === 0 && productsWithoutCompany === 0) {
      console.log('No records need migration.');
      process.exit(0);
    }

    console.log(`Found ${usersWithoutCompany} users and ${productsWithoutCompany} products without a company.`);

    // 2. Create or find the default company
    let defaultCompany = await Company.findOne({ name: 'Default Company (Legacy)' });
    if (!defaultCompany) {
      defaultCompany = await Company.create({
        name: 'Default Company (Legacy)',
        domain: 'legacy',
        isActive: true,
      });
      console.log(`Created new legacy company: ${defaultCompany._id}`);
    } else {
      console.log(`Using existing legacy company: ${defaultCompany._id}`);
    }

    // 3. Migrate Users
    // Find all active users with no company
    const users = await User.find({ companyId: null });
    let ownerSet = false;
    for (const u of users) {
      u.companyId = defaultCompany._id;
      await u.save();
      
      // Make the first Admin user the owner of the legacy company
      if (u.role === 'admin' && !ownerSet) {
        defaultCompany.owner = u._id;
        await defaultCompany.save();
        console.log(`Set ${u.email} as owner of the legacy company.`);
        ownerSet = true;
      }
    }
    console.log(`Migrated ${users.length} users.`);

    // 4. Migrate Products
    const prodRes = await Product.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: defaultCompany._id } }
    );
    console.log(`Migrated ${prodRes.modifiedCount} products.`);

    // 5. Migrate BOMs
    const bomRes = await BOM.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: defaultCompany._id } }
    );
    console.log(`Migrated ${bomRes.modifiedCount} BOMs.`);

    // 6. Migrate ECOs
    const ecoRes = await ECO.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: defaultCompany._id } }
    );
    console.log(`Migrated ${ecoRes.modifiedCount} ECOs.`);

    console.log('Migration complete!');
    process.exit(0);

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
