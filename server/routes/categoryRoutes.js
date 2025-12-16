const express = require('express');
const router = express.Router();
const Category = require('../models/Category.js');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single category
router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// To add new categories, use the admin routes
// To edit categories, use the admin routes
// To delete categories, use the admin routes

module.exports = router;