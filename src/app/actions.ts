'use server';

import { sendPrintDistributionEmail as sendPrintDistributionEmailFlow } from '@/ai/flows/send-email';
import { sendPaymentReceiptEmail as sendPaymentReceiptEmailFlow, sendPaymentApprovedEmail as sendPaymentApprovedEmailFlow } from '@/ai/flows/payment-emails';
import type { SendEmailInput, SendEmailOutput, PaymentReceiptEmailInput, PaymentApprovedEmailInput } from '@/lib/types';


export async function sendPrintDistributionEmail(input: SendEmailInput): Promise<SendEmailOutput> {
  return await sendPrintDistributionEmailFlow(input);
}


export async function sendPaymentReceiptEmail(input: PaymentReceiptEmailInput): Promise<SendEmailOutput> {
    return await sendPaymentReceiptEmailFlow(input);
}

export async function sendPaymentApprovedEmail(input: PaymentApprovedEmailInput): Promise<SendEmailOutput> {
    return await sendPaymentApprovedEmailFlow(input);
}
