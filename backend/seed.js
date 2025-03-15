const mongoose = require('mongoose');
const Machine = require('./models/Machine');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/machineMonitoring', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB for seeding'))
.catch(err => {
  console.error('Could not connect to MongoDB:', err);
  process.exit(1);
});

// Sample machine data
const sampleMachines = [
  {
    name: 'Turbine Generator T-1000',
    pressure: 1200,
    temperature: 280,
    vibration: 5.5,
    gasFlow: 2.4,
    RUL: 87
  },
  {
    name: 'Compressor Unit C-750',
    pressure: 1450,
    temperature: 310,
    vibration: 6.2,
    gasFlow: 2.1,
    RUL: 65
  },
  {
    name: 'Heat Exchanger HX-300',
    pressure: 980,
    temperature: 190,
    vibration: 3.1,
    gasFlow: 1.8,
    RUL: 92
  },
  {
    name: 'Pumping System P-420',
    pressure: 1350,
    temperature: 260,
    vibration: 4.7,
    gasFlow: 2.6,
    RUL: 76
  },
  {
    name: 'Motor Drive MD-600',
    pressure: 1550,
    temperature: 305,
    vibration: 7.2,
    gasFlow: 2.9,
    RUL: 48
  },
  {
    name: 'Ventilation Unit V-200',
    pressure: 850,
    temperature: 175,
    vibration: 2.8,
    gasFlow: 1.5,
    RUL: 91
  },
  {
    name: 'Cooling Tower CT-500',
    pressure: 1050,
    temperature: 210,
    vibration: 3.9,
    gasFlow: 2.0,
    RUL: 84
  },
  {
    name: 'Filtration System F-100',
    pressure: 920,
    temperature: 150,
    vibration: 2.2,
    gasFlow: 1.2,
    RUL: 88
  }
];

// Sample users
const sampleUsers = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    email: 'admin@example.com'
  },
  {
    username: 'tech1',
    password: 'tech123',
    role: 'technician',
    email: 'tech1@example.com'
  },
  {
    username: 'viewer1',
    password: 'viewer123',
    role: 'viewer',
    email: 'viewer1@example.com'
  }
];

// Seed the database
async function seedDatabase() {
  try {
    // Clear existing data
    await Machine.deleteMany({});
    await User.deleteMany({});
    
    // Create machines with proper status
    for (const machineData of sampleMachines) {
      const machine = new Machine(machineData);
      machine.checkStatus(); // Set initial status based on parameters
      await machine.save();
    }
    
    // Create users
    await User.create(sampleUsers);
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();