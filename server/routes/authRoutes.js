const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
// const ExternalUserRegistration = require('../models/ExternalUserRegistration'); // Deprecated
const ExternalUser = require('../models/ExternalUser');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/authMiddleware');
const requireSuperAdmin = require('../middleware/roleMiddleware');
const { requireSuperAdminOrSadmin } = require('../middleware/roleMiddleware');
const { generateOTP, sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');

// Register External User (Public endpoint)
router.post('/register-external', async (req, res) => {
    try {
        const {
            fullName,
            email,
            phoneNumber,
            username,
            password,
            profession,
            gender,
            province,
            district
        } = req.body;

        // Validate required fields
        if (!fullName || !email || !phoneNumber || !username || !password || !profession || !gender || !province || !district) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate profession
        if (!['lawyer', 'notary'].includes(profession)) {
            return res.status(400).json({ message: 'Invalid profession. Must be lawyer or notary.' });
        }

        // Validate gender
        if (!['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({ message: 'Invalid gender selection.' });
        }

        // Validate email format
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }

        // Validate Sri Lankan phone number
        const phoneRegex = /^\+94[0-9]{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ message: 'Please enter a valid Sri Lankan phone number (+94xxxxxxxxx).' });
        }

        // Check unique username in BOTH collections
        const existingUser = await User.findOne({ username });
        const existingExternal = await ExternalUser.findOne({ username });
        if (existingUser || existingExternal) {
            return res.status(400).json({ message: 'Username already exists. Please choose a different username.' });
        }

        // Check unique email in BOTH collections
        const existingEmail = await User.findOne({ email });
        const existingExternalEmail = await ExternalUser.findOne({ email });
        if (existingEmail || existingExternalEmail) {
            return res.status(400).json({ message: 'Email already registered. Please use a different email address.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create new external user in dedicated collection
        const newUser = new ExternalUser({
            fullName,
            email,
            phoneNumber,
            username,
            passwordHash,
            role: profession,
            userType: 'external',
            profession,
            gender,
            province,
            district,
            registrationStatus: 'pending',
            emailVerified: false,
            emailVerificationToken: otp,
            emailVerificationExpires: otpExpires
        });

        await newUser.save();

        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp, fullName);
        if (!emailSent) {
            // Rollback if email fails? Or just let them resend?
            // For now, let's keep it and they can resend.
            console.error('Failed to send verification email');
        }

        // Log registration
        const log = new AuditLog({
            transactionId: `REG-EXT-REQ-${Date.now()}`,
            action: 'create user',
            performedBy: 'system',
            details: `External user registration requested: ${username} (${profession}) - Stored in ExternalUser collection`
        });
        await log.save();

        res.status(201).json({
            message: 'Registration submitted successfully. Please check your email for the OTP verification code.',
            registrationId: newUser._id
        });
    } catch (err) {
        console.error('External registration error:', err.message);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Verify Email with OTP
router.post('/verify-email', async (req, res) => {
    try {
        const { registrationId, otp } = req.body;
        console.log(`[VERIFY-EMAIL] Request received for ID: ${registrationId}, OTP: ${otp}`);

        if (!registrationId || !otp) {
            return res.status(400).json({ message: 'Registration ID and OTP are required' });
        }

        // Check in ExternalUser collection
        const user = await ExternalUser.findById(registrationId);
        if (!user) {
            console.log(`[VERIFY-EMAIL] User not found: ${registrationId}`);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`[VERIFY-EMAIL] User found: ${user.username}, Verified: ${user.emailVerified}, Token: ${user.emailVerificationToken}`);

        if (user.emailVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        if (user.emailVerificationToken !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (new Date() > user.emailVerificationExpires) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Mark email as verified
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        // Log verification
        const log = new AuditLog({
            transactionId: `VERIFY-EXT-${Date.now()}`,
            action: 'verify email',
            performedBy: 'system',
            details: `Email verified for external user: ${user.username} (${user.profession})`
        });
        await log.save();

        res.json({
            message: 'Email verified successfully! Your registration is now pending admin approval. You will receive a welcome email once approved.'
        });
    } catch (err) {
        console.error('Email verification error:', err.message);
        res.status(500).json({ message: 'Server error during email verification' });
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { registrationId } = req.body;

        if (!registrationId) {
            return res.status(400).json({ message: 'Registration ID is required' });
        }

        const user = await ExternalUser.findById(registrationId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.emailVerificationToken = otp;
        user.emailVerificationExpires = otpExpires;
        await user.save();

        // Send new OTP email
        const emailSent = await sendOTPEmail(user.email, otp, user.fullName);
        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
        }

        res.json({ message: 'New OTP sent to your email address' });
    } catch (err) {
        console.error('Resend OTP error:', err.message);
        res.status(500).json({ message: 'Server error while resending OTP' });
    }
});

// Get pending external user registrations count (Super Admin or sadmin only)
router.get('/pending-count', auth, requireSuperAdminOrSadmin, async (req, res) => {
    try {
        const count = await ExternalUser.countDocuments({ 
            registrationStatus: 'pending',
            emailVerified: true
        });

        console.log(`[PENDING-COUNT] Found ${count} pending external users`);
        res.json({ count });
    } catch (err) {
        console.error('Error fetching pending count:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get pending external user registrations (Admin only)
router.get('/pending-registrations', auth, requireSuperAdmin, async (req, res) => {
    try {
        // Fetch from ExternalUser collection
        const pendingUsers = await ExternalUser.find({
            registrationStatus: 'pending',
            emailVerified: true // Only show verified emails
        }).select('-passwordHash').sort({ registrationDate: -1 });

        res.json(pendingUsers);
    } catch (err) {
        console.error('Error fetching pending registrations:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get active external users (Admin only)
router.get('/active-external-users', auth, requireSuperAdmin, async (req, res) => {
    try {
        // Fetch from ExternalUser collection
        const activeUsers = await ExternalUser.find({
            registrationStatus: 'approved'
        }).select('-passwordHash').sort({ approvedAt: -1 });

        res.json(activeUsers);
    } catch (err) {
        console.error('Error fetching active external users:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve external user registration (Admin only)
router.post('/approve-registration/:userId', auth, requireSuperAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const adminUsername = req.user.user.username;

        // Find in ExternalUser
        const user = await ExternalUser.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User request not found' });
        }

        if (user.registrationStatus === 'approved') {
            return res.status(400).json({ message: 'User is already approved' });
        }

        if (!user.emailVerified) {
            return res.status(400).json({ message: 'User email is not verified yet. Cannot approve.' });
        }

        // UPDATE STATUS IN EXTERNAL USER COLLECTION (Do NOT move to User table)
        user.registrationStatus = 'approved';
        user.approvedBy = adminUsername;
        user.approvedAt = new Date();

        await user.save();

        // Send welcome email
        const emailSent = await sendWelcomeEmail(user.email, user.fullName, user.username, user.profession);
        if (!emailSent) {
            console.warn(`Failed to send welcome email to ${user.email}`);
        }

        // Log approval
        const log = new AuditLog({
            transactionId: `APPROVE-${Date.now()}`,
            action: 'approve user',
            performedBy: adminUsername,
            details: `External user approved: ${user.username} (${user.profession})`
        });
        await log.save();

        res.json({ message: 'User approved successfully. User can now login.' });
    } catch (err) {
        console.error('Error approving registration:', err.message);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// Reject external user registration (Admin only)
router.post('/reject-registration/:userId', auth, requireSuperAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const adminUsername = req.user.user.username;

        if (!reason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const user = await ExternalUser.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User request not found' });
        }

        // Mark as rejected in ExternalUser
        user.registrationStatus = 'rejected';
        user.rejectionReason = reason;
        await user.save();

        // Log rejection
        const log = new AuditLog({
            transactionId: `REJECT-${Date.now()}`,
            action: 'reject user',
            performedBy: adminUsername,
            details: `External user registration rejected: ${user.username} - Reason: ${reason}`
        });
        await log.save();

        res.json({ message: 'User registration rejected' });
    } catch (err) {
        console.error('Error rejecting registration:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Register Admin (Seed or new admin)
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        user = new User({
            username,
            passwordHash,
            role: 'admin'
        });

        await user.save();

        res.status(201).json({ message: 'Admin user registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Login (Internal AND External Users)
router.post('/login', async (req, res) => {
    try {
        let { username, password } = req.body;
        username = username ? username.trim() : '';
        console.log(`[LOGIN ATTEMPT] Username: '${username}'`);

        let user = null;
        let isExternal = false;

        // 1. Try finding in INTERNAL User collection
        user = await User.findOne({ username });
        console.log(`[LOGIN] Internal user search result:`, user ? `Found ${user.username}` : 'Not found');

        // 2. If not found, try EXTERNAL User collection
        if (!user) {
            user = await ExternalUser.findOne({ username });
            if (user) {
                isExternal = true;
                console.log(`[LOGIN] External user found: ${user.username}`);
            }
        }

        if (!user) {
            console.log(`[LOGIN FAILED] User not found: '${username}'`);

            // Log Failed Login (User Not Found)
            const log = new AuditLog({
                transactionId: `LOGIN-FAIL-${Date.now()}`,
                action: 'login',
                performedBy: username || 'Unknown',
                userType: 'unknown',
                status: 'failure',
                details: 'User not found'
            });
            await log.save();

            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // If External, perform additional checks
        if (isExternal) {
            if (!user.emailVerified) {
                // Log Failed Login (Email Not Verified)
                const log = new AuditLog({
                    transactionId: `LOGIN-FAIL-${Date.now()}`,
                    action: 'login',
                    performedBy: user.username,
                    userType: 'external',
                    status: 'failure',
                    details: 'Email not verified'
                });
                await log.save();
                return res.status(403).json({ message: 'Email not verified yet.' });
            }
            if (user.registrationStatus === 'pending') {
                // Log Failed Login (Pending Approval)
                const log = new AuditLog({
                    transactionId: `LOGIN-FAIL-${Date.now()}`,
                    action: 'login',
                    performedBy: user.username,
                    userType: 'external',
                    status: 'failure',
                    details: 'Account pending admin approval'
                });
                await log.save();
                return res.status(403).json({ message: 'Account pending admin approval.' });
            }
            if (user.registrationStatus === 'rejected') {
                // Log Failed Login (Rejected)
                const log = new AuditLog({
                    transactionId: `LOGIN-FAIL-${Date.now()}`,
                    action: 'login',
                    performedBy: user.username,
                    userType: 'external',
                    status: 'failure',
                    details: 'Account application rejected'
                });
                await log.save();
                return res.status(403).json({ message: 'Account application rejected.' });
            }
            if (user.registrationStatus !== 'approved') {
                // Log Failed Login (Restricted)
                const log = new AuditLog({
                    transactionId: `LOGIN-FAIL-${Date.now()}`,
                    action: 'login',
                    performedBy: user.username,
                    userType: 'external',
                    status: 'failure',
                    details: 'Account access restricted'
                });
                await log.save();
                return res.status(403).json({ message: 'Account access restricted.' });
            }
        }

        console.log(`[LOGIN] User found: ${user.username} (${isExternal ? 'External' : 'Internal'})`);

        // Validate password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            console.log(`[LOGIN FAILED] Password mismatch for user: '${username}'`);

            // Log Failed Login (Password Mismatch)
            const log = new AuditLog({
                transactionId: `LOGIN-FAIL-${Date.now()}`,
                action: 'login',
                performedBy: user.username,
                userType: isExternal ? 'external' : 'internal',
                status: 'failure',
                details: 'Password mismatch'
            });
            await log.save();

            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log(`[LOGIN SUCCESS] User authenticated: ${user.username}`);

        // Create Token Payload
        const payload = {
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                userType: isExternal ? 'external' : (user.userType || 'internal'),
                profession: user.profession
            }
        };

        // Log Login
        const log = new AuditLog({
            transactionId: `LOGIN-${Date.now()}`,
            action: 'login',
            performedBy: user.username,
            userType: isExternal ? 'external' : 'internal',
            status: 'success',
            details: 'Login successful'
        });
        await log.save();

        // Update last login if external
        if (isExternal) {
            user.lastLogin = new Date();
            await user.save();
        }

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        username: user.username,
                        role: user.role,
                        userType: isExternal ? 'external' : (user.userType || 'internal'),
                        profession: user.profession,
                        mustChangePassword: user.mustChangePassword
                    }
                });
            }
        );
    } catch (err) {
        console.error('[LOGIN ERROR]', err.message);
        res.status(500).send('Server Error');
    }
});

// Create New Admin User (Super Admin Only)
router.post('/create-user', require('../middleware/authMiddleware'), require('../middleware/roleMiddleware'), async (req, res) => {
    try {
        const { username } = req.body; // Password is now auto-generated

        // Check if user exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const defaultPassword = '00000';

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(defaultPassword, salt);

        user = new User({
            username,
            passwordHash,
            role: 'admin', // Only standard admins can be created
            mustChangePassword: true // Force password change on first login
        });

        await user.save();

        // Fetch performing user details (Super Admin)
        let performedBy = req.user.user.username;
        if (!performedBy) {
            const superAdmin = await User.findById(req.user.user.id);
            performedBy = superAdmin ? superAdmin.username : 'Unknown SuperAdmin';
        }

        // Audit Log
        const log = new AuditLog({
            transactionId: `USER-CREATE-${Date.now()}`,
            action: 'create user',
            performedBy: performedBy,
            details: `Created new admin user: ${username} with default password`
        });
        await log.save();

        res.status(201).json({ message: 'Admin user created successfully with default password (00000)' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Change Password Route
router.post('/change-password', require('../middleware/authMiddleware'), async (req, res) => {
    try {
        const { newPassword } = req.body;
        const userId = req.user.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        user.passwordHash = passwordHash;
        user.mustChangePassword = false;
        await user.save();

        // Audit Log
        const log = new AuditLog({
            transactionId: `PWD-CHANGE-${Date.now()}`,
            action: 'update',
            performedBy: user.username,
            details: 'User changed password'
        });
        await log.save();

        res.json({ message: 'Password changed successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete Admin User (Super Admin Only)
router.delete('/users/:id', require('../middleware/authMiddleware'), require('../middleware/roleMiddleware'), async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);

        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToDelete.role === 'superadmin') {
            return res.status(403).json({ message: 'Cannot delete Super Admin' });
        }

        await User.findByIdAndDelete(req.params.id);

        // Fetch performing user details (Super Admin)
        let performedBy = req.user.user.username;
        if (!performedBy) {
            const superAdmin = await User.findById(req.user.user.id);
            performedBy = superAdmin ? superAdmin.username : 'Unknown SuperAdmin';
        }

        // Audit Log
        const log = new AuditLog({
            transactionId: `USER-DELETE-${Date.now()}`,
            action: 'delete user',
            performedBy: performedBy,
            details: `Deleted admin user: ${userToDelete.username}`
        });
        await log.save();

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get All Admin Users (Super Admin Only)
router.get('/users', require('../middleware/authMiddleware'), require('../middleware/roleMiddleware'), async (req, res) => {
    try {
        const users = await User.find({
            role: { $ne: 'superadmin' },
            userType: 'internal' // Only show internal admin users
        }).select('-passwordHash');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Admin Stats (Accessible to all admins)
router.get('/admin-stats', require('../middleware/authMiddleware'), async (req, res) => {
    try {
        const count = await User.countDocuments({ userType: 'internal' });
        res.json({ activeAdminCount: count });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Logout Admin
router.post('/logout', require('../middleware/authMiddleware'), async (req, res) => {
    try {
        const user = await User.findById(req.user.user.id).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Log Logout
        const log = new AuditLog({
            transactionId: `LOGOUT-${Date.now()}`,
            action: 'logout',
            performedBy: user.username,
            details: 'Admin logout successful'
        });
        await log.save();

        res.json({ message: 'Logout successful' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
