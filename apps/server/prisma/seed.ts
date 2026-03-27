import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function upsertUser(username: string, password: string, role: UserRole) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { username },
    update: { passwordHash, role },
    create: {
      username,
      passwordHash,
      role,
      preferences: {
        create: {},
      },
    },
  });
}

async function main() {
  await prisma.runtimePolicy.upsert({
    where: { policyKey: 'system' },
    update: {},
    create: {
      policyKey: 'system',
      maxConcurrentAiGames: 20,
      maxOngoingGamesPerUser: 1,
      maxUndoPerGame: 5,
      registrationMode: 'CLOSED',
    },
  });

  const admin = await upsertUser('admin', 'admin123', UserRole.ADMIN);
  const demo = await upsertUser('demo', 'demo123', UserRole.USER);

  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: admin.id,
        action: 'seed.user.ensure',
        targetType: 'user',
        targetId: admin.id,
        summary: '初始化默认管理员账号 admin',
      },
      {
        actorUserId: admin.id,
        action: 'seed.user.ensure',
        targetType: 'user',
        targetId: demo.id,
        summary: '初始化默认演示账号 demo',
      },
    ],
  });

  console.log('Seeded users: admin/admin123, demo/demo123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
