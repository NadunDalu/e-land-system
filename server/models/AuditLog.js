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
        enum: ['register', 'transfer', 'update', 'verify', 'login', 'logout', 'create user', 'delete user', 'delete deed', 'approve user', 'reject user', 'verify email'],
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
    userType: {
        type: String,
        enum: ['internal', 'external', 'unknown'],
        default: 'unknown'
    },
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success'
    }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
