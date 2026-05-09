import React, { useEffect, useState, useRef } from "react";
import { supabase } from "./supabase"; 
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export default function Admin() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);

  const [pendingSocieties, setPendingSocieties] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);

  const [allRegistrations, setAllRegistrations] = useState([]);
  
  const [activeTab, setActiveTab] = useState("societies");

  const containerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => { 
    fetchAllData(); 
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    
    // Fetch Profiles (Pending society user accounts)
    const { data: profs, error: profsError } = await supabase
      .from("profiles")
      .select("*") 
      .eq("role", "society")
      .eq("status", "pending");
      
    if (profsError) console.error("Profiles Fetch Error:", profsError.message);

    // Fetch Events (Reverted to link to the 'societies' table)
    const { data: evs, error: evsError } = await supabase
      .from("events")
      .select("*, societies(name)") 
      .eq("status", "pending");

    if (evsError) console.error("Events Fetch Error:", evsError.message);

    // Fetch Registrations (Reverted to link to events -> societies)
    const { data: regs, error: regsError } = await supabase
      .from("registrations")
      .select(`
        *,
        events (
          title,
          societies ( name )
        )
      `)
      .order("created_at", { ascending: false });

    if (regsError) console.error("Registrations Fetch Error:", regsError.message);

    setPendingSocieties(profs || []);
    setPendingEvents(evs || []);
    setAllRegistrations(regs || []);
    
    setLoading(false);
  };

  // --- Actions ---
  const approveSociety = async (id) => {
    const { error } = await supabase.from("profiles").update({ status: "approved" }).eq("id", id);
    if (error) alert(error.message);
    else fetchAllData();
  };

  const rejectSociety = async (id) => {
    if (!window.confirm("Are you sure you want to delete this registration request?")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (!error) fetchAllData();
  };

  const handleEventAction = async (eventId, newStatus) => {
    const { error } = await supabase.from("events").update({ status: newStatus }).eq("id", eventId);
    if (error) alert(error.message);
    else fetchAllData();
  };

  const handleLogout = () => {
    localStorage.removeItem("nep_admin_bypass");
    supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  // --- GSAP Animations ---
  useGSAP(() => {
    if (!loading) {
      const tl = gsap.timeline();
      tl.fromTo(".admin-nav", { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" });
      tl.fromTo(".admin-tab", { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.4 }, "-=0.4");
    }
  }, { dependencies: [loading], scope: containerRef });

  useGSAP(() => {
    // FIX: Only animate if cards actually exist in the DOM
    if (!loading && gsap.utils.toArray(".admin-card").length > 0) {
      gsap.fromTo(
        ".admin-card",
        { y: 40, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.05, duration: 0.5, ease: "back.out(1.2)" }
      );
    }
  }, { dependencies: [activeTab, loading, pendingSocieties, pendingEvents], scope: contentRef });

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#2A0845] via-[#4A0E4E] to-[#600000]">
      <div className="text-[#FFD700] text-2xl font-bold animate-pulse tracking-widest uppercase">Initializing Admin Node...</div>
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen w-full bg-gradient-to-br from-[#2A0845] via-[#4A0E4E] to-[#600000] text-white relative overflow-hidden font-sans">
      
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-[#FFD700] rounded-full mix-blend-overlay filter blur-[150px] opacity-10 animate-pulse pointer-events-none"></div>
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#9333EA] rounded-full mix-blend-overlay filter blur-[150px] opacity-20 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <nav className="admin-nav relative z-20 bg-white/5 backdrop-blur-md border-b border-white/10 px-8 py-5 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-md text-white">Admin Panel</h1>
        </div>
        <button 
          onClick={handleLogout} 
          className="bg-red-500/20 text-red-300 border border-red-500/30 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-red-500/40 hover:text-white hover:scale-105 transition-all uppercase tracking-wider"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-7xl mx-auto p-8 relative z-10">
        
        <div className="flex gap-6 border-b border-white/10 mb-8 pb-4">
          <button 
            className={`admin-tab pb-2 px-2 font-bold text-lg transition-all duration-300 ${activeTab === 'societies' ? 'border-b-2 border-[#FFD700] text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : 'text-gray-400 hover:text-white'}`} 
            onClick={() => setActiveTab('societies')}
          >
            Pending Societies <span className="ml-2 bg-white/10 px-2 py-0.5 rounded-md text-sm">{pendingSocieties.length}</span>
          </button>
          <button 
            className={`admin-tab pb-2 px-2 font-bold text-lg transition-all duration-300 ${activeTab === 'events' ? 'border-b-2 border-[#FFD700] text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : 'text-gray-400 hover:text-white'}`} 
            onClick={() => setActiveTab('events')}
          >
            Pending Events <span className="ml-2 bg-white/10 px-2 py-0.5 rounded-md text-sm">{pendingEvents.length}</span>
          </button>
          <button 
            className={`admin-tab pb-2 px-2 font-bold text-lg transition-all duration-300 ${activeTab === 'registrations' ? 'border-b-2 border-[#FFD700] text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : 'text-gray-400 hover:text-white'}`} 
            onClick={() => setActiveTab('registrations')}
          >
            All Registrations
          </button>
        </div>

        <div ref={contentRef}>
          
          {activeTab === 'societies' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingSocieties.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
                  <div className="text-5xl mb-4 opacity-50">🛡️</div>
                  <p className="text-gray-300 text-lg font-medium">No pending society requests.</p>
                </div>
              )}
              {pendingSocieties.map(s => (
                <div key={s.id} className="admin-card bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col justify-between hover:bg-white/15 transition-all duration-300">
                  <div className="mb-6">
                    <h3 className="font-extrabold text-white text-xl mb-1">{s.full_name || s.fullname}</h3>
                    <p className="text-sm text-[#FFD700] font-mono bg-black/30 inline-block px-2 py-1 rounded-md mb-2">@{s.username}</p>
                    <p className="text-sm text-gray-300">{s.email}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => approveSociety(s.id)} className="flex-1 bg-[#FFD700] text-[#2A0845] py-2.5 rounded-xl font-bold hover:shadow-[0_0_15px_rgba(255,215,0,0.4)] hover:scale-105 transition-all text-sm uppercase tracking-wider">
                      Approve
                    </button>
                    <button onClick={() => rejectSociety(s.id)} className="flex-1 bg-red-500/20 text-red-300 py-2.5 rounded-xl font-bold hover:bg-red-500/40 hover:text-white transition-all text-sm uppercase tracking-wider border border-red-500/30">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingEvents.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
                  <div className="text-5xl mb-4 opacity-50">🗓️</div>
                  <p className="text-gray-300 text-lg font-medium">No pending event proposals.</p>
                </div>
              )}
              {pendingEvents.map((event) => (
                <div key={event.id} className="admin-card bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col justify-between hover:bg-white/15 transition-all duration-300">
                  <div className="mb-6">
                    <p className="text-xs font-black text-[#FFD700] mb-2 uppercase tracking-widest drop-shadow-md">
                      {event.societies?.name || "Unknown Society"}
                    </p>
                    <h3 className="font-extrabold text-xl text-white mb-2 leading-tight">{event.title}</h3>
                    <p className="text-sm text-gray-300 line-clamp-3 bg-black/20 p-3 rounded-lg border border-white/5">{event.description}</p>
                  </div>
                  <div className="flex gap-3 mt-auto">
                    <button onClick={() => handleEventAction(event.id, "approved")} className="flex-1 bg-[#FFD700] text-[#2A0845] py-2.5 rounded-xl font-bold hover:shadow-[0_0_15px_rgba(255,215,0,0.4)] hover:scale-105 transition-all text-sm uppercase tracking-wider">
                      Approve
                    </button>
                    <button onClick={() => handleEventAction(event.id, "rejected")} className="flex-1 bg-red-500/20 text-red-300 py-2.5 rounded-xl font-bold hover:bg-red-500/40 hover:text-white transition-all text-sm uppercase tracking-wider border border-red-500/30">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'registrations' && (
            <div className="admin-card bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
               <div className="p-6 border-b border-white/10 bg-white/5">
                  <h3 className="text-xl font-extrabold text-white">Global Event Registrations</h3>
                  <p className="text-sm text-gray-400 mt-1">Showing all student sign-ups across the platform.</p>
               </div>
               <div className="overflow-x-auto max-h-[60vh] custom-scrollbar">
                  <table className="w-full text-left text-sm text-gray-200 whitespace-nowrap">
                    <thead className="bg-black/60 text-gray-400 font-bold uppercase text-xs tracking-wider sticky top-0 backdrop-blur-md z-10">
                      <tr>
                        <th className="p-5">Student Name</th>
                        <th className="p-5">Roll No</th>
                        <th className="p-5">Dept</th>
                        <th className="p-5">Event</th>
                        <th className="p-5">Society</th>
                        <th className="p-5">Registered At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-5 font-bold text-white">{reg.full_name}</td>
                          <td className="p-5 font-mono text-[#FFD700]">{reg.roll_number}</td>
                          <td className="p-5"><span className="bg-white/10 px-3 py-1 rounded-lg text-xs font-bold">{reg.department}</span></td>
                          <td className="p-5 font-bold text-blue-300 truncate max-w-[200px]">{reg.events?.title || "Unknown"}</td>
                          <td className="p-5 text-gray-400 uppercase text-xs font-black tracking-widest">{reg.events?.societies?.name || "N/A"}</td>
                          <td className="p-5 font-mono text-xs text-gray-500">{new Date(reg.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {allRegistrations.length === 0 && (
                        <tr><td colSpan="6" className="p-10 text-center text-gray-400 italic font-medium">No registrations found in the database.</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}