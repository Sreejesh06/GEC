const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['operational', 'critical', 'shutdown'],
    default: 'operational'
  },
  pressure: {
    type: Number,
    required: true
  },
  temperature: {
    type: Number,
    required: true
  },
  vibration: {
    type: Number,
    required: true
  },
  gasFlow: {
    type: Number,
    required: true
  },
  RUL: {
    type: Number,
    required: true
  },
  maintenanceHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    action: String,
    technician: String,
    notes: String
  }],
  alertHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    parameter: String,
    value: Number,
    threshold: Number,
    severity: {
      type: String,
      enum: ['warning', 'critical']
    }
  }]
}, { timestamps: true });

// Add method to check if machine is in critical state
machineSchema.methods.checkStatus = function() {
  if (this.RUL < 20) {
    this.status = 'shutdown';
  } else if (
    this.RUL < 50 || 
    this.pressure > 1500 || 
    this.temperature > 300 || 
    this.vibration > 7 || 
    this.gasFlow > 3
  ) {
    this.status = 'critical';
  } else {
    this.status = 'operational';
  }
  return this.status;
};

module.exports = mongoose.model('Machine', machineSchema);