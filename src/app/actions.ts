'use server';

import { 
  sendPrintDistributionEmail as sendPrintDistributionEmailTemplate, 
  sendPaymentReceiptEmail as sendPaymentReceiptEmailTemplate, 
  sendPaymentApprovedEmail as sendPaymentApprovedEmailTemplate 
} from '@/lib/email-templates';
import { headers } from 'next/headers';
import type { SendEmailInput, SendEmailOutput, PaymentReceiptEmailInput, PaymentApprovedEmailInput } from '@/lib/types';


export async function sendPrintDistributionEmail(input: SendEmailInput): Promise<SendEmailOutput> {
  return await sendPrintDistributionEmailTemplate(input);
}


export async function sendPaymentReceiptEmail(input: PaymentReceiptEmailInput): Promise<SendEmailOutput> {
    return await sendPaymentReceiptEmailTemplate(input);
}

export async function sendPaymentApprovedEmail(input: PaymentApprovedEmailInput & { adminSlug?: string }): Promise<SendEmailOutput> {
    const { adminSlug, ...rest } = input;
    
    // If checkStatusLink is already provided and valid, use it. 
    // Otherwise, construct it if adminSlug is available.
    if (!rest.checkStatusLink && adminSlug) {
        const headerList = await headers();
        const host = headerList.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        const appUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000');
        const baseUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;
        rest.checkStatusLink = `${baseUrl}/check-status/${adminSlug}`;
    }

    // Safety fallback
    if (!rest.checkStatusLink) {
        rest.checkStatusLink = '#';
    }

    return await sendPaymentApprovedEmailTemplate(rest);
}
