// 1. Express library ko import karein
const express = require('express');

// 2. Express ka app instance banayein
const app = express();
app.set('view engine', 'ejs');

// 3. 'path' module ko import karein (jo folders ka rasta sahi set karta hai)
const path = require('path');

// 4. Express ko batayein ke CSS, JS aur Images 'public' folder mein hain
// path.resolve use karne se Git Bash mein path ka koi error nahi aayega
app.use(express.static(path.resolve(__dirname, 'public')));

// 5. Mongoose library ko import karein
const mongoose = require('mongoose');

// 6. MongoDB Database se connect karein
mongoose.connect('mongodb://localhost:27017/ecommerceDB')
    .then(() => console.log("Wah! MongoDB se connection kamyab raha. 🎉"))
    .catch((err) => console.error("MongoDB se connect nahi ho saka:", err));

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
        res.render('home', { productsArr: featuredProducts }); 
    } catch (err) {
        console.error("Home page data nikalne mein masla hua:", err);
        res.status(500).send("Server mein koi kharabi hai.");
    }
});

// ROUTE 2: All Products Page (With Search functionality)
app.get('/products', async (req, res) => {
    try {
        const searchQuery = req.query.search; // URL se '?search=watch' nikalega
        let query = {}; // Default khali object

        // Agar user ne search bar mein kuch likha hai (jaise 'watch')
        if (searchQuery) {
            // Database mein 'name' field ke andar 'watch' ko dhoondega (case-insensitive)
            query = { name: { $regex: searchQuery, $options: 'i' } };
        }

        // Is query ke mutabiq database se products nikalna
        const allProducts = await Product.find(query); 
        
        // Data ko products.ejs file ko bhej dena
        res.render('products', { productsArr: allProducts }); 
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
    }
});

// 5. Server Port Set Karein
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Zabardast! Server chal raha hai: http://localhost:${PORT}`);
});