const { sendOTPEmail, sendWelcomeEmail, generateOTP } = require('./services/emailService');

// Test the email service
async function testEmailService() {
    console.log('Testing E-Land Email Service...\n');
    
    // Test OTP generation
    const otp = generateOTP();
    console.log('Generated OTP:', otp);
    console.log('OTP Length:', otp.length);
    console.log('OTP is numeric:', /^\d+$/.test(otp));
    console.log('');
    
    // Test OTP email (will log to console if email not configured)
    console.log('Testing OTP Email...');
    const otpResult = await sendOTPEmail('test@example.com', otp, 'John Doe');
    console.log('OTP Email Result:', otpResult ? 'SUCCESS' : 'FAILED');
    console.log('');
    
    // Test welcome email (will log to console if email not configured)
    console.log('Testing Welcome Email...');
    const welcomeResult = await sendWelcomeEmail('test@example.com', 'John Doe', 'johndoe', 'lawyer');
    console.log('Welcome Email Result:', welcomeResult ? 'SUCCESS' : 'FAILED');
    console.log('');
    
    console.log('Email service test completed!');
    console.log('');
    console.log('If email is not configured, check the console output above for the email content.');
    console.log('To configure email, update the EMAIL_USER and EMAIL_PASS in your .env file.');
}

// Run the test
testEmailService().catch(console.error);