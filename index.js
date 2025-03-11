require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Initialize Express
const app = express();
const port = 3000;
const secretKey = process.env.SECRET_KEY;

app.use(express.json());
app.use(cors());

// Initialize Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/database.sqlite',
  logging: false,
});

// Load Models
const ProductModel = require('./models/Product');
const UserModel = require('./models/User');
const CartModel = require('./models/Cart');
const Product = ProductModel(sequelize);
const User = UserModel(sequelize);
const Cart = CartModel(sequelize);

// Database Associations
User.hasOne(Cart, {
  foreignKey: 'userId',
  as: 'cart', // Alias for the association
});
Cart.belongsTo(User, { foreignKey: 'userId' });

// Authentication Middleware
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

// API Routes

app.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const user = await User.create({ username, password, email });

    // Create an empty cart for the new user
    await Cart.create({ userId: user.id, items: '[]' }); // Initialize with an empty cart (JSON array)

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get user by ID
app.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

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
app.put('/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Get user ID from the authenticated token
    const { username, password } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) {
      user.username = username;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save(); // Save the updated user to the database
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(400).json({ message: err.message }); // 400 Bad Request
  }
});

// Protected route
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Protected resource accessed', userId: req.user.userId });
});

// Products API Endpoints
app.get('/products', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    console.error('Error getting products:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/products', authenticateToken, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ message: err.message });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    console.error('Error getting product:', err);
    res.status(500).json({ message: err.message });
  }
});

app.put('/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.update(req.body);
    res.json(product);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(400).json({ message: err.message });
  }
});

app.delete('/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: err.message });
  }
});

// Cart API Endpoints

// Get cart for a user
app.get('/cart/load', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await Cart.findOne({ where: { userId: userId } });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found for user' });
    }

    // Parse the JSON string into a JavaScript object
    const items = JSON.parse(cart.items);

    res.json(items); // Send the items back to the client
  } catch (err) {
    console.error('Error getting cart:', err);
    res
      .status(500)
      .json({ message: 'Failed to retrieve cart', error: err.message }); //Include the error message
  }
});

// Update cart for a user
app.put('/cart/save', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const items = req.body; // Expect the cart items in the request body

    console.log('Backend received items:', items);

    const cart = await Cart.findOne({ where: { userId: userId } });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found for user' });
    }

    if (!items) {
      return res.status(400).json({ message: 'Cart items are not provided.' });
    }

    // Validate that items is an array
    if (!Array.isArray(items)) {
      return res
        .status(400)
        .json({ message: 'Invalid cart items format.  Expected an array.' });
    }

    // Serialize the cart items array into a JSON string before storing it
    cart.items = JSON.stringify(items);
    await cart.save();

    res.json({ message: 'Cart updated successfully' });
  } catch (err) {
    console.error('Error updating cart:', err);
    res
      .status(500)
      .json({ message: 'Failed to update cart', error: err.message }); // Include the error message
  }
});

// Sync the database and start the server
sequelize
  .sync()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
  });
