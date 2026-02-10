const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eland');
        console.log('Connected to MongoDB');

        // Create standard admin
        const adminData = {
            username: 'admin',
            password: 'password123',
            role: 'superadmin',
            userType: 'internal'
        };

        console.log('\n=== Creating New Admin User ===');
        console.log(`Username: ${adminData.username}`);
        console.log(`Password: ${adminData.password}`);
        console.log(`Role: ${adminData.role}`);

        // Check if user already exists
        const existingUser = await User.findOne({ username: adminData.username });
        if (existingUser) {
            console.log(`\n❌ User '${adminData.username}' already exists!`);

            // Ask if you want to update password
            console.log('\n=== Updating Password ===');
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(adminData.password, salt);

            existingUser.passwordHash = passwordHash;
            existingUser.role = adminData.role;
            existingUser.userType = 'internal';
            await existingUser.save();

            console.log(`✅ Password updated for '${adminData.username}'`);
        } else {
            // Create new admin user
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(adminData.password, salt);

            const newAdmin = new User({
                username: adminData.username,
                passwordHash,
                role: adminData.role,
                userType: 'internal'
            });

            await newAdmin.save();
            console.log(`✅ New admin user '${adminData.username}' created successfully!`);
        }

        console.log('\n=== All Admin Users ===');
        const adminUsers = await User.find({
            userType: 'internal',
            role: { $in: ['admin', 'superadmin'] }
        }).select('username role userType');

        adminUsers.forEach(user => {
            console.log(`- Username: ${user.username}, Role: ${user.role}`);
        });

        console.log('\n=== Login Instructions ===');
        console.log('1. Go to: http://localhost:8080/admin/login');
        console.log(`2. Username: ${adminData.username}`);
        console.log(`3. Password: ${adminData.password}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createAdmin();