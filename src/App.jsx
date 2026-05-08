import React from "react";
import { Routes, Route } from "react-router-dom"; 
import LandingPage from "./LandingPage";
import AuthForm from "./AuthForm";

function App() {
  return (    
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthForm />} />
      </Routes>
  );
}

export default App;