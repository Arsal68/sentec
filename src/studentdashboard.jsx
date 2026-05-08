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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let result = events;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(lowerQuery) || 
        e.description.toLowerCase().includes(lowerQuery)
      );
    }
    if (selectedSociety) {
      result = result.filter(e => e.society_id === selectedSociety);
    }
    if (selectedType) {
      result = result.filter(e => e.event_type === selectedType);
    }
    if (selectedDate) {
      result = result.filter(e => e.event_date === selectedDate);
    }
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
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(<div key={`empty-${i}`} className="h-8"></div>);
    }
    for (let d = 1; d <= days; d++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const hasEvent = events.some(e => e.event_date === dateStr);
      daysArray.push(
        <button 
          key={d} 
          onClick={() => setSelectedDate(isSelected ? null : dateStr)}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition relative
            ${isSelected ? "bg-blue-600 text-white shadow-md" : "hover:bg-blue-50 text-gray-700"}
            ${hasEvent && !isSelected ? "font-bold text-blue-600" : ""}
          `}
        >
          {d}
          {hasEvent && !isSelected && <span className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full"></span>}
        </button>
      );
    }
    return daysArray;
  };

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/login", { replace: true }); };
  
  const openRegistrationForm = (event) => {
    setSelectedEvent(event);
    setFormData({ ...formData, full_name: "", roll_number: "", phone_number: "", department: "" }); 
    setShowModal(true);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    const { error } = await supabase.from("registrations").insert([{
      event_id: selectedEvent.id, student_id: userId, ...formData
    }]);
    if (error) alert("Failed: " + error.message);
    else {
      alert("✅ Registered!");
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

  const myUpcomingEvents = events.filter(e => myRegistrations.has(e.id));

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-extrabold text-blue-700 tracking-tight">NEDConnect</h1>
        <button onClick={handleLogout} className="text-sm font-medium text-gray-600 hover:text-red-600">Logout</button>
      </nav>

      <div className="max-w-7xl mx-auto p-6 flex flex-col lg:flex-row gap-8">
        <div className="lg:w-3/4">
           <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                 <input 
                   type="text" 
                   placeholder="🔍 Search events..." 
                   className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              <select 
                className="border rounded-lg px-3 py-2 text-sm bg-white"
                value={selectedSociety}
                onChange={(e) => setSelectedSociety(e.target.value)}
              >
                <option value="">All Societies</option>
                {allSocieties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select 
                className="border rounded-lg px-3 py-2 text-sm bg-white"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="General">General</option>
                <option value="Sports">Sports</option>
                <option value="Tech">Tech</option>
                <option value="Seminar">Seminar</option>
                <option value="Arts">Arts</option>
                <option value="Social">Social</option>
              </select>
           </div>

           <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
             <span>{selectedDate ? `Events on ${selectedDate}` : "Upcoming Events"}</span>
             {selectedDate && <button onClick={() => setSelectedDate(null)} className="text-xs text-red-500 hover:underline">Clear Date</button>}
           </h2>

           {filteredEvents.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                <p className="text-gray-400">No events found matching your filters.</p>
                <button onClick={() => { setSearchQuery(""); setSelectedSociety(""); setSelectedType(""); setSelectedDate(null); }} className="text-blue-600 text-sm font-bold mt-2">Clear Filters</button>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredEvents.map((event) => {
                  const isRegistered = myRegistrations.has(event.id);
                  const societyName = event.societies?.name || "Unknown";
                  const accountName = event.societies?.profiles?.[0]?.fullname || "Admin";
                  const socLogo = getSocLogo(societyName);

                  return (
                    <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
                      <div className="h-48 bg-gray-50 relative group p-4 flex items-center justify-center">
                          {event.poster_url ? (
                            <img src={event.poster_url} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt="poster"/>
                          ) : socLogo ? (
                            <img src={socLogo} className="h-32 w-32 object-contain" alt="logo" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-3xl">📅</div>
                          )}
                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg text-xs shadow-sm">
                            <span className="block font-extrabold text-gray-900">{accountName}</span>
                            <span className="block text-gray-500 font-medium">{societyName}</span>
                          </div>
                          {event.event_type && (
                             <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wider shadow">
                               {event.event_type}
                             </div>
                          )}
                      </div>
                      <div className="p-5 flex-grow">
                          <div className="flex justify-between items-start mb-2">
                             <h3 className="font-bold text-lg text-gray-900 leading-tight">{event.title}</h3>
                             <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded whitespace-nowrap">{event.event_date}</span>
                          </div>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                          {isRegistered ? (
                            <button onClick={() => handleCancelRegistration(event.id)} className="w-full py-2 rounded-lg bg-green-100 text-green-700 border border-green-200 font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition">✅ Registered</button>
                          ) : (
                            <button onClick={() => openRegistrationForm(event)} className="w-full py-2 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition shadow-md">Register Now</button>
                          )}
                      </div>
                    </div>
                  );
                })}
             </div>
           )}
        </div>

        <div className="lg:w-1/4 space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🗓️ My Schedule</h2>
            {myUpcomingEvents.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Nothing yet.</p>
            ) : (
              <div className="space-y-4">
                {myUpcomingEvents.slice(0, 3).map(event => (
                  <div key={event.id} className="border-l-4 border-blue-500 pl-3 py-1">
                    <p className="font-bold text-sm text-gray-900 truncate">{event.title}</p>
                    <p className="text-xs text-gray-500">{event.event_date}</p>
                  </div>
                ))}
                {myUpcomingEvents.length > 3 && <p className="text-xs text-blue-600 text-center font-bold">View all...</p>}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5">
             <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="text-gray-400 hover:text-gray-800 font-bold text-lg">‹</button>
                <span className="font-bold text-gray-800">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                <button onClick={() => changeMonth(1)} className="text-gray-400 hover:text-gray-800 font-bold text-lg">›</button>
             </div>
             <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-xs font-bold text-gray-400">{d}</span>)}
             </div>
             <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
             </div>
             <p className="text-xs text-center text-gray-400 mt-3">Click a date to filter events</p>
          </div>

          <button onClick={() => setShowSocietyModal(true)} className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm">
             🏢 Browse Societies
          </button>
        </div>
      </div>

      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Register for {selectedEvent.title}</h3>
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <input placeholder="Full Name" required className="w-full border rounded p-2" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Roll No" required className="border rounded p-2" value={formData.roll_number} onChange={e => setFormData({...formData, roll_number: e.target.value})} />
                  <input placeholder="Phone" required className="border rounded p-2" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                </div>
                <select className="w-full border rounded p-2" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required>
                   <option value="">Select Dept...</option>
                   <option value="CS">CS</option><option value="SE">SE</option><option value="EE">EE</option><option value="ME">ME</option>
                </select>
                <div className="flex gap-2"><button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 py-2 rounded">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">Submit</button></div>
            </form>
          </div>
        </div>
      )}

      {showSocietyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden">
               <div className="bg-gray-900 p-4 flex justify-between items-center text-white"><h3 className="font-bold">Registered Societies</h3><button onClick={() => setShowSocietyModal(false)}>×</button></div>
               <div className="p-4 overflow-y-auto flex-grow space-y-2">
                  {allSocieties.map(soc => (
                     <div key={soc.id} className="border rounded-lg overflow-hidden">
                        <button onClick={() => setExpandedSocietyId(expandedSocietyId === soc.id ? null : soc.id)} className="w-full p-3 flex justify-between items-center hover:bg-gray-50 bg-white font-bold text-sm text-left">
                            {soc.name} <span>{expandedSocietyId === soc.id ? '▲' : '▼'}</span>
                        </button>
                        {expandedSocietyId === soc.id && (
                            <div className="bg-gray-50 p-3 text-xs space-y-1 border-t">
                               {soc.profiles?.map((u, i) => <div key={i}>👤 {u.fullname} <span className="text-gray-400">(@{u.username})</span></div>)}
                            </div>
                        )}
                     </div>
                  ))}
               </div>
           </div>
        </div>
      )}
    </div>
  );
}