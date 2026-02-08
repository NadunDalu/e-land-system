const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/authMiddleware');

// @route   GET /api/audit
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { deedNumber, action, performedBy } = req.query;

        let query = {};

        if (deedNumber) {
            query.deedNumber = { $regex: deedNumber, $options: 'i' };
        }

        if (action && action !== 'All') {
            query.action = action;
        }

        if (performedBy) {
            query.performedBy = { $regex: performedBy, $options: 'i' };
        }

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        const totalLogs = await AuditLog.countDocuments(query);

        res.json({
            logs,
            totalPages: Math.ceil(totalLogs / limit),
            currentPage: page,
            totalLogs
        });
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
