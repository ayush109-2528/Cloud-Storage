const express = require('express');
const cors = require('cors');
require('dotenv').config();

const folderRoutes = require('./src/routes/folderRoutes');
const fileRoutes = require('./src/routes/fileRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'https://cloud-storage-orcin.vercel.app', 
    credentials: true
})); // Allow all origins for dev, or configure for production
app.use(express.json());

// Routes
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);

app.get('/', (req, res) => {
    res.send('Cloud Storage API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
module.exports = app;