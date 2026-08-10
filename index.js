// 1. Import the express module, cors and dotenv
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const http = require('http');
const {Server} = require('socket.io');

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/library', express.static(path.join(__dirname, 'library')));

// Optional: Use body-parser for URL-encoded data if needed (less common in modern Express apps)
// app.use(express.urlencoded({ extended: true }));


// =================================================================
// 🛣️ ROUTES (API Endpoints)
// =================================================================


const authRoutes = require('./routes/v1/authRoutes');
app.use('/api/auth',authRoutes);
const plansRoutes = require('./routes/v1/plansRoutes');
app.use('/api/plans',plansRoutes);
const exercisesRoutes = require('./routes/v1/exercisesRoutes');
app.use('/api/exercises', exercisesRoutes);
const progressRoutes = require('./routes/v1/progressRoutes');
app.use('/api/progress', progressRoutes);
const recipesRoutes = require('./routes/v1/recipesRoutes');
app.use('/api/recipes', recipesRoutes);
const dietsRoutes = require('./routes/v1/dietsRoutes');
app.use('/api/diets',dietsRoutes);
const adminRoutes = require('./routes/v1/adminRoutes');
app.use('/api/admin', adminRoutes);
const libraryRoutes = require('./routes/v1/libraryRoutes');
app.use('/api/library', libraryRoutes);
const newsRoutes = require('./routes/v1/newsRoutes');
app.use('/api/news', newsRoutes);
const workoutsRoutes = require('./routes/v1/workoutsRoutes');
app.use('/api/workouts', workoutsRoutes);
const paymentsRoutes = require('./routes/v1/paymentsRoutes');
app.use('/api/payments', paymentsRoutes);
const notificationsRoutes = require('./routes/v1/notificationsRoutes');
app.use('/api/notifications', notificationsRoutes);


app.get('/api/testApi', (req, res) => {
    res.status(200).json({
        success: true,
        message:"Conexión con la API funcionando correctamente.",
        code:200
    })
})

// =================================================================
// ⚡ SOCKET.IO
// =================================================================
const server = http.createServer(app);

const io = new Server(server, {
    cors:{
        origin: "*",
        methods: ["GET","POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`Cliente conectado ${socket.id}`)

    socket.on('mensaje_cliente', (data) => {
        console.log('Mensaje recibido:', data);

        io.emit('mensaje_servidor', {
            emisor: socket.id,
            texto: data.texto
        });
    });

    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`)
    })

})
app.set('io', io);
// =================================================================
// 🚀 START THE SERVER
// =================================================================


server.listen(PORT, () => {
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