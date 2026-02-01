
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('MONGO_URI is not defined in .env');
    process.exit(1);
}

async function seedUsers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const usersPath = path.join(__dirname, 'data', 'users.json');
        const fileData = fs.readFileSync(usersPath, 'utf8');
        const users = JSON.parse(fileData);

        console.log(`Found ${users.length} users in local JSON file.`);

        for (const user of users) {
            // Check if user exists
            const existing = await User.findOne({ email: user.email });
            if (existing) {
                console.log(`User ${user.email} already exists in MongoDB. Updating...`);
                // Determine if we need to update the password.
                // The hash in JSON is trusted. The one in DB might be old/broken.
                // But we can't easily check 'is broken', so we overwrite with the JSON data 
                // BUT we must be careful not to re-hash it if the schema pre-save hook fires.
                // The User model likely has a pre-save hook that hashes passwords if modified.
                // If we explicitly set the hash that is ALREADY hashed, we don't want to hash it again.
                // However, Mongoose pre-save hooks usually check `isModified('password')`.
                // If we updateOne, hooks don't run. That is safer for syncing raw hashes.

                await User.updateOne({ _id: existing._id }, {
                    $set: {
                        name: user.name,
                        password: user.password, // This is already a hash
                        role: user.role,
                        status: user.status
                    }
                });
                console.log(`User ${user.email} updated.`);
            } else {
                console.log(`Creating user ${user.email}...`);
                // For creation, we can use new User() but we have to be careful about the pre-save hook.
                // If the schema hashes the password, we might double-hash.
                // Let's check the User model...

                // We'll use insertMany or create but bypass mongoose middleware if possible, 
                // OR we'll assuming the schema handles "already hashed" check? No, schema usually doesn't know.
                // Safer to use User.collection.insertOne to bypass Mongoose hooks entirely for migration.

                // NOTE: 'users' is the default collection name for model 'User' usually.
                await mongoose.connection.collection('users').insertOne({
                    ...user,
                    createdAt: new Date(user.createdAt),
                    updatedAt: new Date(user.updatedAt),
                    __v: 0
                });
                console.log(`User ${user.email} created.`);
            }
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedUsers();
