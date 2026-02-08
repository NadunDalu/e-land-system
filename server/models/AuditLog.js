const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    deedNumber: {
        type: String,
        default: '-',
    },
    action: {
        type: String,
        enum: ['register', 'transfer', 'update', 'verify', 'login', 'logout'],
        required: true,
    },
    performedBy: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    details: {
        type: String,
    },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
