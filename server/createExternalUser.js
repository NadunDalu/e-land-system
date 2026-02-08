const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createExternalUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eland');
        
        // Create a lawyer user
        const lawyerPassword = await bcrypt.hash('lawyer123', 10);
        const lawyer = new User({
            username: 'lawyer1',
            passwordHash: lawyerPassword,
            role: 'lawyer',
            userType: 'external',
            profession: 'lawyer'
        });
        
        // Create a notary user
        const notaryPassword = await bcrypt.hash('notary123', 10);
        const notary = new User({
            username: 'notary1',
            passwordHash: notaryPassword,
            role: 'notary',
            userType: 'external',
            profession: 'notary'
        });
        
        await lawyer.save();
        await notary.save();
        
        console.log('External users created successfully:');
        console.log('Lawyer - Username: lawyer1, Password: lawyer123');
        console.log('Notary - Username: notary1, Password: notary123');
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating external users:', error);
        process.exit(1);
    }
};

createExternalUser();