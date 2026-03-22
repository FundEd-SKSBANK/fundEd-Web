// import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
// import { Pool as PgPool } from 'pg';
// import { PrismaPg } from '@prisma/adapter-pg';
// import ws from 'ws';

// Use standard TCP for local development to avoid ECONNRESET issues with WebSockets.
// We use @prisma/adapter-pg locally to satisfy the driverAdapters requirement in schema.prisma.

// Initialized inside prismaClientSingleton to be more resilient

const prismaClientSingleton = () => {
  const isDev = process.env.NODE_ENV === 'development';
  const rawUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  const connectionString = rawUrl?.trim();

  if (!connectionString || connectionString.length < 10) {
    if (!isDev) console.error('❌ [Prisma] FATAL: DATABASE_URL is not defined or invalid.');
    throw new Error('DATABASE_URL environment variable is missing or invalid!');
  }

  try {
    // Determine which adapter to use
    const isNeon = connectionString.includes('neon.tech') || connectionString.includes('pooler');

    if (isNeon) {
      if (isDev) console.log('🔌 [Prisma] Initializing Neon adapter...');
      
      // Load optional dependency 'ws' if WebSocket is not globally available
      if (typeof window === 'undefined' && !globalThis.WebSocket) {
        try {
          const ws = require('ws');
          neonConfig.webSocketConstructor = ws;
          if (isDev) console.log('🌐 [Prisma] node-ws loaded.');
        } catch (wsErr) {
          console.error('⚠️ [Prisma] Failed to load optional "ws" dependency:', wsErr);
        }
      }

      const pool = new NeonPool({ connectionString });
      const adapter = new PrismaNeon(pool as any);
      
      return new PrismaClient({ 
        adapter,
        log: isDev ? ['query', 'error', 'warn'] : ['error']
      });
    }

    // Standard Postgres (local or other provider)
    if (isDev) console.log('🔌 [Prisma] Initializing PG adapter...');
    const { Pool: PgPool } = require('pg');
    const { PrismaPg } = require('@prisma/adapter-pg');

    const pool = new PgPool({ 
      connectionString,
      max: 5,
      idleTimeoutMillis: 150000,
      connectionTimeoutMillis: 10000,
    });
    const adapter = new PrismaPg(pool as any);
    
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
    if (!globalThis.prisma) {
      globalThis.prisma = prismaClientSingleton();
    }
    return Reflect.get(globalThis.prisma, prop, receiver);
  }
});

export default prismaProxy;

if (process.env.NODE_ENV !== 'production' && !globalThis.prisma) {
  // In development, we might want to pre-initialize or just leave it to the proxy
  // but we don't want to overwrite it if it's already there (HMR)
}
