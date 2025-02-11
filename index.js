const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/Product'); // Import the Product model

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// MongoDB Connection
const mongoose_url =
  'mongodb+srv://dbUser:6PVLqEdkaKiNBgTe@shopping-site.mch4s.mongodb.net/?retryWrites=true&w=majority&appName=shopping-site';

mongoose
  .connect(mongoose_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Get all products from the database
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find(); // Fetch from the DB
    res.json(products);
  } catch (err) {
    console.error('Error getting products:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct); // 201 Created
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ message: err.message }); // 400 Bad Request
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' }); // 404 Not Found
    }
    res.json(product);
  } catch (err) {
    console.error('Error getting product:', err);
    res.status(500).json({ message: err.message }); // 500 Internal Server Error
  }
});

app.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' }); // 404 Not Found
    }
    res.json(product);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(400).json({ message: err.message }); // 400 Bad Request
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' }); // 404 Not Found
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: err.message }); // 500 Internal Server Error
  }
});

app.listen(port, () => {
  console.log(`Shopping Site API listening at http://localhost:${port}`);
});
