import { useState, useEffect } from "react";
import { supabase } from "./supabase"; 
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function CreateEvent() {
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [societyId, setSocietyId] = useState(null);
  const [societyName, setSocietyName] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchUserSociety = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select(`
          society_id,
          societies ( name )
        `)
        .eq("id", user.id)
        .single();

      if (error || !profile?.society_id) {
        setMessage({ type: "error", text: "You are not linked to any Society account." });
      } else {
        setSocietyId(profile.society_id);
        setSocietyName(profile.societies?.name || "Unknown Society");
      }
      setLoading(false);
    };

    fetchUserSociety();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      if (!societyId) throw new Error("Unauthorized: No Society ID found.");

      const { error: insertError } = await supabase
        .from("events")
        .insert([
          {
            title,
            description,
            event_date: eventDate,
            start_time: startTime,
            end_time: endTime,
            society_id: societyId,
            status: "pending"
          },
        ]);

      if (insertError) throw insertError;

      setMessage({ type: "success", text: "Event submitted! Redirecting to dashboard..." });
      
      setTimeout(() => navigate("/society-dashboard"), 2000);

    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-sans text-gray-500">Checking Society Permissions...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100">
        
        <button 
          onClick={() => navigate("/society-dashboard")}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-6 font-bold text-sm group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <h2 className="text-3xl font-black text-gray-900 mb-2">Create New Event</h2>
        
        <div className="mb-8 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            Posting as: {societyName}
          </span>
        </div>

        {message.text && (
          <div className={`p-4 mb-6 rounded-xl font-semibold text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-2 ml-1">Event Title</label>
            <input 
              className="w-full border border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50/50" 
              placeholder="e.g. Annual Tech Symposium" 
              value={title} onChange={(e) => setTitle(e.target.value)} required 
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-2 ml-1">Description</label>
            <textarea 
              rows="4"
              className="w-full border border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50/50" 
              placeholder="Provide detailed information about the event..." 
              value={description} onChange={(e) => setDescription(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-2 ml-1">Date</label>
              <input type="date" className="w-full border border-gray-200 p-4 rounded-xl bg-gray-50/50 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-2 ml-1">Start Time</label>
              <input type="time" className="w-full border border-gray-200 p-4 rounded-xl bg-gray-50/50 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-2 ml-1">End Time</label>
              <input type="time" className="w-full border border-gray-200 p-4 rounded-xl bg-gray-50/50 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={submitting || !societyId} 
              className={`w-full text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 uppercase tracking-widest
                ${submitting ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"}`}
            >
              {submitting ? "Processing..." : "Submit Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}