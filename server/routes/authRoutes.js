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
                res.json({ token, user: { username: user.username, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
