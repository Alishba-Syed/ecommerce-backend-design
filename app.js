// 1. Express library ko import karein
const express = require('express');

// 2. Express ka app instance banayein
const app = express();

// 3. 'path' module ko import karein (jo folders ka rasta sahi set karta hai)
const path = require('path');

// 4. Express ko batayein ke CSS, JS aur Images 'public' folder mein hain
// path.resolve use karne se Git Bash mein path ka koi error nahi aayega
app.use(express.static(path.resolve(__dirname, 'public')));


// --- ROUTES ---

// ROUTE 1: Home Page (http://localhost:3000/)
app.get('/', (req, res) => {
    // path.resolve se views folder ke andar ki home.html ka sahi rasta milega
    res.sendFile(path.resolve(__dirname, 'views', 'home.html'));
});

// ROUTE 2: Product Listing Page (http://localhost:3000/products)
app.get('/products', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'views', 'products.html'));
});

// ROUTE 3: Product Details Page (http://localhost:3000/products/any-id)
app.get('/products/:id', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'views', 'product-details.html'));
});


// 5. Server Port Set Karein
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Zabardast! Server chal raha hai: http://localhost:${PORT}`);
});