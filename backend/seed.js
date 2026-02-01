const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const userRepository = require('./repositories/userRepository');

const connectDB = async () => {
    if (process.env.USE_MONGO === 'true') {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('Connected to MongoDB for Seeding');
        } catch (err) {
            console.error('MongoDB Connection Error:', err);
            process.exit(1);
        }
    }
};

const seedAdmin = async () => {
    try {
        const existingAdmin = await userRepository.findByEmail('admin@pos.com');
        if (existingAdmin) {
            console.log('Admin already exists');
            return;
        }

        await userRepository.create({
            name: 'Super Admin',
            email: 'admin@pos.com',
            password: 'adminpassword', // Will be hashed by repository
            role: 'admin',
            status: 'active'
        });
        console.log('Admin user created successfully');
        console.log('Email: admin@pos.com');
        console.log('Password: adminpassword');
    } catch (err) {
        console.error('Error seeding admin:', err);
    }
};

const runSeed = async () => {
    await connectDB();
    await seedAdmin();
    if (process.env.USE_MONGO === 'true') {
        mongoose.disconnect();
    }
};

runSeed();
