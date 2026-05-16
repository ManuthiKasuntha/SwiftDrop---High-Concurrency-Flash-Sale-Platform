import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@swiftdrop.com' },
    update: {},
    create: {
      email: 'admin@swiftdrop.com',
      displayName: 'System Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create Customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer@swiftdrop.com' },
    update: {},
    create: {
      email: 'customer@swiftdrop.com',
      displayName: 'Jane Doe',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  });

  // Create Sample Event
  const goLiveTime = new Date();
  goLiveTime.setMinutes(goLiveTime.getMinutes() + 5); // 5 minutes from now

  const event = await prisma.event.create({
    data: {
      name: 'Summer Tech Blowout',
      coverPhoto: 'https://images.unsplash.com/photo-1550009158-9ebf6d1736eb?auto=format&fit=crop&q=80&w=1000',
      goLiveTime: goLiveTime,
      status: 'LOCKED',
      items: {
        create: [
          {
            name: 'Noise Cancelling Headphones Pro',
            price: 99.99,
            stock: 150,
          },
          {
            name: 'Smart Fitness Watch',
            price: 49.50,
            stock: 200,
          },
        ],
      },
    },
  });

  console.log('Database seeded successfully');
  console.log('Admin:', admin.email);
  console.log('Customer:', customer.email);
  console.log('Event:', event.name, 'Goes live at:', goLiveTime);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
