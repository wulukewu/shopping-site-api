require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Product = require('../../models/Product');
const User = require('../../models/User');

const app = express();
const port = 3000; // This port won't be directly used in Netlify Functions
const secretKey = process.env.SECRET_KEY;

app.use(express.json());
app.use(cors());

// MongoDB Connection
const mongoose_url = process.env.MONGODB_URL;
console.log('MongoDB URL:', mongoose_url);

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

// Register (Signup) Route
app.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const newUser = new User({ username, password, email });
    await newUser.save();
    res.body = { message: 'User registered successfully' };
    res.status(201).send(res.body);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(400).json({ message: error.message });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: '1h',
    });
    res.body = { message: 'Login successful', token };
    res.send(res.body);
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Example protected route
app.get('/protected', authenticateToken, (req, res) => {
  res.body = {
    message: 'Protected resource accessed',
    userId: req.user.userId,
  };
  res.send(res.body);
});

// Get all products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.body = products;
    res.send(res.body);
  } catch (err) {
    console.error('Error getting products:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create a product (protected)
app.post('/products', authenticateToken, async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.body = savedProduct;
    res.status(201).send(res.body);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ message: err.message });
  }
});

// Get a single product
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.body = product;
    res.send(res.body);
  } catch (err) {
    console.error('Error getting product:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update a product (protected)
app.put('/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.body = product;
    res.send(res.body);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete a product (protected)
app.delete('/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.body = { message: 'Product deleted' };
    res.send(res.body);
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: err.message });
  }
});

// Export the handler function for Netlify Functions
exports.handler = async (event, context) => {
  const server = app.listen(port, () => {
    console.log(`Shopping Site API listening at http://localhost:${port}`);
  });

  // Handle requests to the Express app
  return new Promise((resolve, reject) => {
    server.on('request', (req, res) => {
      resolve({
        statusCode: res.statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(res.body), // Convert the response body to JSON string
      });
    });
  });
};
