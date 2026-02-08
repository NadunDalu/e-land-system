require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const testLogin = async () => {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const username = 'sadmin';
        const password = 'sadmin2026';

        console.log(`Attempting login for user: ${username} with password: ${password}`);

        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found in database.');
            process.exit(1);
        }

        console.log('User found:', user.username);
        console.log('Stored hash:', user.passwordHash);

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        console.log('Password match result:', isMatch);

        if (isMatch) {
            console.log('LOGIN SUCCESS! Password is correct.');
        } else {
            console.log('LOGIN FAILED! Password incorrect.');
        }

    } catch (err) {
        console.error('Error during test:', err);
    } finally {
        await mongoose.disconnect();
    }
};

testLogin();
