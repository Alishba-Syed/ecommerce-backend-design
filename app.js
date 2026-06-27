// 1. Express library ko import karein
const express = require('express');

const cookieParser = require('cookie-parser');

// 2. Express ka app instance banayein
const app = express();
app.set('view engine', 'ejs');

// 3. 'path' module ko import karein (jo folders ka rasta sahi set karta hai)
const path = require('path');

// 4. Express ko batayein ke CSS, JS aur Images 'public' folder mein hain
// path.resolve use karne se Git Bash mein path ka koi error nahi aayega
app.use(express.static(path.resolve(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// 5. Mongoose library ko import karein
const mongoose = require('mongoose');

const User = require('./models/user');

// 6. MongoDB Database se connect karein
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerceDB')
    .then(() => console.log("Connected to MongoDB successfully! 🎉"))
    .catch((err) => console.error("Could not connect to MongoDB:", err));

// 7. Product Schema banayein (Database ka structure)
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
    image: String,
    description: String,
    stock: Number
});

// 8. Product Model banayein (Yeh line route ke error ko khatam karegi)
const Product = mongoose.model('Product', productSchema);

// --- ROUTES ---

// ROUTE 1: Home Page (Featured Products) - Line 40 ke aas-paas isay paste karein
app.get('/', async (req, res) => {
    try {
        // 1. Database se top 4 products lekar aana
        const featuredProducts = await Product.find({}).limit(4); 
        
        // 2. Data ko 'productsArr' ke naam se home.ejs ko bhejna
        res.json({ productsArr: featuredProducts });
    } catch (err) {
        console.error("Home page data nikalne mein masla hua:", err);
        res.status(500).send("Server mein koi kharabi hai.");
    }
});

// ROUTE 2: All Products Page (With Search AND Pagination functionality)
app.get('/products', async (req, res) => {
    try {
        const searchQuery = req.query.search; // URL se '?search=watch' nikalega
        let query = {}; // Default khali object

        // Agar user ne search bar mein kuch likha hai
        if (searchQuery) {
            query = { name: { $regex: searchQuery, $options: 'i' } };
        }

        // --- PAGINATION LOGIC START ---
        const page = parseInt(req.query.page) || 1; // Current page number (Default = 1)
        const limit = 4; // Ek page par kitne products dikhane hain
        const skip = (page - 1) * limit; // Kitne products skip karne hain

        // Is specific query ke mutabiq total products count karna
        const totalProducts = await Product.countDocuments(query);
        
        // Search query, skip aur limit ke sath products nikalna
        const allProducts = await Product.find(query).skip(skip).limit(limit); 

        // Total pages calculate karna
        const totalPages = Math.ceil(totalProducts / limit);
        // --- PAGINATION LOGIC END ---
        
        // Data ko products.ejs file ko bhej dena (Saath mein pagination parameters bhi bhej rahe hain)
        res.render('products', { 
            productsArr: allProducts, 
            currentPage: page, 
            totalPages: totalPages,
            searchQuery: searchQuery || '' // Taake next page par bhi search yaad rahe
        }); 
    } catch (err) {
        console.error("Data nikalne mein masla hua:", err);
        res.status(500).send("Server mein koi kharabi hai.");
    }
});

// ROUTE 3: Product Details Page (Dynamic)
app.get('/products/:id', async (req, res) => {
    try {
        const productId = req.params.id; // URL se ID nikalna
        const product = await Product.findById(productId); // Database se dhoondna

        if (!product) {
            return res.status(404).send("Product nahi mila.");
        }

        // EJS ko data pass kar rahe hain
        res.render('product-details', { product: product });
    } catch (err) {
        console.error("Details nikalne mein masla hua:", err);
        res.status(500).send("Server mein koi kharabi hai.");
  ;  }
})
// 🔒 ROUTE PROTECTION MIDDLEWARE
const checkAuth = (req, res, next) => {
    const token = req.cookies.token; // Browser ki cookie se token nikalna

    if (!token) {
        // Agar token nahi hai, to login page par bhej do aur error dikhao
        return res.render('login', { error: 'Naya product add karne ke liye pehle login karein!' });
    }

    try {
        // Token verify karna
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; // User ka data request mein save kar lena
        next(); // Agle step (route) par jaane ki ijazat dena
    } catch (err) {
        res.clearCookie('token');
        return res.render('login', { error: 'Session expired. Dobara login karein.' });
    }
};

// [Week 3 Task] 1. GET Route: Form Render (PROTECTED - Ab checkAuth check karega)
app.get('/admin/add-product', checkAuth, (req, res) => {
    res.render('add-product');
});

// [Week 3 Task] 2. POST Route: Save Product (PROTECTED - Ab checkAuth check karega)
app.post('/products/add', checkAuth, async (req, res) => {
    try {
        const { name, price, image } = req.body;

        const newProduct = new Product({
            name: name,
            price: Number(price),
            image: image
        });

        await newProduct.save();
        res.redirect('/products'); // Product save karke seedha listing par bhejhein
    } catch (err) {
        console.error("Naya product add karne mein error:", err);
        res.status(500).send("Product save nahi ho saka.");
    }
});

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT Secret Key (Aap isme kuch bhi secret text likh sakti hain)
const JWT_SECRET = "MeraShopEaseSecretKey123";

// 1. SIGNUP PAGE (GET)
app.get('/signup', (req, res) => {
    res.render('signup', { error: null });
});

// 1. SIGNUP PAGE (GET)
app.get('/signup', (req, res) => {
    res.render('signup', { error: null });
});

// 2. SIGNUP PROCESS (POST)
app.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('signup', { error: 'This email is already registered.' });
        }

        // Encrypt (hash) the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save new user to the database
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });
        await newUser.save();

        // Redirect to login page after successful registration
        res.redirect('/login');

    } catch (err) {
        console.error("Error during signup:", err);
        res.status(500).send("Server error during signup.");
    }
});

// 3. LOGIN PAGE (GET)
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// 4. LOGIN PROCESS (POST) - With Cookie Storage
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { error: 'Invalid Email or Password.' });
        }

        // Check password match
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid Email or Password.' });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        // --- SAVE TOKEN IN COOKIE ---
        res.cookie('token', token, { httpOnly: true });

        console.log("User logged in successfully and cookie is set!");
        res.redirect('/products');

    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).send("Server error during login.");
    }
});

// 5. Server Port Set Karein
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Zabardast! Server chal raha hai: http://localhost:${PORT}`);
});