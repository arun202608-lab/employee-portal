import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Users from "./pages/Users";
import Permissions from "./pages/Permissions";
import Roles from "./pages/Roles";
import AuditLogs from "./pages/AuditLogs";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/users" element={<Users />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/permissions" element={<Permissions />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;