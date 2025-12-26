const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB, sequelize } = require('./config/db'); 
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

require('./models/User'); 
require('./models/RefreshToken');

dotenv.config();
const app = express();

// Security Middlewares - helmet and rate limiting
app.use(helmet());
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
app.use('/api/', limiter);

// Connect to Database
connectDB();

// 👇 NEW: Sync MySQL Tables
// force: false = don't delete data. 
// force: true = DROP TABLES and recreate (Use with caution)
sequelize.sync({ force: false }).then(() => {
    console.log("MySQL Tables Synced");
});

// Required when adding frontend. -- CORS Configurationn 
    // const corsOptions = {
    //     // 🔒 STRICT MODE: Only allow localhost:3000 (React/Next.js default)
    //     origin: 'http://localhost:3000', 
        
    //     // 🔓 DEV MODE (Uncomment below to allow ALL ports if 3000 doesn't work)
    //     // origin: '*', 

    //     // 🔓 VITE MODE (Uncomment below if using Vite)
    //     // origin: 'http://localhost:5173',

    //     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    //     credentials: true, // Required for cookies/sessions
    //     optionsSuccessStatus: 204
    // };

    // To Apply the CORS middleware with options
    // app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(cors());

// Swagger Config
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'My Backend API',
            version: '1.0.0',
            description: 'Authentication API for Frontend Developers',
            contact: {
                name: 'Backend Developer'
            }
        },
        servers: [{ url: `http://localhost:${process.env.PORT}` }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./docs/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;