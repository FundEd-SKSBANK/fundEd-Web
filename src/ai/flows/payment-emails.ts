'use server';
/**
 * @fileOverview Genkit flows for sending payment-related emails.
 */

import { sendEmail } from '@/lib/email';
import { 
    PaymentApprovedEmailInputSchema, 
    SendNewEventEmailInputSchema,
    PaymentReceiptEmailInputSchema,
    SendEmailOutputSchema,
    type PaymentApprovedEmailInput, 
    type SendNewEventEmailInput,
    type PaymentReceiptEmailInput,
    type SendEmailOutput
} from '@/lib/types';


// --- Email Template Helper ---
const generateEmailLayout = (title: string, contentHtml: string, actionButton?: { text: string, url: string }) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
            .header { background-color: #10b981; padding: 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px; font-weight: 700; }
            .content { padding: 40px 30px; color: #334155; line-height: 1.6; font-size: 16px; }
            .content h2 { color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 600; margin-bottom: 20px; }
            .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; width: 100%; box-sizing: border-box; }
            .details-table { width: 100%; border-collapse: collapse; }
            .details-table td { padding: 12px 0; vertical-align: top; border-bottom: 1px dashed #e2e8f0; }
            .details-table tr:last-child td { border-bottom: none; }
            .label { color: #64748b; font-size: 14px; width: 40%; text-align: left; }
            .value { color: #0f172a; font-weight: 600; font-size: 14px; text-align: right; width: 60%; }
            .button-container { text-align: center; margin-top: 35px; }
            .button { background-color: #10b981; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2); }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
            .footer p { color: #94a3b8; font-size: 12px; margin: 5px 0; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
            .status-success { background-color: #dcfce7; color: #166534; }
            .status-pending { background-color: #fee2e2; color: #991b1b; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>FundEd</h1>
            </div>
            <div class="content">
                ${contentHtml}
                
                ${actionButton ? `
                <div class="button-container">
                    <a href="${actionButton.url}" class="button">${actionButton.text}</a>
                </div>
                ` : ''}
            </div>
            <div class="footer">
                <p>Secure payment powered by FundEd Classroom OS</p>
                <p>&copy; ${new Date().getFullYear()} FundEd. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};


// Flow for sending new event notification
export async function sendNewEventEmail(input: SendNewEventEmailInput): Promise<SendEmailOutput> {
    const formattedDate = new Date(input.deadline).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const content = `
        <h2>Hi ${input.studentName},</h2>
        <p>A new fund collection has been started for your class. You are invited to participate via FundEd.</p>
        
        <div class="details-box">
            <table class="details-table">
                <tr>
                    <td class="label">Event</td>
                    <td class="value">${input.eventName}</td>
                </tr>
                <tr>
                    <td class="label">Amount Due</td>
                    <td class="value" style="font-size: 18px; color: #059669;">₹${input.cost.toLocaleString()}</td>
                </tr>
                <tr>
                    <td class="label">Deadline</td>
                    <td class="value">${formattedDate}</td>
                </tr>
            </table>
            ${input.eventDescription ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #cbd5e1;">
                <span style="display:block; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Note</span>
                <span style="font-size: 14px; color: #475569; display: block;">${input.eventDescription}</span>
            </div>` : ''}
        </div>
        
        <p>Please complete your payment before the deadline to ensure smooth processing.</p>
    `;

    const emailHtml = generateEmailLayout(
        `New Collection: ${input.eventName}`, 
        content,
        { text: 'Pay Now ', url: input.paymentLink }
    );

    const result = await sendEmail({
        to: input.studentEmail,
        subject: `New Fund Collection: ${input.eventName}`,
        html: emailHtml,
    });

    return result.success 
        ? { success: true, message: `Email sent to ${input.studentEmail}` }
        : { success: false, message: result.message || 'Failed to send email' };
}

// Flow for sending simple payment receipt
export async function sendPaymentReceiptEmail(input: PaymentReceiptEmailInput): Promise<SendEmailOutput> {
    const isFullPayment = input.balanceDue <= 0;
    const formattedDate = new Date(input.paymentDate).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const content = `
        <h2>Payment Received</h2>
        <p>Hi <strong>${input.studentName}</strong>, we have received your payment. Thank you for your contribution.</p>
        
        <div class="details-box">
             <table class="details-table">
                <tr>
                    <td class="label">Event</td>
                    <td class="value">${input.eventName}</td>
                </tr>
                <tr>
                    <td class="label">Transaction ID</td>
                    <td class="value" style="font-family: monospace;">${input.transactionId}</td>
                </tr>
                <tr>
                    <td class="label">Date</td>
                    <td class="value">${formattedDate}</td>
                </tr>
                <tr>
                    <td class="label">Paid Now</td>
                    <td class="value">₹${input.amountPaid.toLocaleString()}</td>
                </tr>
                 <tr>
                    <td class="label">Status</td>
                    <td class="value">
                        <span class="status-badge ${isFullPayment ? 'status-success' : 'status-pending'}">
                            ${isFullPayment ? 'Complete' : 'Partial'}
                        </span>
                    </td>
                </tr>
                ${!isFullPayment ? `
                <tr>
                    <td class="label" style="color: #b91c1c;">Balance Remaining</td>
                    <td class="value" style="color: #b91c1c;">₹${input.balanceDue.toLocaleString()}</td>
                </tr>` : ''}
            </table>
        </div>

        <p>${isFullPayment ? 'You are all set! No further action is required.' : 'Please pay the remaining balance at your earliest convenience.'}</p>
    `;

    const emailHtml = generateEmailLayout(
        `Receipt: ${input.eventName}`,
        content,
        { text: 'Check Status', url: input.checkStatusLink }
    );

    const result = await sendEmail({
        to: input.studentEmail,
        subject: `Payment Receipt: ${input.eventName}`,
        html: emailHtml,
    });

    return result.success 
        ? { success: true, message: `Receipt sent to ${input.studentEmail}` }
        : { success: false, message: result.message || 'Failed to send receipt' };
}


// Flow for sending payment approved email
async function sendPaymentApprovedEmailFlow(input: PaymentApprovedEmailInput): Promise<SendEmailOutput> {
    const content = `
        <h2>Payment Approved!</h2>
        <p>Hi <strong>${input.studentName}</strong>,</p>
        <p>Great news! Your payment for <strong>${input.eventName}</strong> has been verified and approved by your class representative.</p>
        
        <div class="details-box">
            <table class="details-table">
                <tr>
                    <td class="label">Amount Approved</td>
                    <td class="value" style="font-size: 18px; color: #059669;">₹${input.amount.toLocaleString()}</td>
                </tr>
            </table>
        </div>

        <p>You're all set for this event.</p>
    `;

    const emailHtml = generateEmailLayout(
        `Approved: ${input.eventName}`,
        content,
        { text: 'View Dashboard', url: process.env.NEXT_PUBLIC_APP_URL || '#' }
    );
    
    const result = await sendEmail({
        to: input.studentEmail,
        subject: `Approved: Payment for ${input.eventName}`,
        html: emailHtml,
    });

    return result.success 
        ? { success: true, message: `Email successfully sent to ${input.studentEmail}.` }
        : { success: false, message: result.message || 'Failed to send email.' };
}


// Wrapper action for the payment approved flow
export async function sendPaymentApprovedEmail(input: PaymentApprovedEmailInput): Promise<SendEmailOutput> {
  return await sendPaymentApprovedEmailFlow(input);
}
