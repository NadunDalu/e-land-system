const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('MongoDB connected for seeding');

        // Check if admin exists
        const adminExists = await User.findOne({ username: 'admin' });
        if (adminExists) {
            console.log('Admin user already exists');
        } else {
            // Create Admin
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('admin123', salt);

            const admin = new User({
                username: 'admin',
                passwordHash,
                role: 'admin'
            });

            await admin.save();
            console.log('Admin user created successfully');
        }

        // Check if sadmin exists
        const sadminExists = await User.findOne({ username: 'sadmin' });
        if (sadminExists) {
            console.log('Sadmin user already exists');
        } else {
            // Create Sadmin
            const salt = await bcrypt.genSalt(10);
            const sadminPasswordHash = await bcrypt.hash('sadmin2026', salt);

            const sadmin = new User({
                username: 'sadmin',
                passwordHash: sadminPasswordHash,
                role: 'admin'
            });

            await sadmin.save();
            console.log('Sadmin user created successfully');
        }

        process.exit();
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
