import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase"; 
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Lock } from "lucide-react"; 

export default function AuthForm() {
  const navigate = useNavigate();

  // --- States ---
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

  // --- GSAP Refs ---
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const cardRef = useRef(null);

  // --- Session Check ---
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
            setError("Your account is pending admin approval. Please wait for an administrator to verify your society.");
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

  // --- GSAP Initial Load ---
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

  // --- GSAP Form Toggle Animations ---
  useGSAP(() => {
    gsap.fromTo(
      ".gsap-input",
      { x: isLogin ? -30 : 30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power3.out" }
    );
  }, { dependencies: [isLogin, isAdminMode], scope: formRef });

  // --- GSAP Admin Mode Transition ---
  useGSAP(() => {
    if (isAdminMode) {
      gsap.to(cardRef.current, { borderColor: "rgba(220, 38, 38, 0.5)", duration: 0.5 }); 
    } else {
      gsap.to(cardRef.current, { borderColor: "rgba(255, 255, 255, 0.2)", duration: 0.5 }); 
    }
  }, { dependencies: [isAdminMode] });

  // --- Submit Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // --- HARDCODED ADMIN LOGIC ---
      if (isAdminMode || (isLogin && loginInput === "admin" && password === "admin")) {
        if (loginInput === "admin" && password === "admin") {
          localStorage.setItem("nep_admin_bypass", "true");
          navigate("/admin");
          return;
        } else {
          throw new Error("Access Denied: Invalid Admin Credentials.");
        }
      } 
      // --- NORMAL USER LOGIN ---
      else if (isLogin) {
        let loginEmail = loginInput;
        
        // If the user typed a username instead of an email, fetch the email first
        if (!loginInput.includes("@")) {
          const { data } = await supabase
            .from("profiles")
            .select("email")
            .eq("username", loginInput)
            .single();

          if (data) loginEmail = data.email;
          else throw new Error("Username not found.");
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: loginEmail, 
          password: password,
        });

        if (authError) throw authError;

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, status")
          .eq("id", authData.user.id)
          .single();

        if (profileError) throw new Error("Failed to fetch user profile.");

        if (profile.role === "society" && profile.status === "pending") {
          await supabase.auth.signOut();
          throw new Error("Your society account has not been approved yet. An admin must verify your account before you can log in.");
        }

        if (profile.role === "society") navigate("/society-dashboard");
        else navigate("/student-dashboard");

      } 
      // --- NORMAL USER SIGNUP ---
      else {
        if (password !== confirmPassword) throw new Error("Passwords do not match!");

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (authData?.user) {
          let finalSocietyId = null;

          // If the user is a society, create the entry in the 'societies' table first
          if (role === 'society') {
            const { data: newSoc, error: socError } = await supabase
              .from("societies")
              .insert([{ name: fullname }]) 
              .select()
              .single();

            if (socError) {
              throw new Error("Error creating society entry: " + socError.message);
            }
            finalSocietyId = newSoc.id;
          }

          // Create the Profile with the linked society_id
          const { error: profileError } = await supabase.from("profiles").insert([{
            id: authData.user.id,
            username: username,
            fullname: fullname,
            email: email,
            role: role,
            status: role === 'society' ? 'pending' : 'approved',
            society_id: finalSocietyId // Links the two tables
          }]);

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

  // --- Secret Admin Toggle Handler ---
  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
    setIsLogin(true); // Admin mode forces login view
    setError("");
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[#2a0845] via-[#4A0E4E] to-[#600000] overflow-hidden relative"
    >
      {/* Background Effects */}
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full mix-blend-overlay filter blur-[128px] opacity-20 animate-pulse transition-colors duration-1000 ${isAdminMode ? 'bg-red-600' : 'bg-[#FFD700]'}`}></div>
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full mix-blend-overlay filter blur-[128px] opacity-30 animate-pulse transition-colors duration-1000 ${isAdminMode ? 'bg-orange-600' : 'bg-[#9333EA]'}`} style={{ animationDelay: '2s' }}></div>

      {/* Secret Admin Toggle Button */}
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
            {isAdminMode ? "System Override" : isLogin ? "Holaa" : "Connect"}
          </h2>
          <p className="text-gray-300 mt-2 font-medium tracking-wide">
            {isAdminMode ? "Enter admin credentials." : isLogin ? "Continue from where you left" : "Create account."}
          </p>
        </div>

        {error && (
          <div className={`mb-4 p-3 border rounded-lg text-sm text-center font-medium backdrop-blur-sm ${error.includes("created!") ? "bg-green-500/20 border-green-500/50 text-green-200" : "bg-red-500/20 border-red-500/50 text-red-200"}`}>
            {error}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Inputs */}
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
              placeholder={isAdminMode ? "Admin Username" : "Email Address or Username"} 
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

        {/* Footer Toggle (Hidden in Admin Mode) */}
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