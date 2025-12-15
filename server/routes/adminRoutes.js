const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin.js');
const Product = require('../models/Product.js');
const Category = require('../models/Category.js');
const User = require('../models/User.js');
const Order = require('../models/Order.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary storage with error handling
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        console.log('Uploading file to Cloudinary:', file.originalname);
        return {
            folder: 'basket-categories',
            allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
            transformation: [{ width: 500, height: 500, crop: 'limit' }],
            public_id: `category_${Date.now()}`
        };
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Verify super admin
const verifySuperAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified.role !== 'super_admin') return res.status(403).json({ message: 'Super admin access required' });
        req.admin = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

// Verify admin
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

// Setup first admin
router.post('/setup', async (req, res) => {
    try {
        const adminCount = await Admin.countDocuments();
        if (adminCount > 0) {
            return res.status(400).json({ message: 'Admin already exists. Use /api/admin/register to add more admins.' });
        }

        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }

        const admin = new Admin({
            username,
            email,
            password,
            role: 'super_admin',
            permissions: ['manage_products', 'manage_categories', 'manage_admins', 'view_reports']
        });

        await admin.save();
        res.json({ message: 'First admin created successfully', email: admin.email, username: admin.username });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update admin
router.put('/admins/:id', verifySuperAdmin, async (req, res) => {
    try {
        const { username, email, role, permissions, isActive } = req.body;
        const updateData = {};

        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (permissions) updateData.permissions = permissions;
        if (typeof isActive === 'boolean') updateData.isActive = isActive;

        const admin = await Admin.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        res.json({
            message: 'Admin updated successfully',
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions,
                isActive: admin.isActive
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete admin
router.delete('/admins/:id', verifySuperAdmin, async (req, res) => {
    try {
        const admin = await Admin.findByIdAndDelete(req.params.id);
        if (!admin) return res.status(404).json({ message: 'Admin not found' });
        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all admins
router.get('/admins', verifyAdmin, async (req, res) => {
    try {
        const admins = await Admin.find({}, '-password');
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Register new admin
router.post('/register', verifySuperAdmin, async (req, res) => {
    try {
        const { username, email, password, role, permissions } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin with this email already exists' });
        }

        const admin = new Admin({
            username,
            email,
            password,
            role: role || 'admin',
            permissions: permissions || ['manage_products', 'manage_categories']
        });

        await admin.save();

        res.status(201).json({
            message: 'Admin created successfully',
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        let isValidPassword = false;
        try {
            isValidPassword = await admin.comparePassword(password);
        } catch (error) {
            // Fallback for plain text passwords (for migration)
            isValidPassword = password === admin.password;
        }

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({
            id: admin._id,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions
        }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add product
router.post('/products', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        console.log('Product creation request received');
        console.log('Body:', req.body);
        console.log('File:', req.file);

        const { name, description, price, originalPrice, category, stock, unit, discount, isFeatured } = req.body;

        console.log('Parsed data:', { name, description, price, category, stock, unit });

        const product = new Product({
            name,
            description,
            price: parseFloat(price),
            originalPrice: parseFloat(originalPrice),
            category,
            image: req.file ? req.file.path : '', // Cloudinary URL
            stock: parseInt(stock),
            unit,
            discount: parseFloat(discount) || 0,
            isFeatured: isFeatured === 'true'
        });

        console.log('Product object before save:', product);

        await product.save();
        await product.populate('category');

        console.log('Product saved successfully:', product._id);
        res.status(201).json(product);
    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update product
router.put('/products/:id', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, originalPrice, category, stock, unit, discount, isFeatured } = req.body;
        
        const updateData = {
            name,
            description,
            price: parseFloat(price),
            originalPrice: parseFloat(originalPrice),
            category,
            stock: parseInt(stock),
            unit,
            discount: parseFloat(discount) || 0,
            isFeatured: isFeatured === 'true'
        };
        
        if (req.file) {
            updateData.image = req.file.path; // Cloudinary URL
        }
        
        const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('category');
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete product
router.delete('/products/:id', verifyAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all products
router.get('/products', verifyAdmin, async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add category
router.post('/categories', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description } = req.body;

        console.log('Creating category:', name);
        console.log('File uploaded:', req.file);

        const category = new Category({
            name,
            description,
            image: req.file ? req.file.path : '' // Cloudinary returns the URL in req.file.path
        });

        await category.save();

        console.log('Category saved successfully:', category._id);
        res.status(201).json(category);
    } catch (error) {
        console.error('Error saving category:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update category
router.put('/categories/:id', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description } = req.body;

        const updateData = { name, description };

        if (req.file) {
            console.log('Updating category image:', req.file.path);
            updateData.image = req.file.path; // Cloudinary URL
        }

        const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete category
router.delete('/categories/:id', verifyAdmin, async (req, res) => {
    try {
        // Check if category has products
        const productCount = await Product.countDocuments({ category: req.params.id });
        
        if (productCount > 0) {
            return res.status(400).json({ message: 'Cannot delete category with existing products' });
        }
        
        const category = await Category.findByIdAndDelete(req.params.id);
        
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all users
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password -cart');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update user
router.put('/users/:id', verifyAdmin, async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        const updateData = {};
        
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;

        const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'User updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete user
router.delete('/users/:id', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get dashboard stats
router.get('/stats', verifyAdmin, async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

        res.json({
            totalProducts,
            totalUsers,
            totalOrders,
            totalRevenue: revenue
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all orders
router.get('/orders', verifyAdmin, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'name email')
            .sort({ orderDate: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order status
router.put('/orders/:id', verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const updateData = { status };

        if (status === 'delivered') {
            updateData.deliveredDate = new Date();
        }

        const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate('userId', 'name email');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            message: 'Order updated successfully',
            order
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete order
router.delete('/orders/:id', verifyAdmin, async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all users
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password -cart');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update user
router.put('/users/:id', verifyAdmin, async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;

        const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            message: 'User updated successfully',
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete user
router.delete('/users/:id', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;