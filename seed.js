const { Sequelize } = require('sequelize');
const fs = require('fs');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite', // Path to your SQLite database file
  logging: false, // Disable logging for cleaner output (optional)
});

// Define Product model (same as in your backend)
const ProductModel = require('./models/Product');
const Product = ProductModel(sequelize);

// Load Products from JSON File
async function seedProducts() {
  try {
    // Read the JSON file
    const productsJson = fs.readFileSync('../shopping-site/public/products.json', 'utf8'); // Make sure path is correct
    const products = JSON.parse(productsJson);

    // Authenticate DB connection
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Sync the model with the database (creates the table if it doesn't exist)
    await sequelize.sync({ force: true }); // Use force: true to drop the table and recreate it. This will clear existing data!
    console.log('Database synced successfully.');

    // Insert each product into the database
    for (const productData of products) {
      await Product.create(productData);
    }

    console.log('Products seeded successfully!');
  } catch (error) {
    console.error('Error seeding products:', error);
  } finally {
    await sequelize.close(); // Close connection when done
  }
}

seedProducts();
