const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const residentRoutes = require('./routes/residents'); // Add this line

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (run on evert backend API request)
app.use(cors()); //react app communication point
app.use(express.json()); //converts incoming json playloads to js objects

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/residents', residentRoutes); // Add this line

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Residex Server is running!' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/residex')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});