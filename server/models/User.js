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
    // External user specific fields
    fullName: {
        type: String,
        required: function() { return this.userType === 'external'; },
        trim: true,
    },
    email: {
        type: String,
        required: function() { return this.userType === 'external'; },
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phoneNumber: {
        type: String,
        required: function() { return this.userType === 'external'; },
        match: [/^\+94[0-9]{9}$/, 'Please enter a valid Sri Lankan phone number (+94xxxxxxxxx)']
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: function() { return this.userType === 'external'; }
    },
    province: {
        type: String,
        required: function() { return this.userType === 'external'; }
    },
    district: {
        type: String,
        required: function() { return this.userType === 'external'; }
    },
    // Email verification fields
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String
    },
    emailVerificationExpires: {
        type: Date
    },
    // Registration and approval fields
    registrationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: function() { return this.userType === 'external' ? 'pending' : 'approved'; }
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
    approvedBy: {
        type: String,
        required: function() { return this.userType === 'external' && this.registrationStatus === 'approved'; }
    },
    approvedAt: {
        type: Date,
        required: function() { return this.userType === 'external' && this.registrationStatus === 'approved'; }
    },
    rejectionReason: {
        type: String,
        required: function() { return this.userType === 'external' && this.registrationStatus === 'rejected'; }
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
