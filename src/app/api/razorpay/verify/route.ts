import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import crypto from 'crypto';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Razorpay secret not configured' }, { status: 500 });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Find payment by razorpay_order_id
      const payment = await prisma.payment.findFirst({
        where: { razorpay_order_id }
      });

      if (payment) {
        // Update the payment doc to Paid
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'Paid',
            transactionId: razorpay_payment_id,
          }
        });
        return NextResponse.json({ success: true, message: 'Payment verified and updated' });
      } else {
        return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
