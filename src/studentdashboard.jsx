import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useNavigate } from "react-router-dom";

const lpsLogo = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/lps.png";
const senLogo = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/sen.png";
const nsaLogo = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/nsa.png";
const nasLogo = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/nas.png";
const mosaicLogo = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/mosaic.png";
const ndsLogo = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/nds.png";
const gscLogo = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/gsc.png";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState(new Set());
  const [allSocieties, setAllSocieties] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSociety, setSelectedSociety] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());


  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({ full_name: "", roll_number: "", phone_number: "", department: "" });
  const [showSocietyModal, setShowSocietyModal] = useState(false);
  const [expandedSocietyId, setExpandedSocietyId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let result = events;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(lowerQuery) ||
        e.description.toLowerCase().includes(lowerQuery)
      );
    }
    if (selectedSociety) result = result.filter(e => e.society_id === selectedSociety);
    if (selectedType) result = result.filter(e => e.event_type === selectedType);
    if (selectedDate) result = result.filter(e => e.event_date === selectedDate);
    setFilteredEvents(result);
  }, [events, searchQuery, selectedSociety, selectedType, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/"); return; }
    setUserId(user.id);

    const { data: eventsData } = await supabase
  .from("events")
  .select(`*, societies ( id, name, profiles ( fullname ) )`)
  .eq("status", "approved")
  .order('event_date', { ascending: true });

    setEvents(eventsData || []);
    setFilteredEvents(eventsData || []);

    const { data: regData } = await supabase
      .from("registrations")
      .select("event_id")
      .eq("student_id", user.id);
    if (regData) setMyRegistrations(new Set(regData.map(r => r.event_id)));

    const { data: socData } = await supabase.from("societies").select("id, name, profiles(fullname, username)").order("name");
    setAllSocieties(socData || []);
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

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const renderCalendar = () => {
    const { days, firstDay } = getDaysInMonth(currentMonth);
    const daysArray = [];
    for (let i = 0; i < firstDay; i++) daysArray.push(<div key={`empty-${i}`} className="h-9"></div>);
    for (let d = 1; d <= days; d++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const hasEvent = events.some(e => e.event_date === dateStr);
      daysArray.push(
        <button
          key={d}
          onClick={() => setSelectedDate(isSelected ? null : dateStr)}
          className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all relative
            ${isSelected ? "bg-[#FFD700] text-[#2a0845] scale-110 shadow-lg" : "hover:bg-white/10 text-gray-300"}
            ${hasEvent && !isSelected ? "text-[#FFD700] border border-[#FFD700]/30" : ""}
          `}
        >
          {d}
          {hasEvent && !isSelected && <span className="absolute bottom-1 w-1 h-1 bg-[#FFD700] rounded-full"></span>}
        </button>
      );
    }
    return daysArray;
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/login", { replace: true }); };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("registrations").insert([{ event_id: selectedEvent.id, student_id: userId, ...formData }]);
    if (error) alert(error.message);
    else {
      setMyRegistrations(new Set([...myRegistrations, selectedEvent.id]));
      setShowModal(false);
    }
  };

  const handleCancelRegistration = async (eventId) => {
    if (!window.confirm("Cancel registration?")) return;
    const { error } = await supabase.from("registrations").delete().match({ event_id: eventId, student_id: userId });
    if (!error) {
      const newSet = new Set(myRegistrations);
      newSet.delete(eventId);
      setMyRegistrations(newSet);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#2a0845] space-y-4">
      <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[#FFD700] font-medium tracking-widest animate-pulse">LOADING NEDCONNECT</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a052d] text-white selection:bg-[#FFD700] selection:text-[#2a0845]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#600000]/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#4A0E4E]/40 blur-[120px] rounded-full"></div>
      </div>
      
      <nav className="sticky top-0 z-50 bg-[#2a0845]/80 backdrop-blur-md border-b border-white/10 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            NEDConnect
          </h1>
        </div>
        <button onClick={handleLogout} className="px-5 py-2 rounded-full border border-white/10 text-sm font-bold hover:bg-white/5 transition-all active:scale-95">
          Logout
        </button>
      </nav>

      <main className="relative w-full mx-auto p-6 lg:p-5 flex flex-col lg:row-start-1 lg:flex-row gap-10">
      
        <div className="lg:flex-1 space-y-8">
                
          <section className="bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex flex-wrap gap-2 shadow-2xl">
            <input 
              type="text" 
              placeholder="Search events..." 
              className="flex-grow bg-white/5 border border-white/5 rounded-xl px-4 py-3 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select 
              className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
              value={selectedSociety}
              onChange={(e) => setSelectedSociety(e.target.value)}
            >
              <option value="" className="bg-[#2a0845]">All Societies</option>
              {allSocieties.map(s => <option key={s.id} value={s.id} className="bg-[#2a0845]">{s.name}</option>)}
            </select>
            
          </section>
          
          <div className="flex justify-between items-end">
            <h2 className="text-3xl font-black text-white">
              {selectedDate ? " Events on Selected Date" : "Discover Events"}
            </h2>
            {selectedDate && <button onClick={() => setSelectedDate(null)} className="text-[#FFD700] text-sm font-bold underline underline-offset-4">Clear Filter</button>}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-dashed border-white/20">
              <p className="text-gray-400">No events match your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvents.map((event) => {
  const isRegistered = myRegistrations.has(event.id);
  const socLogo = getSocLogo(event.societies?.name);
  
  return (
    <div key={event.id} className="group bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden hover:border-[#FFD700]/50 transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex flex-col">
      <div className="h-52 overflow-hidden relative bg-gradient-to-br from-purple-900/50 via-purple-800/30 to-blue-900/50">
        
        {/* Society Logo - Always visible in background */}
        {socLogo && (
          <div className="absolute inset-0 flex items-center justify-center transition-all duration-700 group-hover:opacity-0 group-hover:scale-150">
            <img 
              src={socLogo} 
              className="w-24 h-24 object-contain opacity-90"
              alt="society logo"
            />
          </div>
        )}
        
        {/* Hover Photo - Shows on hover using event.video */}
        {event.video && (
          <img 
            src={event.video}
            className="absolute inset-0 w-full h-full object-cover opacity-0 scale-110 group-hover:opacity-100 group-hover:scale-100 transition-all duration-700"
            alt="event photo"
          />
        )}
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a052d] via-transparent to-transparent opacity-80 pointer-events-none group-hover:opacity-60 transition-opacity duration-700"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 pointer-events-none group-hover:opacity-0 transition-opacity duration-700"></div>
        
        {/* Event Type Badge */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <span className="bg-[#FFD700] text-[#2a0845] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg">
            {event.event_type}
          </span>
        </div>

        {/* Society Name & Date - Bottom Left */}
        <div className="absolute bottom-4 left-4 z-10">
          <p className="text-white text-xs font-black uppercase tracking-wider mb-1 drop-shadow-lg">
            {event.societies?.name}
          </p>
          <h3 className="text-white text-2xl font-black leading-tight drop-shadow-lg">
            {event.title}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <svg className="w-3 h-3 text-gray-300 drop-shadow" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <p className="text-gray-300 text-xs font-medium drop-shadow">
              {new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        <p className="text-gray-400 text-sm line-clamp-3 mb-6 flex-grow">
          {event.description}
        </p>
        
        {isRegistered ? (
          <button 
            onClick={() => handleCancelRegistration(event.id)} 
            className="w-full py-3 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 font-bold text-sm hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            ✓ REGISTERED
          </button>
        ) : (
          <button 
            onClick={() => { setSelectedEvent(event); setShowModal(true); }} 
            className="w-full py-3 rounded-xl bg-white text-[#2a0845] font-black text-sm hover:bg-[#FFD700] transition-all transform active:scale-95 shadow-lg shadow-white/5"
          >
            REGISTER NOW
          </button>
        )}
      </div>
    </div>
  );
})}
            </div>
          )}
        </div>

        {/* Right Section: Sidebar */}
        <div className="lg:w-80 space-y-6">
          
          {/* Calendar Widget */}
          <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-sm tracking-widest text-gray-400 uppercase">Calendar</h3>
              <div className="flex gap-1">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded-lg">‹</button>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded-lg">›</button>
              </div>
            </div>
            <p className="text-center font-bold mb-4">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[10px] font-black text-gray-500">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div className="bg-gradient-to-br from-[#FFD700]/20 to-transparent backdrop-blur-xl rounded-[2rem] border border-[#FFD700]/20 p-6 shadow-2xl">
            <h3 className="font-black text-sm tracking-widest text-[#FFD700] uppercase mb-6">My Schedule</h3>
            <div className="space-y-4">
              {events.filter(e => myRegistrations.has(e.id)).slice(0, 3).map(e => (
                <div key={e.id} className="group cursor-default">
                  <p className="text-xs font-bold text-white/90 group-hover:text-[#FFD700] transition-colors">{e.title}</p>
                  <p className="text-[10px] text-gray-400">{e.event_date}</p>
                </div>
              ))}
              {myRegistrations.size === 0 && <p className="text-xs text-gray-500 italic">No registrations yet.</p>}
            </div>
          </div>

          <button onClick={() => setShowSocietyModal(true)} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3">
             🏢 Browse Societies
          </button>
        </div>
      </main>

      {/* Registration Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-[#1a052d]/90 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="bg-[#2a0845] border border-white/20 rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl">
            <h3 className="text-2xl font-black mb-2 text-white">Join the event</h3>
            <p className="text-gray-400 text-sm mb-8">Registering for: <span className="text-[#FFD700]">{selectedEvent.title}</span></p>
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <input placeholder="Your Full Name" required className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[#FFD700] outline-none transition-all" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Roll Number" required className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[#FFD700] outline-none transition-all" value={formData.roll_number} onChange={e => setFormData({...formData, roll_number: e.target.value})} />
                <input placeholder="Phone No." required className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[#FFD700] outline-none transition-all" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
              </div>
              <select className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[#FFD700] outline-none transition-all appearance-none" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required>
                <option value="" className="bg-[#2a0845]">Select Department</option>
                {["CS", "SE", "EE", "ME", "BCIT"].map(d => <option key={d} value={d} className="bg-[#2a0845]">{d}</option>)}
              </select>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="flex-[2] py-4 rounded-2xl bg-[#FFD700] text-[#2a0845] font-black hover:scale-105 transition-all shadow-xl shadow-[#FFD700]/10">SUBMIT APPLICATION</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}