import { MailService } from '../src/mail/mail.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  console.log('Testing SMTP connection and Member Added Email...');
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ ERROR: SMTP_USER and SMTP_PASSWORD must be set in .env');
    process.exit(1);
  }

  const mailService = new MailService();

  console.log(`Using SMTP server: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
  console.log(`Sending as: ${process.env.SMTP_FROM || process.env.SMTP_USER}`);

  const result = await mailService.sendMemberAddedEmail(
    process.env.SMTP_USER, // send to self
    'Test User',
    'Acme Board of Directors',
    'BOARD_MEMBER',
    'Finance Committee Chair',
    'CEO John Doe'
  );

  if (result.success) {
    console.log('✅ Success! Email sent successfully. Message ID:', result.messageId);
  } else {
    console.error('❌ Failed to send email.', result.error);
  }
}

testEmail().catch(console.error);
