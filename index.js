// 1. Import the express module, cors and dotenv
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv')

// Cargar variables de entorno (asegúrate de que sea el primer archivo)
dotenv.config();
// 2. Initialize the express application
const app = express();

// 3. Define the port the server will run on
const PORT = process.env.PORT || 3000;

// =================================================================
// 💡 MIDDLEWARE
// =================================================================

// Use built-in middleware to parse JSON data in the body of incoming requests.
// This is essential if your API endpoints receive JSON data (e.g., in a POST request).
app.use(express.json());
app.use(cors());

// Optional: Use body-parser for URL-encoded data if needed (less common in modern Express apps)
// app.use(express.urlencoded({ extended: true }));


// =================================================================
// 🛣️ ROUTES (API Endpoints)
// =================================================================

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth',authRoutes);

/**
 * Root route handler (GET /)
 * This is the basic "landing page" endpoint.
 */
app.get('/', (req, res) => {
    res.status(200).send('<h1>Welcome to the Express API!</h1><p>Try accessing the <a href="/api/data">/api/data</a> endpoint.</p>');
});


/**
 * Example API endpoint: /api/data
 * This demonstrates handling a GET request and responding with JSON.
 */
app.get('/api/data', (req, res) => {
    const dummyData = [
        { id: 1, message: 'Item one retrieved successfully.' },
        { id: 2, message: 'Item two retrieved successfully.' },
        { id: 3, message: 'Service is running.' }
    ];
    // res.json() automatically sets the Content-Type header to application/json
    res.status(200).json({ 
        success: true, 
        data: dummyData, 
        timestamp: new Date().toISOString() 
    });
});


/**
 * Example POST route handler: /api/submit
 * This demonstrates accepting and processing JSON data sent in the request body.
 */
app.post('/api/submit', (req, res) => {
    // Since we used app.use(express.json()), the data is available in req.body
    const submittedData = req.body; 
    
    if (!submittedData || !submittedData.name) {
        return res.status(400).json({ success: false, message: 'Missing name in the request body.' });
    }

    console.log(`Received submission for: ${submittedData.name}`);

    // Logic to save data to a database would go here...

    res.status(201).json({ 
        success: true, 
        message: 'Data received and processed successfully!',
        received: submittedData 
    });
});


// =================================================================
// 🚀 START THE SERVER
// =================================================================

app.listen(PORT, () => {
    console.log('========================================');
    console.log(`✅ Server is running successfully!`);
    console.log(`🚀 Access the API at: http://localhost:${PORT}`);
    console.log('========================================');
});


// ### 🚀 How to Run This Code

// 1.  **Setup Project:**
//     ```bash
//     mkdir my-express-app
//     cd my-express-app
//     npm init -y
//     ```
// 2.  **Install Dependency:**
//     ```bash
//     npm install express
//     ```
// 3.  **Create File:**
//     Save the code above as `index.js` in your project directory.
// 4.  **Run Server:**
//     ```bash
//     node index.js
//     ```

// ### What This Code Does:

// *   **Initialization:** Sets up Express and designates the server port to `3000` (or uses the port from environment variables if provided).
// *   **Middleware (`app.use(express.json())`):** This is critical. It allows your server to understand and read JSON data sent in the body of `POST` requests, making the data available at `req.body`.
// *   **GET `/`:** Provides a simple HTML welcome message.
// *   **GET `/api/data`:** An example API endpoint that returns structured JSON data.
// *   **POST `/api/submit`:** A sample endpoint that demonstrates receiving data (like a form submission) via the request body and responding with a confirmation.