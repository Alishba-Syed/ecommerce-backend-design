const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user');

const app = express();

app.use(express.static(path.resolve(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = "MeraShopEaseSecretKey123";

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerceDB')
    .then(() => console.log("Connected to MongoDB! 🎉"))
    .catch((err) => console.error("MongoDB Error:", err));

const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
    image: String,
    description: String,
    stock: Number
});

const Product = mongoose.model('Product', productSchema);

// 🔒 AUTH MIDDLEWARE
const checkAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Pehle login karein!' });
    }
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.clearCookie('token');
        return res.status(401).json({ error: 'Session expired. Dobara login karein.' });
    }
};

// ROUTE 1: Home
app.get('/', async (req, res) => {
    try {
        const featuredProducts = await Product.find({}).limit(4);
        res.json({ productsArr: featuredProducts });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// ROUTE 2: All Products
app.get('/products', async (req, res) => {
    try {
        const searchQuery = req.query.search;
        let query = {};
        if (searchQuery) {
            query = { name: { $regex: searchQuery, $options: 'i' } };
        }
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        const totalProducts = await Product.countDocuments(query);
        const allProducts = await Product.find(query).skip(skip).limit(limit);
        const totalPages = Math.ceil(totalProducts / limit);

        res.json({
            productsArr: allProducts,
            currentPage: page,
            totalPages: totalPages,
            searchQuery: searchQuery || ''
        });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// ROUTE 3: Product Details
app.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "Product nahi mila." });
        }
        res.json({ product: product });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// ROUTE 4: Add Product Form (Protected)
app.get('/admin/add-product', checkAuth, (req, res) => {
    res.json({ message: "Add product form", user: req.user });
});

// ROUTE 5: Save Product (Protected)
app.post('/products/add', checkAuth, async (req, res) => {
    try {
        const { name, price, image } = req.body;
        const newProduct = new Product({ name, price: Number(price), image });
        await newProduct.save();
        res.json({ message: "Product add ho gaya!", product: newProduct });
    } catch (err) {
        res.status(500).json({ error: "Product save nahi hua." });
    }
});

// ROUTE 6: Signup (GET)
app.get('/signup', (req, res) => {
    res.json({ message: "Signup page" });
});

// ROUTE 7: Signup (POST)
app.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        res.json({ message: "Signup successful! Ab login karein." });
    } catch (err) {
        res.status(500).json({ error: "Signup error." });
    }
});

// ROUTE 8: Login (GET)
app.get('/login', (req, res) => {
    res.json({ message: "Login page" });
});

// ROUTE 9: Login (POST)
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid Email or Password.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid Email or Password.' });
        }
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });
        res.json({ message: "Login successful!" });
    } catch (err) {
        res.status(500).json({ error: "Login error." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server chal raha hai: http://localhost:${PORT}`);
});