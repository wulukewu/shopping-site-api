require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Product = require('./models/Product');
const User = require('./models/User');

const app = express();
const port = 3000;
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

// Default Route
app.get('/', (req, res) => {
  res.send('Shopping Site API');
});

// Register (Signup) Route
app.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body; // Get username, password and email from request body
    const newUser = new User({ username, password, email }); // Create a new user instance
    await newUser.save(); // Save the new user to the database
    res.status(201).json({ message: 'User registered successfully' }); // Respond with a success message
  } catch (error) {
    console.error('Error registering user:', error); // Log any errors
    res.status(400).json({ message: error.message }); // Respond with an error message
  }
});

// Login Route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body; // Get username and password from request body

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' }); // Respond with an error if user not found
    }

    // Compare the provided password with the stored password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' }); // Respond with an error if passwords do not match
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: '1h',
    }); // Sign a JWT token with user ID and secret key

    // Respond with the token and a success message
    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error logging in:', error); // Log any errors
    res.status(500).json({ message: 'Login failed' }); // Respond with a server error message
  }
});

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']; // Get the authorization header
  const token = authHeader && authHeader.split(' ')[1]; // Extract the token from the header

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' }); // Respond with an error if no token is present
  }

  jwt.verify(token, secretKey, (err, user) => {
    // Verify the JWT token
    if (err) {
      return res.status(403).json({ message: 'Invalid token' }); // Respond with an error if the token is invalid
    }

    req.user = user; // Attach the user information to the request object
    next(); // Proceed to the next middleware or route handler
  });
};

// Example protected route (requires authentication)
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Protected resource accessed', userId: req.user.userId }); // Respond with a success message and user ID
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

app.post('/products', authenticateToken, async (req, res) => {
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

app.put('/products/:id', authenticateToken, async (req, res) => {
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

app.delete('/products/:id', authenticateToken, async (req, res) => {
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
