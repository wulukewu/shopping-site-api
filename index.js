const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/Product');
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
    seedDatabase(); // Call the seedDatabase function after connecting
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Load products from products.json
const products = JSON.parse(
  fs.readFileSync('../shopping-site/public/products.json', 'utf-8')
);

// Seed the database (load initial data)
async function seedDatabase() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(products);
      console.log('Database seeded with products');
    } else {
      console.log('Database already contains products. Skipping seeding.');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

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

app.listen(port, () => {
  console.log(`Shopping Site API listening at http://localhost:${port}`);
});
