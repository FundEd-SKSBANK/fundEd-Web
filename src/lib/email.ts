'use server';

import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions) {
  if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
    console.error('Email credentials are not configured in .env file.');
    return { success: false, message: 'Email service is not configured.' };
  }
  
  try {
    // Create transporter inside the function to ensure env variables are read at runtime
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"FundEd" <${process.env.GMAIL_EMAIL}>`, // sender address
      ...options,
    });

    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    // In production, you'd want more robust error handling and logging.
    return { success: false, message: 'Failed to send email.' };
  }
}
