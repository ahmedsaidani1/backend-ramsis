import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  gallery: [{
    type: String
  }],
  price: {
    type: String,
    required: true
  },
  features: [{
    type: String
  }],
  description: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 5
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  specs: {
    transmission: {
      type: String,
      required: true
    },
    fuel: {
      type: String,
      required: true
    },
    power: {
      type: String,
      required: false
    },
    seats: {
      type: Number,
      default: 5
    },
    consumption: {
      type: String,
      required: true
    },
    luggage: {
      type: String,
      required: false
    }
  }
});

export const Vehicle = mongoose.model('Vehicle', vehicleSchema);