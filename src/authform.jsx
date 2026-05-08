import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase"; 
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export default function AuthForm() {
  const navigate = useNavigate();

  // --- STATE VARIABLES ---
  const [isLogin, setIsLogin] = useState(true);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("student");
  const [loginInput, setLoginInput] = useState(""); 
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- GSAP REFS ---
  const containerRef = useRef(null);
  const formRef = useRef(null);

  // --- CHECK EXISTING SESSION ---
  useEffect(() => {
    const checkSession = async () => {
      // Fake admin bypass check (from your original code)
      if (localStorage.getItem("nep_admin_bypass")) {
        navigate("/admin-dashboard", { replace: true });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, status")
          .eq("id", session.user.id)
          .single();
        
        if (profile) {
          if (profile.role === "society" && profile.status === "pending") {
            await supabase.auth.signOut();
            setError("Your society account is pending admin approval.");
          } else {
            // Redirect based on role
            if (profile.role === "admin") navigate("/admin-dashboard");
            else if (profile.role === "society") navigate("/society-dashboard");
            else navigate("/student-dashboard");
          }
        }
      }
    };
    checkSession();
  }, [navigate]);

  // --- GSAP ANIMATIONS ---
  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      ".glass-card",
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1, ease: "power4.out" }
    );
    tl.fromTo(
      ".auth-header",
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.7)" },
      "-=0.6"
    );
  }, { scope: containerRef });

  useGSAP(() => {
    gsap.fromTo(
      ".gsap-input",
      { x: isLogin ? -30 : 30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power3.out" }
    );
  }, { dependencies: [isLogin], scope: formRef });

  // --- AUTHENTICATION LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: loginInput, // Assuming they use email to login
          password: password,
        });

        if (authError) throw authError;

        // Fetch user profile to check role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, status")
          .eq("id", data.user.id)
          .single();

        if (profileError) throw profileError;

        // Check if society is pending
        if (profile.role === "society" && profile.status === "pending") {
          await supabase.auth.signOut();
          throw new Error("Your society account is still pending admin approval.");
        }

        // Redirect based on role
        if (profile.role === "admin") navigate("/admin-dashboard");
        else if (profile.role === "society") navigate("/society-dashboard");
        else navigate("/student-dashboard");

      } else {
        // --- SIGNUP LOGIC ---
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match!");
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        // Insert into profiles table
        if (data?.user) {
          const { error: profileError } = await supabase.from("profiles").insert([
            {
              id: data.user.id,
              username: username,
              full_name: fullname,
              role: role,
              status: role === "society" ? "pending" : "approved",
            },
          ]);

          if (profileError) throw profileError;

          if (role === "society") {
            setError("Society account created! Please wait for admin approval.");
            setIsLogin(true); // Switch to login view
          } else {
            navigate("/student-dashboard"); // Students get immediate access
          }
        }
      }
    } catch (err) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER UI ---
  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[#2a0845] via-[#4A0E4E] to-[#600000] overflow-hidden relative"
    >
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FFD700] rounded-full mix-blend-overlay filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#9333EA] rounded-full mix-blend-overlay filter blur-[128px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="glass-card relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-3xl p-8 overflow-hidden">
        
        <div className="auth-header text-center mb-6">
          <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
            {isLogin ? "Holaa" : "Konnect"}
          </h2>
          <p className="text-gray-300 mt-2 font-light">
            {isLogin ? "Continue from where you left" : "Create account."}
          </p>
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center font-medium backdrop-blur-sm">
            {error}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {!isLogin && (
            <div className="gsap-input">
              <input 
                type="text" 
                placeholder="Full Name" 
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required={!isLogin}
                className="w-full px-5 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all duration-300 backdrop-blur-sm" 
              />
            </div>
          )}

          <div className="gsap-input">
            <input 
              type={isLogin ? "text" : "email"} 
              placeholder={isLogin ? "Email Address" : "Email Address"} 
              value={isLogin ? loginInput : email}
              onChange={(e) => isLogin ? setLoginInput(e.target.value) : setEmail(e.target.value)}
              required 
              className="w-full px-5 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all duration-300 backdrop-blur-sm" 
            />
          </div>

          {!isLogin && (
            <div className="gsap-input">
              <input 
                type="text" 
                placeholder="Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                className="w-full px-5 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all duration-300 backdrop-blur-sm" 
              />
            </div>
          )}

          <div className="gsap-input">
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="w-full px-5 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all duration-300 backdrop-blur-sm" 
            />
          </div>

          {!isLogin && (
            <>
              <div className="gsap-input">
                <input 
                  type="password" 
                  placeholder="Confirm Password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={!isLogin} 
                  className="w-full px-5 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all duration-300 backdrop-blur-sm" 
                />
              </div>
              <div className="gsap-input">
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                >
                  <option value="student" className="text-black">Student</option>
                  <option value="society" className="text-black">Society</option>
                </select>
              </div>
            </>
          )}

          {isLogin && (
             <div className="gsap-input text-right">
               <a href="#" className="text-sm text-gray-300 hover:text-[#FFD700] transition-colors">
                 Forgot password?
               </a>
             </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`gsap-input mt-4 w-full py-3.5 rounded-xl text-[#2A0845] font-bold text-lg shadow-[0_0_15px_rgba(255,215,0,0.4)] transition-all duration-300 uppercase tracking-wider ${loading ? 'bg-yellow-600 cursor-not-allowed opacity-70' : 'bg-[#FFD700] hover:shadow-[0_0_25px_rgba(255,215,0,0.6)] hover:scale-[1.02] active:scale-[0.98]'}`}
          >
            {loading ? "Processing..." : isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-8 text-center gsap-input border-t border-white/10 pt-6">
          <p className="text-gray-300">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(""); // Clear errors when switching modes
              }} 
              className="ml-2 text-[#FFD700] font-semibold hover:underline decoration-2 underline-offset-4 focus:outline-none"
            >
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}