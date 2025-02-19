import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  vehicleName: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true
  },
  pickupLocation: {
    type: String,
    required: true
  },
  dropoffLocation: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['en attente', 'en cours', 'terminé'],
    default: 'en attente'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Reservation = mongoose.model('Reservation', reservationSchema);