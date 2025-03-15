import React, { useState, useEffect, useCallback, useMemo } from "react";
import { machines } from "../data/machines";
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

// Update the MachineCard component to check for any critical parameter

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
      <div className="machine-name">{machine.name || `MACHINE ${index + 1}`}</div>
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
          iconClass="blue-icon" 
        />
        <DataItem 
          icon={faThermometerHalf} 
          value={machine.temperature.toFixed(2)} 
          unit="°C" 
          label="Temperature" 
          isCritical={machine.temperature > 300} 
          iconClass="yellow-icon" 
        />
        <DataItem 
          icon="waves" 
          value={machine.vibration.toFixed(2)} 
          unit="Hz" 
          label="Vibration" 
          isCritical={machine.vibration > 7} 
          iconClass="purple-icon" 
        />
        <DataItem 
          icon={faWind} 
          value={machine.gasFlow.toFixed(2)} 
          unit="kg/s" 
          label="Gas Flow" 
          isCritical={machine.gasFlow > 3} 
          iconClass="green-icon" 
        />
      </div>
      <div className={`rul ${isCritical ? "blink" : ""}`}>
        <FontAwesomeIcon icon={faHeartPulse} className="icon orange-icon" />
        <span>RUL: {machine.RUL.toFixed(2)} %</span>
        {(isCritical || hasCriticalParameter) && <FontAwesomeIcon icon={faExclamationCircle} className="alert-icon" />}
      </div>
      {/* Add parameter alert indicator when a parameter is critical but not shutdown */}
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
const DataItem = ({ icon, value, unit, label, isCritical, iconClass }) => (
  <div className="data-item">
    {icon === "waves" ? (
      <MdOutlineWaves className={`icon ${iconClass}`} />
    ) : (
      <FontAwesomeIcon icon={icon} className={`icon ${iconClass}`} />
    )}
    <span className={isCritical ? "critical" : ""}>
      {value} {unit}
    </span>
    <div className="data-label">{label}</div>
  </div>
);

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState("login");
  const [users, setUsers] = useState([{ username: "admin", password: "password" }]);
  const [machineData, setMachineData] = useState(machines);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [prioritizeCritical, setPrioritizeCritical] = useState(false);

  // Apply theme effect
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  }, []);

  // Update machine data at regular intervals
  useEffect(() => {
    const updateData = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString());

      setMachineData((prevData) =>
        prevData.map((machine) => ({
          ...machine,
          pressure: machine.pressure + Math.random() * 10 - 5,
          temperature: machine.temperature + Math.random() * 2 - 1,
          vibration: machine.vibration + Math.random() * 0.5 - 0.25,
          gasFlow: machine.gasFlow + Math.random() * 0.1 - 0.05,
          RUL: machine.RUL - Math.random() * 0.1,
        }))
      );
    };

    const interval = setInterval(updateData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Authentication handlers
  const handleLogin = useCallback((username, password) => {
    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
      setIsAuthenticated(true);
    } else {
      alert("Invalid credentials");
    }
  }, [users]);

  const handleCreateAccount = useCallback((username, password) => {
    setUsers(prevUsers => [...prevUsers, { username, password }]);
    setView("login");
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setView("login");
  }, []);

  // Handler for restoring machines from shutdown
  const handleRestoreMachine = useCallback((index) => {
    setMachineData(prevData => {
      const updatedData = [...prevData];
      // Restore the machine's RUL to a safe level
      updatedData[index] = {
        ...updatedData[index],
        RUL: 75 + Math.random() * 20, // Random value between 75-95%
        // Also normalize other critical parameters
        pressure: Math.min(updatedData[index].pressure, 1400),
        temperature: Math.min(updatedData[index].temperature, 280),
        vibration: Math.min(updatedData[index].vibration, 6),
        gasFlow: Math.min(updatedData[index].gasFlow, 2.8),
      };
      return updatedData;
    });
  }, []);

  // Memoized counts for data cards
  const criticalCounts = useMemo(() => ({
    pressure: machineData.filter(machine => machine.pressure > 1600).length,
    temperature: machineData.filter(machine => machine.temperature > 320).length,
    vibration: machineData.filter(machine => machine.vibration > 8).length,
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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="company-name">Tech Realm X</div>
        <div className="theme-toggle" onClick={toggleTheme}>
          <FontAwesomeIcon icon={theme === "dark" ? faMoon : faSun} />
          <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
        </div>
        <div className="user-info">
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