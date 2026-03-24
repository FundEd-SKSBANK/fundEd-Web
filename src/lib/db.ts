import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Ensure environment variables are loaded regardless of Next.js state
try {
  require('dotenv').config();
} catch (e) {}

const connectionString = (process.env.DATABASE_URL || process.env.DIRECT_URL || '').trim();

const prismaClientSingleton = () => {
  if (!connectionString) {
    console.error('❌ [DB] DATABASE_URL is missing in environment!');
  }

  const pool = new Pool({ 
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
  });
  
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  });
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Fixed singleton pattern for Next.js HMR
const prisma = globalThis.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export const getPrismaClient = () => prisma;

export default prisma;
