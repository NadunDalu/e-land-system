const express = require('express');
const router = express.Router();
const Deed = require('../models/Deed');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/authMiddleware');

// Get all deeds (with filters)
router.get('/', async (req, res) => {
    try {
        const { landTitleNumber, deedNumber, ownerName, district, status, search } = req.query;
        let query = {};

        // ... (rest of logic same)


        if (search) {
            query.$or = [
                { deedNumber: { $regex: search, $options: 'i' } },
                { landTitleNumber: { $regex: search, $options: 'i' } },
                { ownerNIC: { $regex: search, $options: 'i' } }
            ];
        }

        if (landTitleNumber) query.landTitleNumber = { $regex: landTitleNumber, $options: 'i' };
        if (deedNumber) query.deedNumber = { $regex: deedNumber, $options: 'i' };
        if (ownerName) query.ownerName = { $regex: ownerName, $options: 'i' };
        if (district && district !== 'All') query.district = district;
        if (status && status !== 'All') query.status = status;

        const deeds = await Deed.find(query).sort({ registrationDate: -1 });
        res.json(deeds);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get single deed by ID
router.get('/:id', async (req, res) => {
    try {
        const deed = await Deed.findById(req.params.id);
        if (!deed) return res.status(404).json({ message: 'Deed not found' });
        res.json(deed);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Deed not found' });
        res.status(500).send('Server Error');
    }
});

const isValidNIC = (nic) => {
    // Basic Sri Lankan NIC validation (Old: 9 digits + V/X, New: 12 digits)
    const oldNicRegex = /^\d{9}[vVxX]$/;
    const newNicRegex = /^\d{12}$/;
    return oldNicRegex.test(nic) || newNicRegex.test(nic);
};

// Register a new deed
router.post('/', auth, async (req, res) => {
    try {
        const { landTitleNumber, deedNumber, ownerNIC } = req.body;

        // Custom Validations
        if (!isValidNIC(ownerNIC)) {
            return res.status(400).json({ message: 'Invalid NIC format' });
        }

        // Check if deed already exists
        const existingDeed = await Deed.findOne({
            $or: [{ landTitleNumber }, { deedNumber }]
        });

        if (existingDeed) {
            return res.status(400).json({ message: 'Deed with this Title Number or Deed Number already exists' });
        }

        const newDeed = new Deed(req.body);
        const deed = await newDeed.save();

        // Create Audit Log
        const log = new AuditLog({
            transactionId: `TX-${Date.now()}`,
            deedNumber: deed.deedNumber,
            action: 'register',
            performedBy: 'admin', // Ideally get from auth middleware
            details: `New deed registered: ${deed.deedNumber}`
        });
        await log.save();

        res.json(deed);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Transfer Ownership
router.put('/transfer', auth, async (req, res) => {
    try {
        const { deedId, newOwnerName, newOwnerNIC, transferReason } = req.body;

        if (!isValidNIC(newOwnerNIC)) {
            return res.status(400).json({ message: 'Invalid New Owner NIC format' });
        }

        const deed = await Deed.findById(deedId);
        if (!deed) return res.status(404).json({ message: 'Deed not found' });

        const previousOwner = deed.ownerName;

        // Update Deed
        deed.ownerName = newOwnerName;
        deed.ownerNIC = newOwnerNIC;
        // Potentially update blockchain hash or other fields here

        await deed.save();

        // Create Audit Log
        const log = new AuditLog({
            transactionId: `TX-${Date.now()}`,
            deedNumber: deed.deedNumber,
            action: 'transfer',
            performedBy: 'admin', // Ideally get from auth middleware
            details: `Ownership transferred from ${previousOwner} to ${newOwnerName}. Reason: ${transferReason}`
        });
        await log.save();

        res.json(deed);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update Deed Details
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validation (optional, but good practice)
        if (updateData.ownerNIC && !isValidNIC(updateData.ownerNIC)) {
            return res.status(400).json({ message: 'Invalid NIC format' });
        }

        const deed = await Deed.findById(id);
        if (!deed) return res.status(404).json({ message: 'Deed not found' });

        // Update fields
        Object.assign(deed, updateData);
        // Ensure to update the 'lastVerified' or similar timestamp if needed
        // deed.lastVerified = new Date(); // If tracking separate update time

        await deed.save();

        // Create Audit Log
        const log = new AuditLog({
            transactionId: `TX-${Date.now()}`,
            deedNumber: deed.deedNumber,
            action: 'update',
            performedBy: req.user.user.username || 'admin',
            details: `Deed details updated for ${deed.deedNumber}`
        });
        await log.save();

        res.json(deed);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Deed not found' });
        res.status(500).send('Server Error');
    }
});

// Delete Deed (Super Admin Only)
router.delete('/:id', auth, require('../middleware/roleMiddleware'), async (req, res) => {
    try {
        const deedToDelete = await Deed.findById(req.params.id);

        if (!deedToDelete) {
            return res.status(404).json({ message: 'Deed not found' });
        }

        await Deed.findByIdAndDelete(req.params.id);

        // Fetch performing user details (Super Admin)
        let performedBy = req.user.user.username;
        if (!performedBy) {
            // Fallback if username missing in token (though it should be there now)
            const User = require('../models/User'); // Lazy load to avoid circular dependency if any
            const superAdmin = await User.findById(req.user.user.id);
            performedBy = superAdmin ? superAdmin.username : 'Unknown SuperAdmin';
        }

        // Audit Log
        const log = new AuditLog({
            transactionId: `DEED-DELETE-${Date.now()}`,
            deedNumber: deedToDelete.deedNumber,
            action: 'delete deed',
            performedBy: performedBy,
            details: `Deleted deed record: ${deedToDelete.deedNumber} (Title: ${deedToDelete.landTitleNumber})`
        });
        await log.save();

        res.json({ message: 'Deed deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
