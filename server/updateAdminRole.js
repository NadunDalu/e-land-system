const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const updateAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');

        const user = await User.findOne({ username: 'sadmin' });
        if (user) {
            user.role = 'superadmin';
            await user.save();
            console.log(`User ${user.username} updated to role: ${user.role}`);
        } else {
            console.log('User sadmin not found');
        }

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateAdmin();
