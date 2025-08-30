const Category = require('../models/categories.model')

exports.addCategories = async (req, res, next) =>{
    try {
        const { name,type } = req.body;

        // Check if the category already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).send('Category already exists.');
        }

        // Create a new category
        const category = new Category({ name,type });
        await category.save();

        res.status(201).send({ message: 'Category created successfully', category });
    } catch (error) {
        next(error)
    }
}
exports.editCategories = async (req, res, next) =>{
    try {
        const categoryId = req.params.id;
        const { newName,type } = req.body;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).send('Category not found.');
        }

        category.name = newName;
        category.type = type
        await category.save();

        res.send({ message: 'Category updated successfully', category });
    } catch (error) {
        next(error)
    }
}

exports.deleteCategories = async (req, res, next) =>{
    try {
        const categoryId = req.params.id;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).send('Category not found.');
        }

        await category.remove();
        res.send({ message: 'Category deleted successfully' });
    } catch (error) {
        next(error)
    }
}
exports.getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({ 
            name: { $nin: ['shakra', 'guided meditation'] } 
        });
        res.send(categories);
    } catch (error) {
        next(error)
    }
}
exports.getAdminCategories = async (req, res, next) =>{
    try {
        const categories = await Category.find();
        res.send(categories);
    } catch (error) {
        next(error)
    }
}

exports.getCategoryByType = async (req, res, next) =>{
    try {
        const { type } = req.params;

        const categories = await Category.findOne({ type });
        if (!categories) {
            return res.status(404).send('Categories not found.');
        }
        res.send(categories);
    } catch (error) {
        next(error)
    }
}