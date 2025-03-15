const express = require('express');
const Machine = require('../models/Machine');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Start simulation for all machines
router.post('/start', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    // Clear any existing simulation
    if (global.simulationIntervals) {
      for (const interval of global.simulationIntervals) {
        clearInterval(interval);
      }
    }
    
    // Array to store all interval IDs
    global.simulationIntervals = [];
    
    // Helper function to update a specific parameter
    const updateParameter = async (paramName, frequency) => {
      const intervalId = setInterval(async () => {
        try {
          const machines = await Machine.find();
          
          for (const machine of machines) {
            // Only update the specified parameter
            switch (paramName) {
              case 'pressure':
                machine.pressure += Math.random() * 20 - 10; // Larger changes for pressure
                machine.pressure = Math.max(0, machine.pressure);
                break;
              case 'temperature':
                machine.temperature += Math.random() * 4 - 2;
                machine.temperature = Math.max(0, machine.temperature);
                break;
              case 'vibration':
                machine.vibration += Math.random() * 0.8 - 0.4;
                machine.vibration = Math.max(0, machine.vibration);
                break;
              case 'gasFlow':
                machine.gasFlow += Math.random() * 0.2 - 0.1;
                machine.gasFlow = Math.max(0, machine.gasFlow);
                break;
              case 'RUL':
                // RUL always decreases slowly
                machine.RUL -= Math.random() * 0.1;
                machine.RUL = Math.max(0, machine.RUL);
                break;
            }
            
            // Check if we need to add alerts
            const previousStatus = machine.status;
            const newStatus = machine.checkStatus();
            
            if (previousStatus !== 'critical' && newStatus === 'critical') {
              // Add alert for transition to critical
              let criticalParameter = '';
              let value = 0;
              let threshold = 0;
              
              if (machine.pressure > 1500) {
                criticalParameter = 'pressure';
                value = machine.pressure;
                threshold = 1500;
              } else if (machine.temperature > 300) {
                criticalParameter = 'temperature';
                value = machine.temperature;
                threshold = 300;
              } else if (machine.vibration > 7) {
                criticalParameter = 'vibration';
                value = machine.vibration;
                threshold = 7;
              } else if (machine.gasFlow > 3) {
                criticalParameter = 'gasFlow';
                value = machine.gasFlow;
                threshold = 3;
              } else if (machine.RUL < 50) {
                criticalParameter = 'RUL';
                value = machine.RUL;
                threshold = 50;
              }
              
              machine.alertHistory.push({
                parameter: criticalParameter,
                value,
                threshold,
                severity: 'critical'
              });
            }
            
            await machine.save();
          }
        } catch (err) {
          console.error(`Simulation error (${paramName}):`, err);
        }
      }, frequency); // Frequency in milliseconds
      
      global.simulationIntervals.push(intervalId);
    };
    
    // Start different update frequencies for each parameter
    updateParameter('vibration', 1000);  // Every 1 second
    updateParameter('gasFlow', 2000);    // Every 2 seconds
    updateParameter('pressure', 3000);   // Every 3 seconds
    updateParameter('temperature', 5000); // Every 5 seconds
    updateParameter('RUL', 10000);       // Every 10 seconds
    
    res.json({ message: 'Simulation started with variable frequencies' });
  } catch (error) {
    console.error('Start simulation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Stop simulation
router.post('/stop', authenticateToken, authorizeRole(['admin']), (req, res) => {
  if (global.simulationIntervals && global.simulationIntervals.length > 0) {
    for (const interval of global.simulationIntervals) {
      clearInterval(interval);
    }
    global.simulationIntervals = [];
    res.json({ message: 'Simulation stopped' });
  } else {
    res.status(400).json({ message: 'No simulation is currently running' });
  }
});

// Generate a critical event on a specific machine
router.post('/critical-event/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { parameter } = req.body;
    const machine = await Machine.findById(req.params.id);
    
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    
    // Create a critical event based on the specified parameter
    switch (parameter) {
      case 'pressure':
        machine.pressure = 1600 + Math.random() * 200;
        break;
      case 'temperature':
        machine.temperature = 320 + Math.random() * 30;
        break;
      case 'vibration':
        machine.vibration = 8 + Math.random() * 2;
        break;
      case 'gasFlow':
        machine.gasFlow = 3.2 + Math.random() * 0.5;
        break;
      case 'RUL':
        machine.RUL = 15 + Math.random() * 5;
        break;
      default:
        return res.status(400).json({ message: 'Invalid parameter specified' });
    }
    
    machine.checkStatus();
    
    // Add to alert history
    machine.alertHistory.push({
      parameter,
      value: machine[parameter],
      threshold: getThresholdForParameter(parameter),
      severity: 'critical'
    });
    
    await machine.save();
    
    res.json({ message: 'Critical event generated', machine });
  } catch (error) {
    console.error('Generate critical event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to get threshold for a parameter
function getThresholdForParameter(parameter) {
  switch (parameter) {
    case 'pressure': return 1500;
    case 'temperature': return 300;
    case 'vibration': return 7;
    case 'gasFlow': return 3;
    case 'RUL': return 50;
    default: return 0;
  }
}

module.exports = router;