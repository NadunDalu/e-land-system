require('dotenv').config();
const { sendOTPEmail } = require('./services/emailService');

async function testEmail() {
    console.log('Testing email configuration...\n');
    
    // Check if email is configured
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-actual-email@gmail.com') {
        console.log('❌ Email not configured yet!');
        console.log('Please update EMAIL_USER and EMAIL_PASS in your .env file');
        return;
    }
    
    console.log('📧 Email User:', process.env.EMAIL_USER);
    console.log('🔑 Email Pass:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');
    console.log('');
    
    // Test sending email
    console.log('Sending test email...');
    try {
        const result = await sendOTPEmail(
            process.env.EMAIL_USER, // Send to yourself for testing
            '123456',
            'Test User'
        );
        
        if (result) {
            console.log('✅ Email sent successfully!');
            console.log('Check your inbox for the test email.');
        } else {
            console.log('❌ Email sending failed');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        
        if (error.message.includes('Invalid login')) {
            console.log('\n💡 Troubleshooting:');
            console.log('1. Make sure you\'re using an App Password, not your regular Gmail password');
            console.log('2. Verify 2-Step Verification is enabled on your Google account');
            console.log('3. Check that the App Password is correct (16 characters, no spaces)');
        }
    }
}

testEmail();