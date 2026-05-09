import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase"; 
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Lock } from "lucide-react"; 

export default function AuthForm() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false); 
  
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("student");
  const [loginInput, setLoginInput] = useState(""); 
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const formRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const checkSession = async () => {
      if (localStorage.getItem("nep_admin_bypass") === "true") {
        navigate("/admin", { replace: true });
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
            if (profile.role === "admin") navigate("/admin");
            else if (profile.role === "society") navigate("/society-dashboard");
            else navigate("/student-dashboard");
          }
        }
      }
    };
    checkSession();
  }, [navigate]);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      cardRef.current,
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
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power3.out" }
    );
  }, { dependencies: [isLogin, isAdminMode], scope: formRef });

  useGSAP(() => {
    if (isAdminMode) {
      gsap.to(cardRef.current, { borderColor: "rgba(220, 38, 38, 0.5)", duration: 0.5 }); 
    } else {
      gsap.to(cardRef.current, { borderColor: "rgba(255, 255, 255, 0.2)", duration: 0.5 }); 
    }
  }, { dependencies: [isAdminMode] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isAdminMode) {
        if (loginInput === "admin" && password === "admin") {
          localStorage.setItem("nep_admin_bypass", "true");
          navigate("/admin");
          return;
        } else {
          throw new Error("Access Denied: Invalid Admin Credentials.");
        }
      } 
      else if (isLogin) {
        if (loginInput === "admin" && password === "admin") {
          localStorage.setItem("nep_admin_bypass", "true");
          navigate("/admin");
          return;
        }

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: loginInput, 
          password: password,
        });

        if (authError) throw authError;

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, status")
          .eq("id", data.user.id)
          .single();

        if (profileError) throw profileError;

        if (profile.role === "society" && profile.status === "pending") {
          await supabase.auth.signOut();
          throw new Error("Your society account is still pending admin approval.");
        }

        if (profile.role === "society") navigate("/society-dashboard");
        else navigate("/student-dashboard");

      } 
      else {
        if (password !== confirmPassword) throw new Error("Passwords do not match!");

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data?.user) {
          const { error: profileError } = await supabase.from("profiles").insert([
            {
              id: data.user.id,
              username: username,
              fullname: fullname,
              role: role,
              status: role === "society" ? "pending" : "approved",
            },
          ]);

          if (profileError) throw profileError;

          if (role === "society") {
            setError("Society account created! Please wait for admin approval.");
            setIsLogin(true); 
          } else {
            navigate("/student-dashboard"); 
          }
        }
      }
    } catch (err) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
    setIsLogin(true); 
    setError("");
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[#2a0845] via-[#4A0E4E] to-[#600000] overflow-hidden relative"
    >
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full mix-blend-overlay filter blur-[128px] opacity-20 animate-pulse transition-colors duration-1000 ${isAdminMode ? 'bg-red-600' : 'bg-[#FFD700]'}`}></div>
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full mix-blend-overlay filter blur-[128px] opacity-30 animate-pulse transition-colors duration-1000 ${isAdminMode ? 'bg-orange-600' : 'bg-[#9333EA]'}`} style={{ animationDelay: '2s' }}></div>

      <button 
        onClick={toggleAdminMode}
        className={`absolute bottom-6 right-6 p-3 rounded-full transition-all duration-500 z-50 ${isAdminMode ? 'text-red-400 bg-red-900/30' : 'text-white/20 hover:text-white/60 bg-transparent'}`}
        title="Admin Override"
      >
        <Lock size={20} />
      </button>

      {/* Form Card */}
      <div 
        ref={cardRef}
        className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-3xl p-8 overflow-hidden transition-all duration-500"
      >
        
        <div className="auth-header text-center mb-6">
          <h2 className={`text-4xl font-extrabold tracking-tight drop-shadow-md transition-colors ${isAdminMode ? 'text-red-500' : 'text-white'}`}>
            {isAdminMode ? "System Override" : isLogin ? "Holaa" : "Konnect"}
          </h2>
          <p className="text-gray-300 mt-2 font-medium tracking-wide">
            {isAdminMode ? "Enter admin credentials." : isLogin ? "Continue from where you left" : "Create account."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center font-medium backdrop-blur-sm">
            {error}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {(!isLogin && !isAdminMode) && (
            <div className="gsap-input">
              <input 
                type="text" 
                placeholder="Full Name" 
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required={!isLogin}
                className="w-full px-5 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all" 
              />
            </div>
          )}

          <div className="gsap-input">
            <input 
              type={isLogin || isAdminMode ? "text" : "email"} 
              placeholder={isAdminMode ? "Admin Username" : "Email Address / Username"} 
              value={isLogin || isAdminMode ? loginInput : email}
              onChange={(e) => isLogin || isAdminMode ? setLoginInput(e.target.value) : setEmail(e.target.value)}
              required 
              className={`w-full px-5 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${isAdminMode ? 'focus:border-red-500 focus:ring-red-500' : 'focus:border-[#FFD700] focus:ring-[#FFD700]'}`} 
            />
          </div>

          {(!isLogin && !isAdminMode) && (
            <div className="gsap-input">
              <input 
                type="text" 
                placeholder="Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                className="w-full px-5 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all" 
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
              className={`w-full px-5 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${isAdminMode ? 'focus:border-red-500 focus:ring-red-500' : 'focus:border-[#FFD700] focus:ring-[#FFD700]'}`} 
            />
          </div>

          {(!isLogin && !isAdminMode) && (
            <>
              <div className="gsap-input">
                <input 
                  type="password" 
                  placeholder="Confirm Password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={!isLogin} 
                  className="w-full px-5 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all" 
                />
              </div>
              <div className="gsap-input">
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl bg-black/30 border border-white/10 text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all appearance-none cursor-pointer"
                >
                  <option value="student" className="text-black">Student</option>
                  <option value="society" className="text-black">Society</option>
                </select>
              </div>
            </>
          )}

          {(isLogin && !isAdminMode) && (
             <div className="gsap-input text-right">
               <a href="#" className="text-sm text-gray-400 hover:text-[#FFD700] transition-colors">
                 Forgot password?
               </a>
             </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`gsap-input mt-4 w-full py-3.5 rounded-xl font-black text-lg transition-all duration-300 uppercase tracking-widest
              ${loading ? 'bg-gray-500 cursor-not-allowed opacity-70' : 
                isAdminMode 
                  ? 'bg-red-600 text-white hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] hover:scale-[1.02]' 
                  : 'bg-[#FFD700] text-[#2A0845] hover:shadow-[0_0_25px_rgba(255,215,0,0.6)] hover:scale-[1.02]'}`}
          >
            {loading ? "Processing..." : isAdminMode ? "Authenticate Admin" : isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        {!isAdminMode && (
          <div className="mt-8 text-center gsap-input border-t border-white/10 pt-6">
            <p className="text-gray-300">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }} 
                className="ml-2 text-[#FFD700] font-bold hover:underline decoration-2 underline-offset-4 focus:outline-none"
              >
                {isLogin ? "Sign Up" : "Log In"}
              </button>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}