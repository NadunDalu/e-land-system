const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

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

// Login Admin
router.post('/login', async (req, res) => {
    try {
        let { username, password } = req.body;

        // Trim username to handle accidental whitespace
        username = username ? username.trim() : '';

        console.log(`[LOGIN ATTEMPT] Username: '${username}', Password provided: ${!!password}`);

        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            console.log(`[LOGIN FAILED] User not found: '${username}'`);
            return res.status(400).json({ message: 'Invalid credentials - User not found' });
        }
        console.log(`[LOGIN] User found: ${user.username}, Hash: ${user.passwordHash.substring(0, 10)}...`);

        // Validate password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            console.log(`[LOGIN FAILED] Password mismatch for user: '${username}'`);
            return res.status(400).json({ message: 'Invalid credentials - Password incorrect' });
        }

        // Create Token
        const payload = {
            user: {
                id: user.id,
                username: user.username, // Added username to payload
                role: user.role
            }
        };

        // Log Login
        const log = new AuditLog({
            transactionId: `LOGIN-${Date.now()}`,
            action: 'login',
            performedBy: user.username,
            details: 'Admin login successful'
        });
        await log.save();

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
                        mustChangePassword: user.mustChangePassword
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
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

        await user.save();

        // Fetch performing user details (Super Admin)
        // If username is in token (new logins), use it. If not (old sessions), fetch from DB.
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
        const users = await User.find({ role: { $ne: 'superadmin' } }).select('-passwordHash'); // Exclude superadmin from list if desired, or include all
        res.json(users);
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
