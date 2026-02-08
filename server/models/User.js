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
        enum: ['superadmin', 'admin', 'officer'],
        default: 'admin',
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
