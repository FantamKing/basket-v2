const express = require('express');
const router = express.Router();
const Product = require('../models/Product.js');
const Category = require('../models/Category.js');

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get products by category
router.get('/category/:categoryId', async (req, res) => {
    try {
        const products = await Product.find({ category: req.params.categoryId }).populate('category');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get featured products
router.get('/featured', async (req, res) => {
    try {
        const products = await Product.find({ isFeatured: true }).limit(8).populate('category');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// To add new products, use the admin routes
// To edit products, use the admin routes
// To delete products, use the admin routes

module.exports = router;