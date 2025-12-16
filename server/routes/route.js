const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const Order = require('../models/Order.js');
const Product = require('../models/Product.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User Registration
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            phone
        });
        
        await newUser.save();
        
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Create token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({ 
            token, 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Get user profile
router.get('/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update user profile
router.put('/user/profile', authenticateToken, async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { name, phone, address },
            { new: true }
        ).select('-password');
        
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create order (User only)
router.post('/order', authenticateToken, async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in order' });
        }

        // Calculate total amount and validate items
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(400).json({ message: `Product ${item.productId} not found` });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
            }

            orderItems.push({
                productId: item.productId,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                image: product.image
            });

            totalAmount += product.price * item.quantity;

            // Update product stock
            product.stock -= item.quantity;
            await product.save();
        }

        // Create order
        const order = new Order({
            userId: req.user.userId,
            items: orderItems,
            totalAmount,
            shippingAddress,
            paymentMethod: paymentMethod || 'cod'
        });

        await order.save();

        res.status(201).json({
            message: 'Order placed successfully',
            order: {
                id: order._id,
                totalAmount: order.totalAmount,
                status: order.status,
                orderDate: order.orderDate
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user orders (User only)
router.get('/user/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.userId })
            .sort({ orderDate: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;