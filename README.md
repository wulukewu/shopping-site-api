# Shopping Site API

This is the backend API for a shopping site, built with Node.js, Express.js, and MongoDB. It provides user authentication (registration and login) and manages product data.  This version is configured to run both locally and as a serverless function on Netlify.

## Frontend Repository

The frontend repository for this project can be found [here](https://github.com/wulukewu/shopping-site).

## Demo

Check out the live demo of the project [here](https://shopping-site.luke-ray.site).

## Features

*   **User Authentication:**
    *   Registration: Allows new users to create accounts with a username, email, and password.
    *   Login: Authenticates existing users and issues a JSON Web Token (JWT) for secure access to protected routes.
*   **Product Management:**
    *   Get All Products: Retrieves a list of all products from the database.
    *   Get Product by ID: Retrieves a specific product by its ID.
    *   Create Product (Protected):  Requires authentication (JWT) to create a new product.
    *   Update Product (Protected): Requires authentication to update an existing product.
    *   Delete Product (Protected): Requires authentication to delete a product.
*   **JWT Authentication:** Uses JWTs to secure API endpoints, ensuring that only authenticated users can access sensitive data and operations.
*   **CORS Support:**  Enables Cross-Origin Resource Sharing (CORS) to allow requests from different domains (e.g., the frontend).
*   **Serverless Deployment (Netlify):**  Can be deployed as a serverless function on Netlify for scalability and cost-effectiveness.

## Technologies Used

*   Node.js
*   Express.js
*   MongoDB
*   Mongoose
*   bcrypt
*   jsonwebtoken
*   cors
*   dotenv
*   serverless-http
*   netlify-lambda

## Prerequisites

*   Node.js and npm installed.
*   MongoDB database set up (either local or cloud-based).
*   Netlify CLI (if deploying to Netlify).

## Installation

1.  **Clone the repository:**

    ```bash
    git clone git@github.com:wulukewu/shopping-site-api.git
    cd shopping-site-api
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure environment variables:**

    *   Create a `.env` file in the root of the project.
    *   Add the following variables, replacing the placeholders with your actual values:

        ```
        SECRET_KEY='your_secret_key' # Used to sign JWTs - generate a strong, random key
        MONGODB_URL='mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority'
        ```

        **Important:** Never commit your `.env` file to version control.  It contains sensitive information.

## Running the API

### Local Development

1.  **Start the development server:**

    ```bash
    npm start
    ```

    This will start the server using `nodemon`, which automatically restarts the server on file changes.  The API will be accessible at `http://localhost:3000`.

### Netlify Deployment

1.  **Build the project:**

    ```bash
    npm run build
    ```

    This command uses `netlify-lambda` to build the serverless function in the `functions-build` directory.

2.  **Deploy to Netlify:**

    *   If you have the Netlify CLI installed and configured:

        ```bash
        netlify deploy --prod
        ```

    *   Alternatively, you can drag and drop the `functions-build` folder into the Netlify UI.

3.  **Set environment variables in Netlify:**

    *   In your Netlify project dashboard, go to "Site settings" -> "Environment variables".
    *   Add the `SECRET_KEY` and `MONGODB_URL` variables with their corresponding values.

## API Endpoints

*   `POST /register`:  Register a new user.  Expects `username`, `password`, and `email` in the request body.
*   `POST /login`:  Login an existing user.  Expects `username` and `password` in the request body.  Returns a JWT token on success.
*   `GET /protected`:  Example protected route.  Requires a valid JWT token in the `Authorization` header.
*   `GET /products`:  Get all products.
*   `GET /products/:id`:  Get a product by ID.
*   `POST /products`:  Create a new product (protected).  Requires a valid JWT token.
*   `PUT /products/:id`:  Update an existing product (protected).  Requires a valid JWT token.
*   `DELETE /products/:id`:  Delete a product (protected). Requires a valid JWT token.

**Authentication:**

*   To access protected routes, include the JWT token in the `Authorization` header as a Bearer token:

    ```
    Authorization: Bearer <your_jwt_token>
    ```

## Models

### User

```javascript
{
  username: String,
  email: String,
  password: String // Hashed and salted
}
```

### Product

```javascript
{
  name: String,
  description: String,
  price: Number,
  // ... other product properties
}
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the Apache-2.0 License.
