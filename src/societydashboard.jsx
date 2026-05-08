import { useEffect, useState } from "react";
import { supabase } from "./supabase"; 
import { useNavigate } from "react-router-dom";

export default function SocietyDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [mySocietyName, setMySocietyName] = useState("");
  const [myEvents, setMyEvents] = useState([]); 
  const [allEvents, setAllEvents] = useState([]); 
  const [activeTab, setActiveTab] = useState("my-events");

  // Attendee Modal State
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState("");
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // --- NEW: Edit Modal State ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [editEventData, setEditEventData] = useState(null);

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

    // Fetch My Events
    const { data: myEventsData } = await supabase
      .from("events")
      .select(`*, registrations (count)`)
      .eq("society_id", profile.society_id)
      .order("created_at", { ascending: false });
    setMyEvents(myEventsData || []);

    // Fetch Feed
    const { data: feedData } = await supabase
      .from("events")
      .select(`*, societies(name)`) 
      .eq("status", "approved")
      .order("event_date", { ascending: true });
    setAllEvents(feedData || []);
    setLoading(false);
  };

  // --- ACTION: Delete Event ---
  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Are you sure? This will delete the event and all student registrations permanently.")) return;

    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) alert("Error deleting: " + error.message);
    else {
      // Remove from local state
      setMyEvents(myEvents.filter(e => e.id !== id));
      setAllEvents(allEvents.filter(e => e.id !== id));
    }
  };

  // --- ACTION: Open Edit Modal ---
  const handleEditClick = (event) => {
    setEditEventData(event);
    setIsEditMode(true);
  };

  // --- ACTION: Submit Edit ---
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
      alert("Event updated successfully!");
      setIsEditMode(false);
      setEditEventData(null);
      fetchSocietyData(); // Refresh data
    }
  };

  // --- ACTION: View Attendees ---
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

  if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Society Portal</h1>
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">{mySocietyName}</p>
        </div>
        <div className="flex gap-4">
            <button onClick={() => navigate("/create-event")} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-md">+ New Event</button>
            <button onClick={handleLogout} className="text-red-600 text-sm font-medium hover:underline">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex border-b border-gray-200 mb-6">
          <button className={`pb-3 px-4 font-medium text-sm transition ${activeTab === 'my-events' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('my-events')}>My Proposals & History</button>
          <button className={`pb-3 px-4 font-medium text-sm transition ${activeTab === 'feed' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('feed')}>Campus Feed</button>
        </div>

        {activeTab === 'my-events' && (
          <div>
            {myEvents.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-2">You haven't created any events yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myEvents.map((event) => {
                    const regCount = event.registrations ? event.registrations[0]?.count : 0;
                    return (
                        <div key={event.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-800 text-lg">{event.title}</h3>
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${event.status === 'approved' ? 'bg-green-100 text-green-700' : event.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{event.status}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">📅 {event.event_date}</p>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <div className="text-sm text-gray-600 font-medium">👤 <span className="text-black font-bold">{regCount}</span> Going</div>
                                <div className="flex gap-3">
                                   <button onClick={() => handleViewAttendees(event)} className="text-blue-600 text-xs font-bold hover:underline">View List</button>
                                   <button onClick={() => handleEditClick(event)} className="text-gray-600 text-xs font-bold hover:text-gray-900">Edit</button>
                                   <button onClick={() => handleDeleteEvent(event.id)} className="text-red-400 text-xs font-bold hover:text-red-600">Delete</button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {allEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow overflow-hidden opacity-90 hover:opacity-100 transition">
                <div className="h-40 bg-gray-200">
                    {event.poster_url ? <img src={event.poster_url} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-4xl">📅</div>}
                </div>
                <div className="p-4">
                    <p className="text-xs text-blue-600 font-bold mb-1">{event.societies?.name}</p>
                    <h3 className="font-bold text-gray-900">{event.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL 1: ATTENDEE LIST --- */}
      {selectedEventId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[80vh] flex flex-col">
                <div className="bg-gray-900 p-4 flex justify-between items-center text-white">
                    <div><h3 className="font-bold text-lg">Event Registrations</h3><p className="text-xs text-gray-400">{selectedEventTitle}</p></div>
                    <button onClick={closeModal} className="text-white hover:text-gray-300 text-xl font-bold">×</button>
                </div>
                <div className="p-0 overflow-auto flex-grow">
                    {loadingAttendees ? <div className="p-10 text-center">Loading...</div> : (
                        <table className="w-full text-left text-sm text-gray-600">
                           <thead className="bg-gray-100 text-gray-900 font-bold uppercase text-xs"><tr><th className="p-4 border-b">Full Name</th><th className="p-4 border-b">Roll No</th><th className="p-4 border-b">Dept</th><th className="p-4 border-b">Phone</th></tr></thead>
                           <tbody className="divide-y divide-gray-100">{attendees.map((att, i) => (<tr key={i}><td className="p-4 font-bold">{att.full_name}</td><td className="p-4 font-mono text-blue-600">{att.roll_number}</td><td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{att.department}</span></td><td className="p-4">{att.phone_number}</td></tr>))}</tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
      )}

      {isEditMode && editEventData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Edit Event</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">Title</label>
                <input className="w-full border rounded p-2" value={editEventData.title} onChange={e => setEditEventData({...editEventData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">Date</label>
                <input type="date" className="w-full border rounded p-2" value={editEventData.event_date} onChange={e => setEditEventData({...editEventData, event_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">Description</label>
                <textarea className="w-full border rounded p-2" rows="3" value={editEventData.description} onChange={e => setEditEventData({...editEventData, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">Poster URL</label>
                <input className="w-full border rounded p-2" value={editEventData.poster_url || ""} onChange={e => setEditEventData({...editEventData, poster_url: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditMode(false)} className="flex-1 py-2 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}