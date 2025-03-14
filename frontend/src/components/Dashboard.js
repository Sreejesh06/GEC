import React, { useState, useEffect, useCallback, useMemo } from "react";
import { machines } from "../data/machines";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWind, faHeartPulse, faGauge, faThermometerHalf, 
  faExclamationCircle, faUser, faMoon, faSun 
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

// Component for a machine card
const MachineCard = ({ machine, index }) => (
  <div className={`machine-card ${machine.RUL < 50 ? "error" : "good"}`}>
    <div className="machine-name">{`MACHINE ${index + 1}`}</div>
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
    <div className={`rul ${machine.RUL < 50 ? "blink" : ""}`}>
      <FontAwesomeIcon icon={faHeartPulse} className="icon orange-icon" />
      <span>RUL: {machine.RUL.toFixed(2)} %</span>
      {machine.RUL < 50 && <FontAwesomeIcon icon={faExclamationCircle} className="alert-icon" />}
    </div>
  </div>
);

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

  // Memoized counts for data cards
  const criticalCounts = useMemo(() => ({
    pressure: machineData.filter(machine => machine.pressure > 1500).length,
    temperature: machineData.filter(machine => machine.temperature > 300).length,
    vibration: machineData.filter(machine => machine.vibration > 7).length,
    gasFlow: machineData.filter(machine => machine.gasFlow > 3).length
  }), [machineData]);

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
        {machineData.map((machine, index) => (
          <MachineCard 
            key={`machine-${index}`} 
            machine={machine} 
            index={index} 
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;