import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWind, faHeartPulse, faGauge, faThermometerHalf, 
  faExclamationCircle, faUser, faMoon, faSun, faTimes, faSort
} from '@fortawesome/free-solid-svg-icons';
import { MdOutlineWaves } from "react-icons/md";
import Login from "./Login";
import CreateAccount from "./CreateAccount";
import ForgotPassword from "./ForgotPassword";
import "../styles/Dashboard.css";

// Component for a data card
const DataCard = ({ icon, count, label, iconClass }) => (
  <div className="data-card">
    {icon === "waves" ? (
      <MdOutlineWaves className={`icon ${iconClass}`} />
    ) : (
      <FontAwesomeIcon icon={icon} className={`icon ${iconClass}`} />
    )}
    <div className="issue-count">{count}</div>
    <div className="data-label">{label}</div>
  </div>
);

const MachineCard = ({ machine, index, onRestore }) => {
  const isShutdown = machine.RUL < 20;
  const isCritical = machine.RUL < 50;
  
  // Check if any parameter exceeds its critical threshold
  const hasCriticalParameter = 
    machine.pressure > 1500 || 
    machine.temperature > 300 || 
    machine.vibration > 7 || 
    machine.gasFlow > 3;
  
  const handleRestoreClick = (e) => {
    e.stopPropagation();
    onRestore(index);
  };
  
  return (
    <div className={`machine-card ${
      isShutdown ? "shutdown" : 
      isCritical || hasCriticalParameter ? "error" : 
      "good"
    }`}>
      <div className="machine-name">MACHINE {index + 1}</div>
      {isShutdown && (
        <div className="shutdown-overlay">
          <FontAwesomeIcon icon={faExclamationCircle} className="shutdown-icon" />
          <div className="shutdown-text">SHUTDOWN</div>
          <div className="shutdown-message">Critical failure detected</div>
          <button className="restore-button" onClick={handleRestoreClick}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}
      <div className="machine-data">
        <DataItem 
          icon={faGauge} 
          value={machine.pressure.toFixed(2)} 
          unit="psi" 
          label="Pressure" 
          isCritical={machine.pressure > 1500}
          isUpdated={machine._pressureChanged}
          iconClass="blue-icon" 
        />
        <DataItem 
          icon={faThermometerHalf} 
          value={machine.temperature.toFixed(2)} 
          unit="°C" 
          label="Temperature" 
          isCritical={machine.temperature > 300}
          isUpdated={machine._temperatureChanged}
          iconClass="yellow-icon" 
        />
        <DataItem 
          icon="waves" 
          value={machine.vibration.toFixed(2)} 
          unit="Hz" 
          label="Vibration" 
          isCritical={machine.vibration > 7}
          isUpdated={machine._vibrationChanged}
          iconClass="purple-icon" 
        />
        <DataItem 
          icon={faWind} 
          value={machine.gasFlow.toFixed(2)} 
          unit="kg/s" 
          label="Gas Flow" 
          isCritical={machine.gasFlow > 3}
          isUpdated={machine._gasFlowChanged}
          iconClass="green-icon" 
        />
      </div>
      <div className={`rul ${isCritical ? "blink" : ""} ${machine._RULChanged ? "updating" : ""}`}>
        <FontAwesomeIcon icon={faHeartPulse} className="icon orange-icon" />
        <span>RUL: {machine.RUL.toFixed(2)} %</span>
        {(isCritical || hasCriticalParameter) && <FontAwesomeIcon icon={faExclamationCircle} className="alert-icon" />}
      </div>
      {!isShutdown && hasCriticalParameter && (
        <div className="parameter-alert">
          <FontAwesomeIcon icon={faExclamationCircle} className="parameter-alert-icon" />
          <span>Critical parameter detected</span>
        </div>
      )}
    </div>
  );
};

// Component for a data item inside machine card
const DataItem = ({ icon, value, unit, label, isCritical, isUpdated, iconClass }) => {
  // Add a warning state for values approaching critical thresholds (within 90%)
  const isWarning = () => {
    const numValue = parseFloat(value);
    
    switch (label) {
      case 'Pressure':
        return !isCritical && numValue > 1350; // 90% of critical threshold 1500
      case 'Temperature':
        return !isCritical && numValue > 270; // 90% of critical threshold 300
      case 'Vibration':
        return !isCritical && numValue > 6.3; // 90% of critical threshold 7
      case 'Gas Flow':
        return !isCritical && numValue > 2.7; // 90% of critical threshold 3
      default:
        return false;
    }
  };
  
  const warning = isWarning();
  
  return (
    <div className="data-item">
      <div className="icon-container">
        {typeof icon === "string" && icon === "waves" ? (
          <MdOutlineWaves className={`icon ${iconClass} ${isUpdated ? "pulse" : ""}`} />
        ) : (
          <FontAwesomeIcon icon={icon} className={`icon ${iconClass} ${isUpdated ? "pulse" : ""}`} />
        )}
      </div>
      <div className="data-content">
        <div className={`value ${isCritical ? 'critical' : warning ? 'warning' : ''} ${isUpdated ? 'updating' : ''}`}>
          {value} {unit}
        </div>
        <div className="label">{label}</div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Auto-authenticate for demo
  const [machineData, setMachineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [dataUpdated, setDataUpdated] = useState(false);
  const [prioritizeCritical, setPrioritizeCritical] = useState(false);

  // Apply theme effect
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  }, []);

  // Initialize mock data
  useEffect(() => {
    // Create exactly 12 machines - 8 good and 4 critical
    const initialMachines = [
      // 8 operational machines with healthy parameters
      ...Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: `Machine ${i + 1}`,
        pressure: 1000 + Math.random() * 300, // Safe range
        temperature: 200 + Math.random() * 50, // Safe range
        vibration: 4 + Math.random() * 1.5,    // Safe range
        gasFlow: 2 + Math.random() * 0.5,      // Safe range
        RUL: 70 + Math.random() * 25,          // Healthy RUL (70-95%)
        status: 'operational',
        isFrozen: false
      })),
      
      // 4 machines with critical parameters
      {
        id: 9,
        name: 'Machine 9',
        pressure: 1550 + Math.random() * 100,  // Critical pressure (>1500)
        temperature: 250 + Math.random() * 30,
        vibration: 5 + Math.random() * 1,
        gasFlow: 2.5 + Math.random() * 0.3,
        RUL: 55 + Math.random() * 15,
        status: 'critical',
        isFrozen: true
      },
      {
        id: 10,
        name: 'Machine 10',
        pressure: 1200 + Math.random() * 200,
        temperature: 320 + Math.random() * 30,  // Critical temperature (>300)
        vibration: 5 + Math.random() * 1,
        gasFlow: 2.5 + Math.random() * 0.3,
        RUL: 55 + Math.random() * 15,
        status: 'critical',
        isFrozen: true
      },
      {
        id: 11,
        name: 'Machine 11',
        pressure: 1200 + Math.random() * 200,
        temperature: 250 + Math.random() * 30,
        vibration: 7.5 + Math.random() * 1,    // Critical vibration (>7)
        gasFlow: 2.5 + Math.random() * 0.3,
        RUL: 55 + Math.random() * 15,
        status: 'critical',
        isFrozen: true
      },
      {
        id: 12,
        name: 'Machine 12',
        pressure: 1200 + Math.random() * 200,
        temperature: 250 + Math.random() * 30,
        vibration: 5 + Math.random() * 1,
        gasFlow: 3.2 + Math.random() * 0.5,    // Critical gas flow (>3)
        RUL: 15 + Math.random() * 10,          // Critical RUL, near shutdown (<20)
        status: 'shutdown',
        isFrozen: true
      }
    ];
    
    setMachineData(initialMachines);
    setLoading(false);
  }, []);

  // Function to update a single parameter
  const updateParameter = (machines, paramName, minChange, maxChange) => {
    // Count how many machines are currently in critical or shutdown state
    const criticalCount = machines.filter(m => 
      m.status === 'critical' || m.status === 'shutdown' || m.isFrozen
    ).length;

    // Max allowed critical machines (we'll allow up to 5)
    const MAX_CRITICAL = 5;
    
    return machines.map(machine => {
      // Skip update if machine is frozen (in critical state)
      if (machine.isFrozen) return machine;
      
      // For healthy machines, add random fluctuations
      const currentValue = machine[paramName];
      const change = minChange + Math.random() * (maxChange - minChange);
      const newValue = currentValue + change;
      
      // Ensure values stay in reasonable ranges
      let boundedValue = Math.max(0, newValue);
      
      // Add a chance for a healthy machine to occasionally drift toward critical values
      // This creates more realistic behavior where some machines might approach the warning threshold
      let willBeCritical = false;
      
      // Check if this update would make the machine critical
      switch (paramName) {
        case 'pressure':
          willBeCritical = boundedValue > 1500;
          break;
        case 'temperature':
          willBeCritical = boundedValue > 300;
          break;
        case 'vibration':
          willBeCritical = boundedValue > 7;
          break;
        case 'gasFlow':
          willBeCritical = boundedValue > 3;
          break;
        case 'RUL':
          willBeCritical = boundedValue < 50;
          // For RUL, make sure it only decreases
          boundedValue = Math.min(currentValue, boundedValue);
          break;
      }
      
      const RECOVERY_COOLDOWN = 60000; // 60 seconds before a machine can go critical after restoration

      // Check if this machine is in the cooldown period after restoration
      const inCooldown = machine._recoveryTime && 
                        (Date.now() - machine._recoveryTime) < RECOVERY_COOLDOWN;

      // If in cooldown, don't allow critical state
      if (inCooldown) {
        willBeCritical = false;
        
        // Ensure values stay below critical thresholds during cooldown
        switch (paramName) {
          case 'pressure':
            boundedValue = Math.min(boundedValue, 1400);
            break;
          case 'temperature':
            boundedValue = Math.min(boundedValue, 280);
            break;
          case 'vibration':
            boundedValue = Math.min(boundedValue, 6.5);
            break;
          case 'gasFlow':
            boundedValue = Math.min(boundedValue, 2.8);
            break;
          case 'RUL':
            boundedValue = Math.max(boundedValue, 60);
            break;
        }
      }
      
      // If this change would make the machine critical, but we already have MAX_CRITICAL machines,
      // then prevent it from crossing the critical threshold
      if (willBeCritical && criticalCount >= MAX_CRITICAL) {
        // The machine ID is important - machines 9-12 are allowed to go critical
        // Other machines should stay in a good state
        if (machine.id < 9) {
          // For normal machines (1-8), keep them just below critical thresholds
          switch (paramName) {
            case 'pressure':
              boundedValue = Math.min(boundedValue, 1490);
              break;
            case 'temperature':
              boundedValue = Math.min(boundedValue, 295);
              break;
            case 'vibration':
              boundedValue = Math.min(boundedValue, 6.9);
              break;
            case 'gasFlow':
              boundedValue = Math.min(boundedValue, 2.95);
              break;
            case 'RUL':
              boundedValue = Math.max(boundedValue, 51);
              break;
          }
          willBeCritical = false; // Override the critical status
        }
      }
      
      // Small chance for machines 9-12 to drift toward their predefined critical parameter
      if (machine.id >= 9 && Math.random() < 0.1) {
        switch (machine.id) {
          case 9:
            // Machine 9 - pressure issues
            if (paramName === 'pressure') {
              boundedValue = 1510 + Math.random() * 100;
              willBeCritical = true;
            }
            break;
          case 10:
            // Machine 10 - temperature issues
            if (paramName === 'temperature') {
              boundedValue = 310 + Math.random() * 30;
              willBeCritical = true;
            }
            break;
          case 11:
            // Machine 11 - vibration issues
            if (paramName === 'vibration') {
              boundedValue = 7.2 + Math.random() * 0.8;
              willBeCritical = true;
            }
            break;
          case 12:
            // Machine 12 - gas flow and RUL issues
            if (paramName === 'gasFlow') {
              boundedValue = 3.1 + Math.random() * 0.5;
              willBeCritical = true;
            } else if (paramName === 'RUL' && Math.random() < 0.2) {
              boundedValue = 15 + Math.random() * 10;
              willBeCritical = true;
            }
            break;
        }
      }
      
      return {
        ...machine,
        [paramName]: boundedValue,
        [`_${paramName}Changed`]: Math.abs(boundedValue - currentValue) > 0.01,
        isFrozen: willBeCritical || machine.isFrozen,
        status: boundedValue < 20 && paramName === 'RUL' ? 'shutdown' : 
                willBeCritical ? 'critical' : 'operational'
      };
    });
  };
  
  // Simulate real-time parameter updates with different frequencies
  useEffect(() => {
    // Pressure updates - every 3 seconds
    const pressureInterval = setInterval(() => {
      setMachineData(prevData => {
        const updated = updateParameter(prevData, 'pressure', -10, 20);
        setDataUpdated(true);
        setTimeout(() => setDataUpdated(false), 500);
        return updated;
      });
    }, 3000);

    // Temperature updates - every 5 seconds
    const temperatureInterval = setInterval(() => {
      setMachineData(prevData => updateParameter(prevData, 'temperature', -2, 4));
    }, 5000);

    // Vibration updates - every 1 second
    const vibrationInterval = setInterval(() => {
      setMachineData(prevData => updateParameter(prevData, 'vibration', -0.4, 0.8));
    }, 1000);

    // Gas Flow updates - every 2 seconds
    const gasFlowInterval = setInterval(() => {
      setMachineData(prevData => updateParameter(prevData, 'gasFlow', -0.1, 0.2));
    }, 2000);
    
    // RUL decreases - every 10 seconds
    const rulInterval = setInterval(() => {
      setMachineData(prevData => updateParameter(prevData, 'RUL', -0.5, 0));
    }, 10000);
    
    // Update the time display every second
    const timeInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    }, 1000);
    
    return () => {
      clearInterval(pressureInterval);
      clearInterval(temperatureInterval);
      clearInterval(vibrationInterval);
      clearInterval(gasFlowInterval);
      clearInterval(rulInterval);
      clearInterval(timeInterval);
    };
  }, []);

  // Handler for restoring machines from shutdown
  const handleRestoreMachine = useCallback((index) => {
    setMachineData(prevData => {
      const newData = [...prevData];
      
      // Get the machine's ID
      const machineId = newData[index].id;
      
      // If this is one of our "always critical" machines (9-12), 
      // restore but keep some parameter close to critical
      if (machineId >= 9) {
        // Restore but keep one parameter in danger zone based on machine ID
        switch (machineId) {
          case 9:
            // Machine 9 - keeps high pressure
            newData[index] = {
              ...newData[index],
              pressure: 1480 + Math.random() * 40, // Just below or at critical
              temperature: 200 + Math.random() * 50,
              vibration: 4 + Math.random() * 1.5,
              gasFlow: 2 + Math.random() * 0.5,
              RUL: 55 + Math.random() * 15,
              isFrozen: false,
              status: 'operational',
              _recoveryTime: Date.now()
            };
            break;
          case 10:
            // Machine 10 - keeps high temperature
            newData[index] = {
              ...newData[index],
              pressure: 1000 + Math.random() * 300,
              temperature: 290 + Math.random() * 20, // Just below or at critical
              vibration: 4 + Math.random() * 1.5,
              gasFlow: 2 + Math.random() * 0.5,
              RUL: 55 + Math.random() * 15,
              isFrozen: false,
              status: 'operational',
              _recoveryTime: Date.now()
            };
            break;
          case 11:
            // Machine 11 - keeps high vibration
            newData[index] = {
              ...newData[index],
              pressure: 1000 + Math.random() * 300,
              temperature: 200 + Math.random() * 50,
              vibration: 6.8 + Math.random() * 0.5, // Just below or at critical
              gasFlow: 2 + Math.random() * 0.5,
              RUL: 55 + Math.random() * 15,
              isFrozen: false,
              status: 'operational',
              _recoveryTime: Date.now()
            };
            break;
          case 12:
            // Machine 12 - keeps high gas flow
            newData[index] = {
              ...newData[index],
              pressure: 1000 + Math.random() * 300,
              temperature: 200 + Math.random() * 50,
              vibration: 4 + Math.random() * 1.5,
              gasFlow: 2.9 + Math.random() * 0.3, // Just below or at critical
              RUL: 55 + Math.random() * 15,
              isFrozen: false,
              status: 'operational',
              _recoveryTime: Date.now()
            };
            break;
          default:
            break;
        }
      } else {
        // Restore machine to healthy state
        newData[index] = {
          ...newData[index],
          pressure: 1000 + Math.random() * 300,
          temperature: 200 + Math.random() * 50,
          vibration: 4 + Math.random() * 1.5,
          gasFlow: 2 + Math.random() * 0.5,
          RUL: 75 + Math.random() * 20,
          isFrozen: false,
          status: 'operational',
          _recoveryTime: Date.now()
        };
      }
      
      return newData;
    });
  }, []);

  // Memoized counts for data cards
  const criticalCounts = useMemo(() => ({
    pressure: machineData.filter(machine => machine.pressure > 1500).length,
    temperature: machineData.filter(machine => machine.temperature > 300).length,
    vibration: machineData.filter(machine => machine.vibration > 7).length,
    gasFlow: machineData.filter(machine => machine.gasFlow > 3).length
  }), [machineData]);

  // Sort machines with critical machines first
  const sortedMachineData = useMemo(() => {
    if (!prioritizeCritical) return machineData;
    
    return [...machineData].sort((a, b) => {
      // First check for shutdown machines (RUL < 20)
      if (a.RUL < 20 && b.RUL >= 20) return -1;
      if (b.RUL < 20 && a.RUL >= 20) return 1;
      
      // Then check for critical machines (RUL < 50)
      if (a.RUL < 50 && b.RUL >= 50) return -1;
      if (b.RUL < 50 && a.RUL >= 50) return 1;
      
      // Otherwise sort by RUL ascending (lower RUL comes first)
      return a.RUL - b.RUL;
    });
  }, [machineData, prioritizeCritical]);

  // Toggle prioritization of critical machines
  const togglePrioritizeCritical = useCallback(() => {
    setPrioritizeCritical(prev => !prev);
  }, []);

  // For demo purposes, auto-logout function
  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <div>Loading machine data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <FontAwesomeIcon icon={faExclamationCircle} className="error-icon" />
        <div>{error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="company-name">Tech Realm X</div>
        <div className="theme-toggle" onClick={toggleTheme}>
          <FontAwesomeIcon icon={theme === "dark" ? faMoon : faSun} />
          <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
        </div>
        <div className={`user-info ${dataUpdated ? 'data-updated' : ''}`}>
          <button className="user-button">
            <FontAwesomeIcon icon={faUser} className="user-icon" />
            <span className="user-name">sreejesh</span>
          </button>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
          <span className="last-updated">Last Updated: {currentTime}</span>
        </div>
      </header>
      
      <div className="total-machines">
        <h2>Total Machines</h2>
        <div className="total-number">{machineData.length}</div>
      </div>

      <div className="controls-bar">
        <div className="sort-controls">
          <button 
            className={`sort-button ${prioritizeCritical ? 'active' : ''}`} 
            onClick={togglePrioritizeCritical}
          >
            <div className="sort-button-content">
              <FontAwesomeIcon icon={faSort} className="sort-icon" />
              <span>{prioritizeCritical ? 'Normal Order' : 'Sort by Critical Status'}</span>
            </div>
            <div className="sort-status">
              {prioritizeCritical ? 'Showing critical first' : 'Default order'}
            </div>
          </button>
        </div>
      </div>

      <div className="data-cards">
        <DataCard 
          icon={faGauge} 
          count={criticalCounts.pressure} 
          label="Pressure" 
          iconClass="blue-icon" 
        />
        <DataCard 
          icon={faThermometerHalf} 
          count={criticalCounts.temperature} 
          label="Temperature" 
          iconClass="yellow-icon" 
        />
        <DataCard 
          icon="waves" 
          count={criticalCounts.vibration} 
          label="Vibration" 
          iconClass="purple-icon" 
        />
        <DataCard 
          icon={faWind} 
          count={criticalCounts.gasFlow} 
          label="Gas Flow" 
          iconClass="green-icon" 
        />
      </div>

      <div className="machine-grid">
        {sortedMachineData.map((machine, index) => (
          <MachineCard 
            key={`machine-${machine.id}`} 
            machine={machine} 
            index={index}
            onRestore={handleRestoreMachine}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;