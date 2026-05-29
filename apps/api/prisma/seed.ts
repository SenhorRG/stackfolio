import { PrismaClient } from '@prisma/client';
import { seedSkills } from './seed-skills';
import {
  resolveDefaultUserSeedConfig,
  seedDefaultUser,
} from './seed/seed-default-user';

const prisma = new PrismaClient();

async function main() {
  const skillMap = await seedSkills(prisma);
  await seedDefaultUser(prisma, skillMap, resolveDefaultUserSeedConfig());
  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
