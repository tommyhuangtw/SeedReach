import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text: body,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "寄送失敗";
    console.error(`Failed to send email to ${to}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Send emails one-by-one with a delay between each to avoid Gmail rate limits.
 */
export async function sendBulkEmails(
  emails: { to: string; subject: string; body: string }[]
): Promise<{ to: string; success: boolean; error?: string }[]> {
  const results: { to: string; success: boolean; error?: string }[] = [];

  for (let i = 0; i < emails.length; i++) {
    const result = await sendEmail(emails[i]);
    results.push({ to: emails[i].to, ...result });

    // 1s delay between sends (skip after last)
    if (i < emails.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return results;
}
