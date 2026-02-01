const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@pos.com';
        const newPassword = 'adminpassword';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            {
                $set: {
                    password: hashedPassword,
                    status: 'active',
                    role: 'admin'
                }
            },
            { new: true, upsert: true } // Create if doesn't exist
        );

        console.log('Admin user updated/created successfully');
        console.log('Email:', updatedUser.email);
        console.log('Role:', updatedUser.role);
        console.log('Password has been reset to:', newPassword);

    } catch (err) {
        console.error('Error resetting admin:', err);
    } finally {
        await mongoose.disconnect();
    }
};

resetAdmin();
