const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/authMiddleware');

// @route   GET /api/audit
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 });
        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/audit
// @access  Private
// Manually create audit log entry if needed
router.post('/', auth, async (req, res) => {
    try {
        const newLog = new AuditLog(req.body);
        const log = await newLog.save();
        res.json(log);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
