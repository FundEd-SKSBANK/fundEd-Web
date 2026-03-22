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
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  
  const connectionString = (dbUrl || directUrl)?.trim();

  // Logging for troubleshooting in all environments for now
  console.log(`🔌 [Prisma] Debug: DATABASE_URL=${!!dbUrl}, DIRECT_URL=${!!directUrl}, final=${!!connectionString}`);
  if (connectionString) {
    const masked = connectionString.replace(/:[^:@]+@/, ':****@');
    console.log(`🔌 [Prisma] Using connection string: ${masked.substring(0, 20)}...`);
  }

  if (!connectionString || connectionString.length < 10) {
    console.error('❌ [Prisma] FATAL: Neither DATABASE_URL nor DIRECT_URL is defined or valid.');
    throw new Error('Database connection string is missing. Please check your Netlify environment variables.');
  }

  // Masked URL for logging
  const maskedUrl = connectionString.replace(/:[^:@]+@/, ':****@');
  if (isDev) console.log(`🔌 [Prisma] Initializing client with: ${maskedUrl}`);

  try {
    // Determine which adapter to use
    const isNeon = connectionString.includes('neon.tech') || connectionString.includes('pooler') || connectionString.includes('neondb');
    console.log(`🔌 [Prisma] Adapter selection: isNeon=${isNeon}`);

    if (isNeon) {
      console.log('🔌 [Prisma] Initializing Neon adapter...');
      
      // Load optional dependency 'ws' if WebSocket is not globally available
      if (typeof window === 'undefined' && !globalThis.WebSocket) {
        try {
          const ws = require('ws');
          neonConfig.webSocketConstructor = ws;
          console.log('🌐 [Prisma] node-ws loaded.');
        } catch (wsErr) {
          console.error('⚠️ [Prisma] Failed to load optional "ws" dependency:', wsErr);
        }
      }
    }

    // Universal adapter for both Neon and local Postgres
    console.log('🔌 [Prisma] Initializing Universal PG adapter...');
    
    const { Pool: PgPool } = require('pg');
    const { PrismaPg } = require('@prisma/adapter-pg');

    const pool = new PgPool({ 
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    const adapter = new PrismaPg(pool);
    console.log('🔌 [Prisma] Adapter initialized successfully.');
    
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
```
