import React from "react";
import { Routes, Route } from "react-router-dom"; 
import LandingPage from "./LandingPage";
import AuthForm from "./authform";
import StudentDashboard from "./studentDashboard"; 
import Admin from "./admin";
import SocietyDashboard from "./societyDashboard";
import CreateEvent from "./createEvents";
import ProtectedRoute from "./Routes"; 

function App() {        
  return (    
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthForm />} />
        
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route element={<ProtectedRoute allowedRole="society" />}>
          <Route path="/society-dashboard" element={<SocietyDashboard />} />
          <Route path="/create-event" element={<CreateEvent />} />
        </Route>

        <Route element={<ProtectedRoute allowedRole="student" />}>
          <Route path="/student-dashboard" element={<StudentDashboard />} />
        </Route>
      </Routes>
  );
}

export default App;