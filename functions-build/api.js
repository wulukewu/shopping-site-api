require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const serverless = require('serverless-http');
const Product = require('../models/Product');
const User = require('../models/User');

const app = express();
const router = express.Router(); // Use express.Router()
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

// Define all the routes using the router object
router.get('/', (req, res) => {
  res.send('Shopping Site API');
});

// Register (Signup) Route
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const newUser = new User({ username, password, email });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(400).json({ message: error.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
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

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get user by ID (requires authentication)
router.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userProfile = {
      username: user.username,
      email: user.email,
    };

    res.json(userProfile);
  } catch (err) {
    console.error('Error getting user:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update profile route
router.put('/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Get user ID from the authenticated token
    const { username, password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (username) {
      user.username = username;
    }
    if (password) {
      user.password = password;
    }
    await user.save();

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(400).json({ message: err.message });
  }
});

// Example protected route
router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Protected resource accessed', userId: req.user.userId });
});

// Get all products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error('Error getting products:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create a product (protected)
router.post('/products', authenticateToken, async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ message: err.message });
  }
});

// Get a single product
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('Error getting product:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update a product (protected)
router.put('/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete a product (protected)
router.delete('/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: err.message });
  }
});
// This should be at the very end
app.use('/.netlify/functions/api', router);

module.exports.handler = serverless(app);
