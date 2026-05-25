import { PrismaClient } from '@prisma/client';

declare global {
 
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple Prisma instances in development 
export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export const connectDB = async (): Promise<void> => {
  await prisma.$connect();
  console.log('✅ PostgreSQL connected via Prisma');
};
