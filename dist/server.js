import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectToDatabase } from './database/dbconnection.js';
import userRoutes from './routes/userRoutes.js';
import loanApplicationRoutes from './routes/loanApplicationRoutes.js';
dotenv.config();
const app = express();
const port = process.env.DB_PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Create and Upload folder for photos
const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory:', uploadDir);
}
// Serve static files for Angular DIST
console.log('Serving static files from:', uploadDir);
app.use('/uploads', express.static(uploadDir));
console.log(uploadDir);
// Enable CORS
app.use(cors());
// Middleware
app.use(express.json());
// DB Connection
connectToDatabase()
    .then(() => {
    console.log('Database connection established successfully.');
})
    .catch((err) => {
    console.error('Failed to connect to the database:', err);
});
// Routes
app.use('/api', userRoutes);
app.use('/api', loanApplicationRoutes);
// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});
// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
