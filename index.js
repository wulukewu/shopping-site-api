const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

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

// Load products from products.json (temporary - will be replaced by database)
const products = JSON.parse(
  fs.readFileSync('../shopping-site/public/products.json', 'utf-8')
);

app.get('/products', (req, res) => {
  res.json(products);
});

app.listen(port, () => {
  console.log(`Shopping Site API listening at http://localhost:${port}`);
});
