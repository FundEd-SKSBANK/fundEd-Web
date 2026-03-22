import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

const orderSchema = z.object({
  amount: z.number().positive(),
  eventId: z.string(),
  studentId: z.string(),
});

export async function POST(request: Request) {
  const body = await request.json();

  const validation = orderSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
  }

  const { amount, eventId, studentId } = validation.data;

  // Validate Razorpay credentials are present so initialization doesn't fail
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('Razorpay keys missing. Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in environment.');
    return NextResponse.json({ error: 'Razorpay not configured on server' }, { status: 500 });
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  /**
   * Build a Razorpay receipt string that is at most 40 characters.
   * If a readable receipt would be <=40 chars return it, otherwise
   * return a short hashed receipt like `rcpt_<hex>` (kept under 40 chars).
   */
  function makeReceipt(eId: string, sId: string) {
    const readable = `receipt_event_${eId}_student_${sId}`;
    if (readable.length <= 40) return readable;
    // create a short stable hex hash and use a short prefix
    const hash = createHash('sha256').update(`${eId}:${sId}`).digest('hex');
    // rcpt_ + 32 hex chars = 5 + 32 = 37 chars (safe under 40)
    return `rcpt_${hash.slice(0, 32)}`;
  }

  const options = {
    amount: amount * 100, // amount in the smallest currency unit
    currency: 'INR',
    receipt: makeReceipt(eventId, studentId),
    notes: {
      eventId,
      studentId,
    },
  };

  try {
    const order = await razorpay.orders.create(options);
    return NextResponse.json(order);
  } catch (error: any) {
    // Log useful error details but avoid dumping secrets
    try {
      console.error('Razorpay order creation failed:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (e) {
      console.error('Razorpay order creation failed (could not stringify error):', error);
    }
    return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
  }
}
