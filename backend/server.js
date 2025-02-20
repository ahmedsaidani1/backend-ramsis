import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Vehicle } from './models/vehicle.js';
import { Reservation } from './models/reservation.js';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// CORS configuration with proper headers
const corsOptions = {
  origin: ['http://localhost:5173', 'https://ramsisrentacar.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files with proper headers and CORS enabled
app.use('/uploads', (req, res, next) => {
  res.set({
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
    "Cache-Control": "public, max-age=31536000",
    "Cross-Origin-Resource-Policy": "cross-origin",
  });
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Configure multer for image upload with enhanced security
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed!'));
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Create uploads directory if it doesn't exist
import { mkdir } from 'fs/promises';
try {
  await mkdir(path.join(__dirname, 'uploads'), { recursive: true });
} catch (err) {
  console.error('Error creating uploads directory:', err);
}

// Enhanced MongoDB connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

connectDB();

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Image upload endpoint with error handling
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// Multiple images upload endpoint with error handling
app.post('/api/upload-multiple', upload.array('images', 3), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ imageUrls });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ message: 'Error uploading files', error: error.message });
  }
});

// Vehicle Routes with enhanced error handling
app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicles', error: error.message });
  }
});

app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle', error: error.message });
  }
});

app.post('/api/vehicles', async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    const newVehicle = await vehicle.save();
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(400).json({ message: 'Error creating vehicle', error: error.message });
  }
});

app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: 'Error updating vehicle', error: error.message });
  }
});

app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting vehicle', error: error.message });
  }
});

// Reservation Routes with enhanced error handling
app.get('/api/reservations', async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reservations', error: error.message });
  }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const reservation = new Reservation(req.body);
    const newReservation = await reservation.save();
    res.status(201).json(newReservation);
  } catch (error) {
    res.status(400).json({ message: 'Error creating reservation', error: error.message });
  }
});

app.put('/api/reservations/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (error) {
    res.status(400).json({ message: 'Error updating reservation', error: error.message });
  }
});

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting reservation', error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply error handling middleware
app.use(errorHandler);

// Start server with enhanced error handling
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});