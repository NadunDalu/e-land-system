const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'officer', 'lawyer', 'notary'],
        default: 'admin',
    },
    userType: {
        type: String,
        enum: ['internal', 'external'],
        default: 'internal',
    },
    profession: {
        type: String,
        enum: ['admin', 'officer', 'lawyer', 'notary'],
        required: function() { return this.userType === 'external'; }
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    mustChangePassword: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model('User', userSchema);
