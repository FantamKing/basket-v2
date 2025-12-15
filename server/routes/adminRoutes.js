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
    // Raise multer limit to a large value; Render may still enforce request limits.
    // Set to 200MB here to allow big uploads if they go through server-side.
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
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
        if (verified.role !== 'super_admin' && verified.role !== 'god') return res.status(403).json({ message: 'Super admin or God access required' });
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
            permissions: ['manage_products', 'manage_categories', 'manage_admins', 'view_reports', 'manage_admins_passwords', 'manage_admins_roles'],
            tags: []
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
        const { username, email, role, permissions, isActive, tags } = req.body;
        const updateData = {};

        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (permissions) updateData.permissions = permissions;
        if (typeof isActive === 'boolean') updateData.isActive = isActive;
        if (tags) updateData.tags = tags;

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
                isActive: admin.isActive,
                tags: admin.tags
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Change admin password
router.put('/admins/:id/password', verifySuperAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword) {
            return res.status(400).json({ message: 'New password is required' });
        }

        const admin = await Admin.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        admin.password = newPassword; // Will be hashed by pre-save hook
        await admin.save();

        res.json({ message: 'Admin password updated successfully' });
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
        const { username, email, password, role, permissions, tags } = req.body;

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
            permissions: permissions || ['manage_products', 'manage_categories'],
            tags: tags || []
        });

        await admin.save();

        res.status(201).json({
            message: 'Admin created successfully',
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions,
                tags: admin.tags
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

        console.log('Login attempt for email:', email);

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const admin = await Admin.findOne({ email });
        console.log('Admin found:', !!admin);
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        let isValidPassword = false;
        try {
            isValidPassword = await admin.comparePassword(password);
            console.log('Password valid via bcrypt:', isValidPassword);
        } catch (error) {
            // Fallback for plain text passwords (for migration)
            isValidPassword = password === admin.password;
            console.log('Password valid via plain text fallback:', isValidPassword);
        }

        if (!isValidPassword) {
            console.log('Invalid password for admin:', admin.email);
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
                permissions: admin.permissions,
                tags: admin.tags
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Temporary route to reset admin password (remove after use)
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Email and newPassword required' });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        admin.password = newPassword; // Will be hashed by pre-save
        await admin.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Provide Cloudinary signature for client-side direct uploads
router.get('/sign', verifyAdmin, (req, res) => {
    try {
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = req.query.folder || 'basket-products'; // default folder
        const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET);
        res.json({
            signature,
            timestamp,
            api_key: process.env.CLOUDINARY_API_KEY,
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            folder
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add product
router.post('/products', verifyAdmin, async (req, res) => {
    try {
        console.log('Product creation request received');
        console.log('Body:', JSON.stringify(req.body));
        console.log('File (if any):', req.file);

        const { name, description, price, originalPrice, category, stock, unit, discount, isFeatured, image } = req.body || {};

        // Basic validation with clear messages for the client
        const missing = [];
        if (!name) missing.push('name');
        if (!description) missing.push('description');
        if (price === undefined || price === null || price === '') missing.push('price');
        if (!category) missing.push('category');
        if (stock === undefined || stock === null || stock === '') missing.push('stock');
        if (!unit) missing.push('unit');
        if (!image && !req.file) missing.push('image');

        if (missing.length > 0) {
            return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
        }

        // Accept either an image URL provided by the client (direct Cloudinary upload)
        // or a server-side uploaded file (req.file.path)
        const imageUrl = req.file ? req.file.path : (image || '');

        const product = new Product({
            name,
            description,
            price: isNaN(parseFloat(price)) ? null : parseFloat(price),
            originalPrice: isNaN(parseFloat(originalPrice)) ? 0 : parseFloat(originalPrice),
            category,
            image: imageUrl,
            stock: isNaN(parseInt(stock)) ? 0 : parseInt(stock),
            unit,
            discount: isNaN(parseFloat(discount)) ? 0 : parseFloat(discount),
            isFeatured: (isFeatured === true || isFeatured === 'true')
        });

        console.log('Product object before save:', product);

        await product.save();
        await product.populate('category');

        console.log('Product saved successfully:', product._id);
        res.status(201).json(product);
    } catch (error) {
        console.error('Error saving product:', error);

        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 200MB.' });
        }
        if (error.name === 'MulterError') {
            return res.status(400).json({ message: error.message });
        }

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
router.post('/categories', verifyAdmin, async (req, res) => {
    try {
        const { name, description, image } = req.body;

        console.log('Creating category:', name);
        console.log('File uploaded (if any):', req.file);

        const imageUrl = req.file ? req.file.path : (image || '');

        const category = new Category({
            name,
            description,
            image: imageUrl // Cloudinary URL expected
        });

        await category.save();

        console.log('Category saved successfully:', category._id);
        res.status(201).json(category);
    } catch (error) {
        console.error('Error saving category:', error);

        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 200MB.' });
        }
        if (error.name === 'MulterError') {
            return res.status(400).json({ message: error.message });
        }

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