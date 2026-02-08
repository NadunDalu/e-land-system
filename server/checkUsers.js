const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eland');
        
        const users = await User.find({});
        console.log('All users in database:');
        users.forEach(user => {
            console.log(`Username: ${user.username}, Role: ${user.role}, UserType: ${user.userType || 'undefined'}, Profession: ${user.profession || 'undefined'}`);
        });
        
        // Check specifically for external users
        const externalUsers = await User.find({ userType: 'external' });
        console.log('\nExternal users:');
        externalUsers.forEach(user => {
            console.log(`Username: ${user.username}, Role: ${user.role}, UserType: ${user.userType}, Profession: ${user.profession}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error checking users:', error);
        process.exit(1);
    }
};

checkUsers();