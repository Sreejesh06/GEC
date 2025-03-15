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
import { getAllMachines, restoreMachine, login, register, startSimulation } from '../api';

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

// Update the MachineCard component

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
        <div className={`value ${isCritical ? 'critical' : ''} ${isUpdated ? 'updating' : ''}`}>
          {value} {unit}
        </div>
        <div className="label">{label}</div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState("login");
  const [users, setUsers] = useState([{ username: "admin", password: "password" }]);
  const [machineData, setMachineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [prioritizeCritical, setPrioritizeCritical] = useState(false);
  const [dataUpdated, setDataUpdated] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(false);

  // Apply theme effect
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  }, []);

  // Fetch machine data from backend
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await getAllMachines();
        
        // Check if this is the first load or an update
        if (machineData.length && response.data.length) {
          // Highlight which parameters changed by comparing with previous data
          const newMachines = response.data.map((machine, idx) => {
            if (idx < machineData.length) {
              return {
                ...machine,
                // Add flags for parameters that changed
                _pressureChanged: Math.abs(machine.pressure - machineData[idx].pressure) > 0.01,
                _temperatureChanged: Math.abs(machine.temperature - machineData[idx].temperature) > 0.01,
                _vibrationChanged: Math.abs(machine.vibration - machineData[idx].vibration) > 0.01,
                _gasFlowChanged: Math.abs(machine.gasFlow - machineData[idx].gasFlow) > 0.01,
                _RULChanged: Math.abs(machine.RUL - machineData[idx].RUL) > 0.01
              };
            }
            return machine;
          });
          
          setMachineData(newMachines);
        } else {
          setMachineData(response.data);
        }
        
        setLoading(false);
        // Flash the update indicator
        setDataUpdated(true);
        // Update the current time to reflect the update
        const now = new Date();
        setCurrentTime(now.toLocaleTimeString());
        setTimeout(() => setDataUpdated(false), 500);
      } catch (err) {
        console.error("Error fetching machines:", err);
        setError("Failed to load machine data");
        setLoading(false);
      }
    };

    fetchMachines();
    
    // Poll every 1 second to match the fastest parameter update
    const interval = setInterval(fetchMachines, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Add this effect to set the current time
  useEffect(() => {
    // Set initial time
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    };
    updateTime();
    
    // Update time every minute
    const timeInterval = setInterval(updateTime, 60000);
    return () => clearInterval(timeInterval);
  }, []);

  // Authentication handlers
  const handleLogin = useCallback(async (username, password) => {
    try {
      const response = await login(username, password);
      // Store the JWT token in localStorage
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      alert("Invalid credentials");
    }
  }, []);

  const handleCreateAccount = useCallback(async (username, password) => {
    try {
      await register({ username, password });
      setView("login");
      alert("Account created successfully! Please log in.");
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Failed to create account. Username may already exist.");
    }
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setView("login");
  }, []);

  // Handler for restoring machines from shutdown
  const handleRestoreMachine = useCallback(async (index) => {
    try {
      const machineId = machineData[index]._id;
      await restoreMachine(machineId);
      
      // Refresh the data after restoration
      const response = await getAllMachines();
      setMachineData(response.data);
    } catch (err) {
      console.error("Error restoring machine:", err);
    }
  }, [machineData]);

  // Memoized counts for data cards
  const criticalCounts = useMemo(() => ({
    pressure: machineData.filter(machine => machine.pressure > 1500).length,
    temperature: machineData.filter(machine => machine.temperature > 300).length,
    vibration: machineData.filter(machine => machine.vibration > 7).length,
    gasFlow: machineData.filter(machine => machine.gasFlow > 3).length
  }), [machineData]);

  // Sort machines to show critical first if prioritizeCritical is true
  const sortedMachineData = useMemo(() => {
    if (!prioritizeCritical) return machineData;
    
    return [...machineData].sort((a, b) => {
      // First check for shutdown machines (RUL < 20)
      if (a.RUL < 20 && b.RUL >= 20) return -1;
      if (b.RUL < 20 && a.RUL >= 20) return 1;
      
      // Then check for critical machines (RUL < 50)
      if (a.RUL < 50 && b.RUL >= 50) return -1;
      if (b.RUL < 50 && a.RUL >= 50) return 1;
      
      // Otherwise sort by RUL ascending
      return a.RUL - b.RUL;
    });
  }, [machineData, prioritizeCritical]);

  const togglePrioritizeCritical = useCallback(() => {
    setPrioritizeCritical(prev => !prev);
  }, []);

  // Start simulation after login
  useEffect(() => {
    if (isAuthenticated && !simulationRunning) {
      const startSim = async () => {
        try {
          await startSimulation();
          setSimulationRunning(true);
          console.log("Simulation started");
        } catch (err) {
          console.error("Error starting simulation:", err);
        }
      };
      startSim();
    }
  }, [isAuthenticated, simulationRunning]);

  // Render authentication screens if not authenticated
  if (!isAuthenticated) {
    if (view === "login") {
      return <Login onLogin={handleLogin} onCreateAccount={() => setView("createAccount")} onForgotPassword={() => setView("forgotPassword")} />;
    } else if (view === "createAccount") {
      return <CreateAccount onAccountCreated={handleCreateAccount} />;
    } else if (view === "forgotPassword") {
      return <ForgotPassword onPasswordReset={() => setView("login")} />;
    }
  }

  // Add loading and error handling in the return section
  // Inside your return, before the main dashboard content
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
        <button 
          className={`sort-button ${prioritizeCritical ? 'active' : ''}`} 
          onClick={togglePrioritizeCritical}
        >
          <div className="sort-button-content">
            <FontAwesomeIcon icon={faSort} className="sort-icon" />
            <span>{prioritizeCritical ? 'Normal Order' : 'Sort by Critical Status'}</span>
          </div>
          <div className="sort-status">{prioritizeCritical ? 'Showing critical first' : 'Default order'}</div>
        </button>
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
        {(prioritizeCritical ? sortedMachineData : machineData).map((machine, index) => (
          <MachineCard 
            key={`machine-${index}`} 
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