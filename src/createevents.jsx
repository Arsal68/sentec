import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase"; 
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export default function CreateEvent() {
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [posterUrl, setPosterUrl] = useState(""); 

  const [societyId, setSocietyId] = useState(null);
  const [societyName, setSocietyName] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const containerRef = useRef(null);

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

  useGSAP(() => {
    if (loading) return; 

    const tl = gsap.timeline();

    tl.fromTo(".glass-card", 
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1, ease: "power4.out" }
    );

    tl.fromTo(".gsap-item", 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: "power3.out" },
      "-=0.5"
    );
  }, { dependencies: [loading], scope: containerRef });

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
            poster_url: posterUrl, 
            society_id: societyId,
            status: "pending"
          },
        ]);

      if (insertError) throw insertError;

      setMessage({ type: "success", text: "Event submitted successfully! Redirecting..." });
      
      setTimeout(() => navigate("/society-dashboard"), 2000);

    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#2A0845] via-[#4A0E4E] to-[#600000]">
      <div className="text-[#FFD700] text-2xl font-bold animate-pulse tracking-widest">VERIFYING PERMISSIONS...</div>
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen w-full bg-gradient-to-br from-[#2A0845] via-[#4A0E4E] to-[#600000] text-white flex items-center justify-center py-10 px-4 font-sans relative overflow-hidden">
      
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-[#FFD700] rounded-full mix-blend-overlay filter blur-[150px] opacity-10 animate-pulse pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[#9333EA] rounded-full mix-blend-overlay filter blur-[150px] opacity-20 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="glass-card relative z-10 bg-white/10 backdrop-blur-2xl p-8 md:p-10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] w-full max-w-2xl border border-white/20">
        
        <button 
          onClick={() => navigate("/society-dashboard")}
          className="gsap-item flex items-center gap-2 text-gray-400 hover:text-[#FFD700] transition-colors mb-6 font-bold text-sm uppercase tracking-wider group w-fit"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="gsap-item mb-8">
            <h2 className="text-4xl font-extrabold text-white mb-3 drop-shadow-md">Create New Event</h2>
            <span className="inline-block bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm">
              Posting as: {societyName}
            </span>
        </div>

        {message.text && (
          <div className={`gsap-item p-4 mb-6 rounded-xl font-bold text-sm backdrop-blur-sm border ${message.type === 'error' ? 'bg-red-500/20 text-red-300 border-red-500/50' : 'bg-green-500/20 text-green-300 border-green-500/50'}`}>
            {message.type === 'error' ? '⚠️ ' : '✅ '}{message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="gsap-item">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-300 mb-2 ml-1">Event Title</label>
            <input 
              className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all" 
              placeholder="e.g. Annual Tech Symposium" 
              value={title} onChange={(e) => setTitle(e.target.value)} required 
            />
          </div>

          <div className="gsap-item">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-300 mb-2 ml-1">Description</label>
            <textarea 
              rows="4"
              className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all resize-none custom-scrollbar" 
              placeholder="Provide detailed information about the event..." 
              value={description} onChange={(e) => setDescription(e.target.value)} 
            />
          </div>

          <div className="gsap-item">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-300 mb-2 ml-1">Poster Image URL (Optional)</label>
            <input 
              className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all" 
              placeholder="https://example.com/image.png" 
              value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} 
            />
          </div>

          <div className="gsap-item grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-300 mb-2 ml-1">Date</label>
              <input type="date" className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all [color-scheme:dark]" 
                value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-300 mb-2 ml-1">Start Time</label>
              <input type="time" className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all [color-scheme:dark]" 
                value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-300 mb-2 ml-1">End Time</label>
              <input type="time" className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all [color-scheme:dark]" 
                value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="gsap-item pt-6">
            <button 
              type="submit" 
              disabled={submitting || !societyId} 
              className={`w-full font-bold py-4 rounded-xl transition-all uppercase tracking-widest text-lg
                ${submitting ? "bg-gray-500/50 text-gray-300 cursor-not-allowed" : "bg-[#FFD700] text-[#2A0845] hover:shadow-[0_0_25px_rgba(255,215,0,0.5)] hover:scale-[1.02] active:scale-[0.98]"}`}
            >
              {submitting ? "Processing..." : "Submit Event Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}