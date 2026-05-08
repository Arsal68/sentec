import React, { useEffect, useState, useRef } from "react";
import { supabase } from "./supabase"; 
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

const lpsLogo = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/lps.png";
const senLogo = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/sen.png";
const nsaLogo = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/nsa.png";
const nasLogo = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/nas.png";
const mosaicLogo = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/mosaic.png";
const ndsLogo = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/nds.png";
const gscLogo = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/gsc.png";

export default function SocietyDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [mySocietyName, setMySocietyName] = useState("");
  const [myEvents, setMyEvents] = useState([]); 
  const [allEvents, setAllEvents] = useState([]); 
  const [activeTab, setActiveTab] = useState("my-events");

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState("");
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editEventData, setEditEventData] = useState(null);

  const containerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    fetchSocietyData();
  }, []);

  const fetchSocietyData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/");

    const { data: profile } = await supabase.from("profiles").select("society_id, societies(name)").eq("id", user.id).single();
    if (!profile?.society_id) return navigate("/");

    setMySocietyName(profile.societies?.name);

    const { data: myEventsData } = await supabase
      .from("events")
      .select(`*, registrations (count)`)
      .eq("society_id", profile.society_id)
      .order("created_at", { ascending: false });
    setMyEvents(myEventsData || []);

    const { data: feedData } = await supabase
      .from("events")
      .select(`*, societies(name)`) 
      .eq("status", "approved")
      .order("event_date", { ascending: true });
    setAllEvents(feedData || []);
    setLoading(false);
  };

  const getSocLogo = (name) => {
    const n = name?.toLowerCase() || "";
    if (n.includes("lps") || n.includes("literary")) return lpsLogo;
    if (n.includes("nas") || n.includes("adventure")) return nasLogo;
    if (n.includes("nsa") || n.includes("student association")) return nsaLogo;
    if (n.includes("mosaic")) return mosaicLogo;
    if (n.includes("nds") || n.includes("debating")) return ndsLogo;
    if (n.includes("gsc") || n.includes("green")) return gscLogo;
    if (n.includes("sen") || n.includes("science")) return senLogo;
    return null;
  };

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(".nav-bar", { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" });
    tl.fromTo(".tab-btn", { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.4 }, "-=0.4");
  }, { scope: containerRef });

  useGSAP(() => {
    if (!loading) {
      gsap.fromTo(
        ".event-card",
        { y: 40, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 0.6, ease: "back.out(1.2)" }
      );
    }
  }, { dependencies: [activeTab, loading, myEvents, allEvents], scope: contentRef });

  // --- Actions ---
  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Are you sure? This will delete the event and all student registrations permanently.")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) alert("Error deleting: " + error.message);
    else {
      setMyEvents(myEvents.filter(e => e.id !== id));
      setAllEvents(allEvents.filter(e => e.id !== id));
    }
  };

  const handleEditClick = (event) => {
    setEditEventData(event);
    setIsEditMode(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from("events")
      .update({
        title: editEventData.title,
        description: editEventData.description,
        event_date: editEventData.event_date,
        poster_url: editEventData.poster_url
      })
      .eq("id", editEventData.id);

    if (error) alert("Update failed: " + error.message);
    else {
      setIsEditMode(false);
      setEditEventData(null);
      fetchSocietyData(); 
    }
  };

  const handleViewAttendees = async (event) => {
    setSelectedEventId(event.id);
    setSelectedEventTitle(event.title);
    setLoadingAttendees(true);
    setAttendees([]);

    const { data } = await supabase
      .from("registrations")
      .select("full_name, roll_number, phone_number, department, created_at")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });

    setAttendees(data || []);
    setLoadingAttendees(false);
  };

  const closeModal = () => { setSelectedEventId(null); setAttendees([]); };
  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/login", { replace: true }); };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#2A0845] via-[#4A0E4E] to-[#600000]">
      <div className="text-[#FFD700] text-2xl font-bold animate-pulse tracking-widest">LOADING PORTAL...</div>
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen w-full bg-gradient-to-br from-[#2A0845] via-[#4A0E4E] to-[#600000] text-white relative overflow-hidden font-sans">
      
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-[#FFD700] rounded-full mix-blend-overlay filter blur-[150px] opacity-10 animate-pulse pointer-events-none"></div>
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#9333EA] rounded-full mix-blend-overlay filter blur-[150px] opacity-20 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <nav className="nav-bar relative z-20 bg-white/5 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight drop-shadow-md text-white">Society Portal</h1>
          <p className="text-sm text-[#FFD700] font-bold uppercase tracking-widest mt-0.5">{mySocietyName}</p>
        </div>
        <div className="flex gap-4 items-center">
            <button onClick={() => navigate("/create-event")} className="bg-[#FFD700] text-[#2A0845] px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:shadow-[0_0_25px_rgba(255,215,0,0.6)] hover:scale-105 transition-all uppercase tracking-wider">
              + New Event
            </button>
            <button onClick={handleLogout} className="text-gray-300 hover:text-[#FFD700] text-sm font-bold transition-colors uppercase tracking-wider">
              Logout
            </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        
        <div className="flex gap-4 border-b border-white/10 mb-8 pb-4">
          <button 
            className={`tab-btn pb-2 px-4 font-bold text-lg transition-all duration-300 ${activeTab === 'my-events' ? 'border-b-2 border-[#FFD700] text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : 'text-gray-400 hover:text-white'}`} 
            onClick={() => setActiveTab('my-events')}
          >
            Approved Events
          </button>
          <button 
            className={`tab-btn pb-2 px-4 font-bold text-lg transition-all duration-300 ${activeTab === 'feed' ? 'border-b-2 border-[#FFD700] text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : 'text-gray-400 hover:text-white'}`} 
            onClick={() => setActiveTab('feed')}
          >
            Campus Feed
          </button>
        </div>

        <div ref={contentRef}>
          {activeTab === 'my-events' && (
            <div>
              {myEvents.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
                      <div className="text-6xl mb-4 opacity-50">📝</div>
                      <p className="text-gray-300 text-lg">You haven't created any events yet.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myEvents.map((event) => {
                      const regCount = event.registrations ? event.registrations[0]?.count : 0;
                      
                      const statusStyles = {
                        approved: "bg-green-500/20 text-green-300 border border-green-500/30",
                        pending: "bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30",
                        rejected: "bg-red-500/20 text-red-300 border border-red-500/30"
                      };

                      return (
                          <div key={event.id} className="event-card bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col justify-between hover:bg-white/15 transition-all duration-300">
                              <div>
                                  <div className="flex justify-between items-start mb-3">
                                      <h3 className="font-extrabold text-white text-xl leading-tight drop-shadow-md">{event.title}</h3>
                                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${statusStyles[event.status] || statusStyles.pending}`}>
                                        {event.status}
                                      </span>
                                  </div>
                                  <p className="text-sm text-gray-300 mb-6 font-medium bg-black/20 inline-block px-3 py-1 rounded-lg"> {event.event_date}</p>
                              </div>

                              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                  <div className="text-sm text-gray-300 font-medium bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                                    👤 <span className="text-[#FFD700] font-bold">{regCount}</span> Going
                                  </div>
                                  <div className="flex gap-2">
                                     <button onClick={() => handleViewAttendees(event)} className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/40 transition tooltip" title="View List">📋</button>
                                     <button onClick={() => handleEditClick(event)} className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition tooltip" title="Edit">✏️</button>
                                     <button onClick={() => handleDeleteEvent(event.id)} className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/40 transition tooltip" title="Delete">🗑️</button>
                                  </div>
                              </div>
                          </div>
                      );
                  })}
                  </div>
              )}
            </div>
          )}

          {activeTab === 'feed' && (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8 pb-10">
               {allEvents.map((event) => {
                  const socLogo = getSocLogo(event.societies?.name);
                  const displayImage = event.poster_url || socLogo;

                  return (
                  <div key={event.id} className="event-card break-inside-avoid relative group rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 bg-black/60 transition-all duration-500 hover:border-[#FFD700]/50 hover:shadow-[0_0_40px_rgba(255,215,0,0.2)] hover:-translate-y-2 cursor-pointer">
                    
                    <div className="relative w-full h-80 overflow-hidden bg-gradient-to-tr from-[#2A0845] to-[#1a052e] flex items-center justify-center">
                      
                      {displayImage && (
                        <img 
                          src={displayImage} 
                          alt={event.title} 
                          className={`w-full h-full object-cover transform transition-all duration-700 group-hover:scale-110 group-hover:rotate-1 ${!event.poster_url ? 'opacity-30 blur-md scale-125' : ''}`} 
                        />
                      )}

                      {!event.poster_url && socLogo && (
                         <img 
                            src={socLogo} 
                            alt={`${event.societies?.name} Logo`} 
                            className="absolute w-36 h-36 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] transform transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3" 
                         />
                      )}
                    </div>
                    
                    {/*glass effectss*/}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-24 translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
                        <p className="text-xs text-[#FFD700] font-black uppercase tracking-widest mb-2 drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]">
                          {event.societies?.name}
                        </p>
                        <h3 className="font-extrabold text-white text-2xl leading-tight mb-4 drop-shadow-lg group-hover:text-[#FFD700] transition-colors duration-300">
                          {event.title}
                        </h3>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-300 font-medium">
                          <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
                            🗓️ {event.event_date}
                          </span>
                        
                        </div>
                    </div>

                  </div>
               )})}
            </div>
          )}
        </div>
      </div>

      {selectedEventId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#2A0845]/95 border border-white/20 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[80vh] flex flex-col transform transition-all">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <div>
                      <h3 className="font-extrabold text-2xl text-white">Registrations</h3>
                      <p className="text-sm text-[#FFD700] mt-1 font-medium">{selectedEventTitle}</p>
                    </div>
                    <button onClick={closeModal} className="w-10 h-10 bg-white/10 hover:bg-[#FFD700] hover:text-black rounded-full flex items-center justify-center text-white transition-colors font-bold">✕</button>
                </div>
                <div className="p-0 overflow-auto flex-grow custom-scrollbar">
                    {loadingAttendees ? <div className="p-10 text-center text-[#FFD700] animate-pulse">Fetching records...</div> : (
                        <table className="w-full text-left text-sm text-gray-200">
                           <thead className="bg-black/30 text-gray-400 font-bold uppercase text-xs tracking-wider sticky top-0 backdrop-blur-md">
                             <tr><th className="p-5">Full Name</th><th className="p-5">Roll No</th><th className="p-5">Dept</th><th className="p-5">Phone</th></tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                             {attendees.map((att, i) => (
                               <tr key={i} className="hover:bg-white/5 transition-colors">
                                 <td className="p-5 font-bold text-white">{att.full_name}</td>
                                 <td className="p-5 font-mono text-[#FFD700]">{att.roll_number}</td>
                                 <td className="p-5"><span className="bg-white/10 px-3 py-1 rounded-lg text-xs font-bold">{att.department}</span></td>
                                 <td className="p-5 font-mono text-gray-400">{att.phone_number}</td>
                               </tr>
                             ))}
                             {attendees.length === 0 && (
                               <tr><td colSpan="4" className="p-10 text-center text-gray-400 italic">No registrations yet.</td></tr>
                             )}
                           </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
      )}

      {isEditMode && editEventData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A0845]/95 border border-white/20 rounded-3xl shadow-2xl w-full max-w-lg p-8">
            <h2 className="text-3xl font-extrabold text-white mb-6">Edit Event</h2>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Title</label>
                <input className="w-full bg-black/30 border border-white/10 rounded-xl p-3.5 text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition" value={editEventData.title} onChange={e => setEditEventData({...editEventData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Date</label>
                <input type="date" className="w-full bg-black/30 border border-white/10 rounded-xl p-3.5 text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition [color-scheme:dark]" value={editEventData.event_date} onChange={e => setEditEventData({...editEventData, event_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Description</label>
                <textarea className="w-full bg-black/30 border border-white/10 rounded-xl p-3.5 text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition resize-none" rows="3" value={editEventData.description} onChange={e => setEditEventData({...editEventData, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Poster URL</label>
                <input className="w-full bg-black/30 border border-white/10 rounded-xl p-3.5 text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition" value={editEventData.poster_url || ""} onChange={e => setEditEventData({...editEventData, poster_url: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsEditMode(false)} className="flex-1 py-3.5 text-white font-bold bg-white/10 hover:bg-white/20 rounded-xl transition uppercase tracking-wider">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 bg-[#FFD700] text-[#2A0845] font-bold rounded-xl hover:shadow-[0_0_20px_rgba(255,215,0,0.5)] hover:scale-[1.02] transition uppercase tracking-wider">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}