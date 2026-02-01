const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');

const SECRET_KEY = process.env.JWT_SECRET || 'SECRET_KEY_POS';

exports.login = async (req, res) => {
    console.log(`[AUTH] Login Attempt: ${req.body.email}`);
    // Basic trimming of inputs to prevent accidental spaces
    let { email, password } = req.body;
    if (email) email = email.trim();
    if (password) password = password.trim();

    try {
        const user = await userRepository.findByEmail(email);
        if (!user || user.status === 'disabled') {
            console.log(`Login failed: User ${email} not found or disabled.`);
            return res.status(404).json({ message: 'User not found or disabled' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Login failed: Invalid password for ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const result = await userRepository.create({ name, email, password, role });
        res.status(201).json({ message: 'User created', userId: result._id });
    } catch (err) {
        console.error('Register Error:', err);
        res.status(400).json({ message: err.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await userRepository.getAll();
        // Exclude password
        const safeUsers = users.map(u => {
            const { password, ...rest } = u._doc || u; // _doc for Mongoose, u for JSON
            return rest;
        });
        res.json(safeUsers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
