// SIMPLE NODE.JS/EXPRESS BACKEND EXAMPLE
// Save as: server.js
// Run: node server.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory database (replace with real database like MongoDB/MySQL)
let registeredUsers = [];

// Register endpoint
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, mobile, email, password } = req.body;

        // Validate inputs
        if (!name || !mobile || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Check if user already exists
        const existingUser = registeredUsers.find(u => u.email === email || u.mobile === mobile);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already registered with this email or mobile' });
        }

        // Hash password (IMPORTANT: Never store plain text passwords!)
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: Date.now().toString(),
            name,
            mobile,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        registeredUsers.push(newUser);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                mobile: newUser.mobile
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Get all users (for testing only - remove in production!)
app.get('/api/users', (req, res) => {
    res.json({
        total: registeredUsers.length,
        users: registeredUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            mobile: u.mobile,
            createdAt: u.createdAt
        }))
    });
});

// Login endpoint (optional)
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = registeredUsers.find(u => u.email === email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('🚀 Server running on http://localhost:\');
    console.log('✅ API Ready for registration form');
});
