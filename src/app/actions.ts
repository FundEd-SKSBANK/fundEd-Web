'use server';

import { 
  sendPrintDistributionEmail as sendPrintDistributionEmailTemplate, 
  sendPaymentReceiptEmail as sendPaymentReceiptEmailTemplate, 
  sendPaymentApprovedEmail as sendPaymentApprovedEmailTemplate 
} from '@/lib/email-templates';
import type { SendEmailInput, SendEmailOutput, PaymentReceiptEmailInput, PaymentApprovedEmailInput } from '@/lib/types';


export async function sendPrintDistributionEmail(input: SendEmailInput): Promise<SendEmailOutput> {
  return await sendPrintDistributionEmailTemplate(input);
}


export async function sendPaymentReceiptEmail(input: PaymentReceiptEmailInput): Promise<SendEmailOutput> {
    return await sendPaymentReceiptEmailTemplate(input);
}

export async function sendPaymentApprovedEmail(input: PaymentApprovedEmailInput): Promise<SendEmailOutput> {
    return await sendPaymentApprovedEmailTemplate(input);
}
