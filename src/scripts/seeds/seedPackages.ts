import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../../shared/config/database';
import { PackagePlan } from '../../shared/models/extended/TeacherPackage';

async function run() {
  try {
    await connectDB();
    const defaults = [
      { name: 'Free', description: 'Basic plan', maxCourses: 1, price: 0, billingCycle: 'monthly', features: ['basic'], isActive: true, version: 1 },
      { name: 'Basic', description: 'Up to 5 courses', maxCourses: 5, price: 99000, billingCycle: 'monthly', features: ['support:email'], isActive: true, version: 1 },
      { name: 'Pro', description: 'Up to 20 courses', maxCourses: 20, price: 299000, billingCycle: 'monthly', features: ['support:priority'], isActive: true, version: 1 },
    ] as const;

    for (const d of defaults) {
      const exists = await PackagePlan.findOne({ name: d.name });
      if (!exists) {
        await PackagePlan.create(d as any);
        console.log(`Created package: ${d.name}`);
      } else {
        console.log(`Package exists: ${d.name}`);
      }
    }

    await mongoose.connection.close();
    console.log('Done.');
  } catch (err) {

    process.exit(1);
  }
}

run();


