const mongoose = require('mongoose');

const SOSRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bloodGroupNeeded: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'critical'],
      required: true,
    },
    hospitalName: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    contactPhone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'fulfilled', 'expired'],
      default: 'pending',
    },
    respondedDonors: [
      {
        donorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'declined'],
          default: 'pending',
        },
        respondedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    bankOffers: [
      {
        bloodBankId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'BloodBank',
          required: true,
        },
        unitsOffered: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'declined'],
          default: 'pending',
        },
        respondedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index location field for geospatial queries on SOS requests if needed
SOSRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('SOSRequest', SOSRequestSchema);
