const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create transporter with flexible configuration
const createTransporter = () => {
    const emailConfig = {
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'your-email@gmail.com',
            pass: process.env.EMAIL_PASS || 'your-app-password'
        }
    };

    // If custom SMTP settings are provided
    if (process.env.EMAIL_HOST) {
        emailConfig.host = process.env.EMAIL_HOST;
        emailConfig.port = parseInt(process.env.EMAIL_PORT) || 587;
        emailConfig.secure = process.env.EMAIL_SECURE === 'true';
        delete emailConfig.service; // Remove service when using custom SMTP
    }

    return nodemailer.createTransport(emailConfig);
};

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Send OTP email
const sendOTPEmail = async (email, otp, fullName) => {
    try {
        // Check if email configuration is set up
        if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
            console.warn('Email service not configured. OTP would be sent to:', email);
            console.log(`OTP for ${fullName}: ${otp}`);
            return true; // Return true for development/testing
        }

        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@eland-system.lk',
            to: email,
            subject: 'E-Land System - Email Verification OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">E-Land Registry System</h1>
                        <p style="color: white; margin: 5px 0;">Sri Lanka Land Registry</p>
                    </div>
                    
                    <div style="padding: 30px; background: #f9f9f9;">
                        <h2 style="color: #333;">Email Verification Required</h2>
                        <p>Dear ${fullName},</p>
                        <p>Thank you for registering with the E-Land Registry System. To complete your registration, please verify your email address using the OTP below:</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
                            <p style="color: #666; margin: 10px 0;">This OTP will expire in 10 minutes</p>
                        </div>
                        
                        <p><strong>Important:</strong> After email verification, your account will be reviewed by our administrators for approval.</p>
                        
                        <p>If you didn't request this registration, please ignore this email.</p>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                        <p style="color: #666; font-size: 12px;">
                            This is an automated message from E-Land Registry System.<br>
                            Please do not reply to this email.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        // For development, still return true and log the OTP
        if (process.env.NODE_ENV === 'development') {
            console.log(`Development mode - OTP for ${fullName}: ${otp}`);
            return true;
        }
        return false;
    }
};

// Send welcome email after admin approval
const sendWelcomeEmail = async (email, fullName, username, profession) => {
    try {
        // Check if email configuration is set up
        if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
            console.warn('Email service not configured. Welcome email would be sent to:', email);
            console.log(`Welcome email for ${fullName} (${username}) - ${profession}`);
            return true; // Return true for development/testing
        }

        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@eland-system.lk',
            to: email,
            subject: 'Welcome to E-Land Registry System - Account Approved',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">E-Land Registry System</h1>
                        <p style="color: white; margin: 5px 0;">Sri Lanka Land Registry</p>
                    </div>
                    
                    <div style="padding: 30px; background: #f9f9f9;">
                        <h2 style="color: #28a745;">🎉 Account Approved!</h2>
                        <p>Dear ${fullName},</p>
                        <p>Congratulations! Your registration as a <strong>${profession}</strong> has been approved by our administrators.</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #333; margin-top: 0;">Your Account Details:</h3>
                            <p><strong>Username:</strong> ${username}</p>
                            <p><strong>Profession:</strong> ${profession}</p>
                            <p><strong>Access Level:</strong> Read-only access to land records</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/external-login" 
                               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Login to Your Account
                            </a>
                        </div>
                        
                        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="color: #1976d2; margin-top: 0;">What you can do:</h4>
                            <ul style="color: #333;">
                                <li>Search and view land records</li>
                                <li>Verify property ownership details</li>
                                <li>Access deed information for legal purposes</li>
                                <li>Download verification reports</li>
                            </ul>
                        </div>
                        
                        <p>If you have any questions or need assistance, please contact our support team.</p>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                        <p style="color: #666; font-size: 12px;">
                            This is an automated message from E-Land Registry System.<br>
                            Please do not reply to this email.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        // For development, still return true and log the action
        if (process.env.NODE_ENV === 'development') {
            console.log(`Development mode - Welcome email for ${fullName} (${username}) - ${profession}`);
            return true;
        }
        return false;
    }
};

module.exports = {
    generateOTP,
    generateVerificationToken,
    sendOTPEmail,
    sendWelcomeEmail
};