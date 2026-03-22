import { PrismaClient } from '@prisma/client';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
// import { Pool as PgPool } from 'pg';
// import { PrismaPg } from '@prisma/adapter-pg';
// import ws from 'ws';

// Use standard TCP for local development to avoid ECONNRESET issues with WebSockets.
// We use @prisma/adapter-pg locally to satisfy the driverAdapters requirement in schema.prisma.

// Initialized inside prismaClientSingleton to be more resilient

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

// Lazy initialization using a Proxy
const prismaProxy = new Proxy({} as ReturnType<typeof prismaClientSingleton>, {
  get: (target, prop, receiver) => {
    if (!(globalThis as any).prisma) {
      (globalThis as any).prisma = prismaClientSingleton();
    }
    return Reflect.get((globalThis as any).prisma, prop, receiver);
  }
});

export default prismaProxy;

if (process.env.NODE_ENV !== 'production' && !globalThis.prisma) {
  // In development, we might want to pre-initialize or just leave it to the proxy
  // but we don't want to overwrite it if it's already there (HMR)
}
