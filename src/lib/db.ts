import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool as PgPool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import ws from 'ws';

// Use standard TCP for local development to avoid ECONNRESET issues with WebSockets.
// We use @prisma/adapter-pg locally to satisfy the driverAdapters requirement in schema.prisma.

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const prismaClientSingleton = () => {
  const rawUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  const connectionString = rawUrl?.trim();

  if (!connectionString || connectionString.length < 10) {
    throw new Error('DATABASE_URL environment variable is missing or invalid!');
  }

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    const pool = new PgPool({ 
      connectionString,
      max: 5,
      idleTimeoutMillis: 150000,     // 2.5 min — retire before Neon closes at ~5 min
      connectionTimeoutMillis: 10000, // 10s timeout when acquiring a connection
    });
    const adapter = new PrismaPg(pool as any);
    return new PrismaClient({ 
      adapter,
      log: ['error', 'warn'] 
    });
  }

  const pool = new NeonPool({ connectionString });
  const adapter = new PrismaNeon(pool as any);
  
  return new PrismaClient({ 
    adapter,
    log: ['error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
