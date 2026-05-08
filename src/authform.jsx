import React, { useState, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const containerRef = useRef(null);
  const formRef = useRef(null);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(isLogin ? "Logging in..." : "Signing up...");
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[#2a0845] via-[#4A0E4E] to-[#600000] overflow-hidden relative"
    >
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FFD700] rounded-full mix-blend-overlay filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#9333EA] rounded-full mix-blend-overlay filter blur-[128px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="glass-card relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-3xl p-8 overflow-hidden">
        
        <div className="auth-header text-center mb-8">
          <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
            {isLogin ? "Holaa" : "Konnect"}
          </h2>
          <p className="text-gray-300 mt-2 font-light">
            {isLogin ? "Continue from where you left" : "Create account."}
          </p>``
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {!isLogin && (
            <div className="gsap-input">
              <input 
                type="text" 
                placeholder="Full Name" 
                required 
                className="w-full px-5 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all duration-300 backdrop-blur-sm" 
              />
            </div>
          )}

          <div className="gsap-input">
            <input 
              type={isLogin ? "text" : "email"} 
              placeholder={isLogin ? "Email or Username" : "Email Address"} 
              required 
              className="w-full px-5 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all duration-300 backdrop-blur-sm" 
            />
          </div>

          {!isLogin && (
            <div className="gsap-input">
              <input 
                type="text" 
                placeholder="Username" 
                required 
                className="w-full px-5 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all duration-300 backdrop-blur-sm" 
              />
            </div>
          )}

          <div className="gsap-input">
            <input 
              type="password" 
              placeholder="Password" 
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
                  required 
                  className="w-full px-5 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all duration-300 backdrop-blur-sm" 
                />
              </div>
              <div className="gsap-input">
                <select className="w-full px-5 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer">
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
            className="gsap-input mt-4 w-full py-3.5 rounded-xl bg-[#FFD700] text-[#2A0845] font-bold text-lg shadow-[0_0_15px_rgba(255,215,0,0.4)] hover:shadow-[0_0_25px_rgba(255,215,0,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 uppercase tracking-wider"
          >
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-8 text-center gsap-input border-t border-white/10 pt-6">
          <p className="text-gray-300">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
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