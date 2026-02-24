'use server';

import { sendEmail } from '@/lib/email';
import { z } from 'zod';

const supportSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function sendSupportEmail(formData: z.infer<typeof supportSchema>) {
  const result = supportSchema.safeParse(formData);

  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const { name, email, subject, message } = result.data;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #10b981;">New Support Request</h2>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin-top: 10px;">
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
      <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #666;">Sent from FundEd Support Form</p>
    </div>
  `;

  try {
    const emailResult = await sendEmail({
      to: 'sksdmprod@gmail.com',
      subject: `Support: ${subject}`,
      html,
    });

    if (emailResult.success) {
      return { success: true, message: "Support request sent successfully!" };
    } else {
      return { success: false, error: emailResult.message || "Failed to send support request." };
    }
  } catch (error) {
    console.error('Support action error:', error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
