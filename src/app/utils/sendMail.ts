import nodemailer from 'nodemailer';
import config from '../config';

const transporter = nodemailer.createTransport({
  host: config.email_host, // e.g., smtp.zoho.com
  port: 465, // SSL uses 465
  secure: true, // true for port 465 (SSL), false for port 587 (TLS)
  auth: {
    user: config.email_user,
    pass: config.email_pass,
  },
  tls: {
    rejectUnauthorized: false, // Allows self-signed certificates if needed
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string,
) => {
  try {
    console.log(`📤 Sending email to ${to}...`); // Debugging log

    const info = await transporter.sendMail({
      from: config.email_from,
      to,
      subject,
      text,
      html: html || text,
    });

    console.log(`✅ Email sent: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
};
