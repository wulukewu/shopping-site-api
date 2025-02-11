const express = require('express');
const cors = require('cors');
const fs = require('fs'); // Import the file system module
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// Load products from products.json (same location as your Vue app for now)
const products = JSON.parse(
  fs.readFileSync('../shopping-site/public/products.json', 'utf-8')
);

app.get('/', (req, res) => {
  res.send('Hello from the Shopping Site API!');
});

app.get('/products', (req, res) => {
  res.json(products); // Send the products as JSON
});

app.listen(port, () => {
  console.log(`Shopping Site API listening at http://localhost:${port}`);
});
