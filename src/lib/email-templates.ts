'use server';

import { sendEmail } from '@/lib/email';
import { 
    type PaymentApprovedEmailInput, 
    type SendNewEventEmailInput,
    type PaymentReceiptEmailInput,
    type SendEmailOutput,
    type SendEmailInput,
    type ResetPasswordEmailInput
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
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
            .header { background-color: #059669; padding: 40px 30px; text-align: center; }
            .logo-container { display: inline-table; margin: 0 auto; }
            .logo-icon { display: table-cell; vertical-align: middle; padding-right: 15px; }
            .logo-box { background-color: rgba(255,255,255,0.15); border-radius: 10px; width: 44px; height: 44px; text-align: center; line-height: 44px; }
            .logo-text { display: table-cell; vertical-align: middle; text-align: left; }
            .brand-name { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.5px; font-weight: 700; line-height: 1; }
            .brand-subtitle { color: rgba(255,255,255,0.7); margin: 4px 0 0 0; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600; }
            .content { padding: 40px 35px; color: #334155; line-height: 1.6; font-size: 16px; }
            .content h2 { color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700; margin-bottom: 24px; letter-spacing: -0.025em; }
            .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0; width: 100%; box-sizing: border-box; }
            .details-table { width: 100%; border-collapse: collapse; }
            .details-table td { padding: 14px 0; vertical-align: top; border-bottom: 1px dashed #e2e8f0; }
            .details-table tr:last-child td { border-bottom: none; }
            .label { color: #64748b; font-size: 14px; width: 40%; text-align: left; font-weight: 500; }
            .value { color: #0f172a; font-weight: 600; font-size: 14px; text-align: right; width: 60%; }
            .button-container { text-align: center; margin-top: 40px; }
            .button { background-color: #059669; color: #ffffff !important; padding: 16px 36px; text-decoration: none; border-radius: 10px; font-weight: 700; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25); }
            .footer { background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0; }
            .footer p { color: #94a3b8; font-size: 12px; margin: 6px 0; }
            .status-badge { display: inline-block; padding: 5px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
            .status-success { background-color: #dcfce7; color: #166534; }
            .status-pending { background-color: #fee2e2; color: #991b1b; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo-container">
                    <div class="logo-icon">
                        <div class="logo-box">
                            <span style="font-size: 24px;">🎓</span>
                        </div>
                    </div>
                    <div class="logo-text">
                        <div class="brand-name">FundEd</div>
                        <div class="brand-subtitle">Classroom OS</div>
                    </div>
                </div>
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
                <p>Secure management powered by <strong>FundEd Classroom OS</strong></p>
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
                    <td class="value" style="font-size: 18px; color: #059669;">₹${input.cost.toLocaleString('en-IN')}</td>
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
    const formattedDate = new Date(input.paymentDate).toLocaleString('en-GB', { 
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    }).toUpperCase();
    
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
                    <td class="value">₹${input.amountPaid.toLocaleString('en-IN')}</td>
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
                    <td class="value" style="color: #b91c1c;">₹${input.balanceDue.toLocaleString('en-IN')}</td>
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
export async function sendPaymentApprovedEmail(input: PaymentApprovedEmailInput): Promise<SendEmailOutput> {
    const content = `
        <h2>Payment Approved!</h2>
        <p>Hi <strong>${input.studentName}</strong>,</p>
        <p>Great news! Your payment for <strong>${input.eventName}</strong> has been verified and approved by your class representative.</p>
        
        <div class="details-box">
            <table class="details-table">
                <tr>
                    <td class="label">Amount Approved</td>
                    <td class="value" style="font-size: 18px; color: #059669;">₹${input.amount.toLocaleString('en-IN')}</td>
                </tr>
            </table>
        </div>

        <p>You're all set for this event.</p>
    `;

    const emailHtml = generateEmailLayout(
        `Approved: ${input.eventName}`,
        content,
        { text: 'Check Status', url: input.checkStatusLink }
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

// Flow for sending print distribution email (from send-email.ts)
export async function sendPrintDistributionEmail(input: SendEmailInput): Promise<SendEmailOutput> {

    const emailBody = `
      Hi ${input.studentName},<br><br>
      This is to notify you that the print material for the event "${input.eventName}" has been distributed.<br><br>
      Please collect it from your class representative if you haven't already.<br><br>
      Sincerely,<br>
      The FundEd Team
    `;

    const subject = `Your print for "${input.eventName}" has been distributed!`;
    
    const result = await sendEmail({
        to: input.studentEmail,
        subject: subject,
        html: emailBody,
    });

    if (result.success) {
        return {
            success: true,
            message: `Email successfully sent to ${input.studentEmail}.`,
        };
    } else {
        return {
            success: false,
            message: result.message || 'Failed to send email via the email service.',
        };
    }
}

// Flow for sending password reset email
export async function sendResetPasswordEmail(input: ResetPasswordEmailInput): Promise<SendEmailOutput> {
    const content = `
        <h2>Reset Your Password</h2>
        <p>Hi ${input.name || 'there'},</p>
        <p>We received a request to reset your password for your FundEd account. Click the button below to set a new password. This link will expire in 1 hour.</p>
        
        <div class="details-box" style="text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #64748b;">If you didn't request this, you can safely ignore this email.</p>
        </div>
    `;

    const emailHtml = generateEmailLayout(
        'Reset Your Password',
        content,
        { text: 'Reset Password', url: input.resetLink }
    );

    const result = await sendEmail({
        to: input.email,
        subject: 'Reset Your FundEd Password',
        html: emailHtml,
    });

    return result.success
        ? { success: true, message: `Reset email sent to ${input.email}` }
        : { success: false, message: result.message || 'Failed to send reset email' };
}
