import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const isDev = process.env.NODE_ENV === 'development';
  const connectionString = (process.env.DATABASE_URL || process.env.DIRECT_URL || '').trim();

  if (!connectionString || connectionString.length < 10) {
    throw new Error('Database connection string is missing or invalid.');
  }

  try {
    // Universal adapter for both Neon and local Postgres
    const { Pool: PgPool } = require('pg');
    const { PrismaPg } = require('@prisma/adapter-pg');

    const pool = new PgPool({ 
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    const adapter = new PrismaPg(pool);
    
    return new PrismaClient({ 
      adapter,
      log: isDev ? ['query', 'error', 'warn'] : ['error']
    });
  } catch (err) {
    console.error('❌ [Prisma] Initialization failed:', err);
    throw err;
  }
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Lazy initialization using a Proxy to handle Next.js environment correctly
const prismaProxy = new Proxy({} as ReturnType<typeof prismaClientSingleton>, {
  get: (target, prop, receiver) => {
    if (!(globalThis as any).prisma) {
      (globalThis as any).prisma = prismaClientSingleton();
    }
    return Reflect.get((globalThis as any).prisma, prop, receiver);
  }
});

export default prismaProxy;
