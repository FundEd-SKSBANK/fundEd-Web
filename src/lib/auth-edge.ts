/**
 * Edge-safe auth utilities — NO next/headers import here.
 * This file is safe to import in middleware (Edge Runtime).
 */
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'secret-key';
const key = new TextEncoder().encode(secretKey);

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}
