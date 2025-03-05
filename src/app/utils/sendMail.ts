// src/utils/sendEmail.ts
import nodemailer from 'nodemailer';
import config from '../config';

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: config.email_host,
  port: Number(config.email_port),
  secure: config.email_secure === 'true',
  auth: {
    user: config.email_user,
    pass: config.email_pass,
  },
});

// Send email function
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string,
) => {
  try {
    await transporter.sendMail({
      from: config.email_from,
      to,
      subject,
      text,
      html: html || text,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
