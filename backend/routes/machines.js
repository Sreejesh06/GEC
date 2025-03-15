const express = require('express');
const Machine = require('../models/Machine');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get all machines
router.get('/', authenticateToken, async (req, res) => {
  try {
    const machines = await Machine.find();
    res.json(machines);
  } catch (error) {
    console.error('Get machines error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific machine
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    
    res.json(machine);
  } catch (error) {
    console.error('Get machine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new machine (admin only)
router.post('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { name, pressure, temperature, vibration, gasFlow, RUL } = req.body;
    
    const newMachine = new Machine({
      name,
      pressure,
      temperature,
      vibration,
      gasFlow,
      RUL
    });
    
    // Set initial status based on parameters
    newMachine.checkStatus();
    
    await newMachine.save();
    
    res.status(201).json(newMachine);
  } catch (error) {
    console.error('Create machine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update machine (admin and technician only)
router.put('/:id', authenticateToken, authorizeRole(['admin', 'technician']), async (req, res) => {
  try {
    const { pressure, temperature, vibration, gasFlow, RUL } = req.body;
    
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    
    if (pressure !== undefined) machine.pressure = pressure;
    if (temperature !== undefined) machine.temperature = temperature;
    if (vibration !== undefined) machine.vibration = vibration;
    if (gasFlow !== undefined) machine.gasFlow = gasFlow;
    if (RUL !== undefined) machine.RUL = RUL;
    
    // Update status based on new values
    machine.checkStatus();
    
    await machine.save();
    
    res.json(machine);
  } catch (error) {
    console.error('Update machine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Restore machine from shutdown (admin and technician only)
router.post('/:id/restore', authenticateToken, authorizeRole(['admin', 'technician']), async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    
    // Restore machine parameters to healthy levels
    machine.RUL = 75 + Math.random() * 20; // Random value between 75-95%
    machine.pressure = Math.min(machine.pressure, 1400);
    machine.temperature = Math.min(machine.temperature, 280);
    machine.vibration = Math.min(machine.vibration, 6);
    machine.gasFlow = Math.min(machine.gasFlow, 2.8);
    
    // Add maintenance record
    machine.maintenanceHistory.push({
      action: 'System restore',
      technician: req.user.username,
      notes: 'Machine restored from shutdown state'
    });
    
    machine.status = 'operational';
    
    await machine.save();
    
    res.json(machine);
  } catch (error) {
    console.error('Restore machine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get machine maintenance history
router.get('/:id/maintenance', authenticateToken, async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    
    res.json(machine.maintenanceHistory);
  } catch (error) {
    console.error('Get maintenance history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add maintenance record
router.post('/:id/maintenance', authenticateToken, authorizeRole(['admin', 'technician']), async (req, res) => {
  try {
    const { action, notes } = req.body;
    
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    
    machine.maintenanceHistory.push({
      action,
      technician: req.user.username,
      notes
    });
    
    await machine.save();
    
    res.status(201).json(machine.maintenanceHistory);
  } catch (error) {
    console.error('Add maintenance record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;