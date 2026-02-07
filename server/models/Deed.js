const mongoose = require('mongoose');

const deedSchema = new mongoose.Schema({
    landTitleNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    deedNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    ownerName: {
        type: String,
        required: true,
        trim: true,
    },
    ownerNIC: {
        type: String,
        required: true,
        trim: true,
    },
    landLocation: {
        type: String,
        required: true,
    },
    province: {
        type: String,
        required: true,
    },
    district: {
        type: String,
        required: true,
    },
    landArea: {
        type: String,
        required: true,
    },
    surveyRef: {
        type: String,
        required: true,
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['valid', 'invalid', 'pending'],
        default: 'valid',
    },
    blockchainHash: {
        type: String,
        unique: true,
    },
});

module.exports = mongoose.model('Deed', deedSchema);
