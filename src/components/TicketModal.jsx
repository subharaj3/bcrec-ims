import React, { useState, useEffect } from "react";
import { X, ThumbsUp, Camera, AlertTriangle, ArrowRight, ArrowBigUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeToRoomTickets, createTicket, toggleUpvote, uploadEvidence } from "../services/firestore";

const TicketPanel = ({ room, onClose }) => {
  const { user } = useAuth();
  
  // State
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("view"); 
  const [loading, setLoading] = useState(false);

  // Form State
  const [category, setCategory] = useState("Electrical");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!room) return;
    const unsubscribe = subscribeToRoomTickets(room.id, (data) => {
      setTickets(data);
    });
    return () => unsubscribe(); 
  }, [room]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please login first!");
    setLoading(true);

    try {
      let imageUrl = "";
      if (file) {
        imageUrl = await uploadEvidence(file);
      }

      await createTicket({
        roomId: room.id,
        roomName: room.label, 
        category,
        description: desc,
        photoUrl: imageUrl,
      }, user);

      setDesc("");
      setFile(null);
      setActiveTab("view");
    } catch (err) {
      alert("Failed to submit ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-white flex flex-col border-l border-gray-200 shadow-2xl">
      
      {/* Header */}
      <div className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{room.label}</h2>
          <p className="text-gray-500 text-xs font-mono">{room.id}</p>
        </div>
        {/* Close Button */}
        <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
          <ArrowRight size={20} className="text-gray-600"/>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-gray-50/50">
        <button 
          onClick={() => setActiveTab("view")}
          className={`flex-1 p-3 font-semibold text-xs uppercase tracking-wide transition-colors ${activeTab === "view" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-gray-500 hover:bg-gray-100"}`}
        >
          Issues ({tickets.length})
        </button>
        <button 
          onClick={() => setActiveTab("create")}
          className={`flex-1 p-3 font-semibold text-xs uppercase tracking-wide transition-colors ${activeTab === "create" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-gray-500 hover:bg-gray-100"}`}
        >
          Report New
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        
        {/* === VIEW MODE === */}
        {activeTab === "view" && (
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center opacity-50">
                <ThumbsUp size={48} className="text-darkgray-300 mb-2"/>
                <p className="text-darkgray-500 font-medium">No complaints yet.</p>
                <p className="text-s text-darkgray-400">This room is in perfect condition!</p>
              </div>
            ) : (
              tickets.map(ticket => (
                <div key={ticket.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider
                      ${ticket.category === 'Electrical' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-700 border-gray-200'}
                    `}>
                      {ticket.category}
                    </span>
                    <span className={`text-[10px] font-bold ${ticket.status === 'resolved' ? 'text-green-600' : 'text-orange-500'}`}>
                      {ticket.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-gray-800 font-medium text-sm mb-3">{ticket.description}</p>
                  
                  {ticket.photoUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-gray-100">
                      <img src={ticket.photoUrl} alt="Evidence" className="w-full h-40 object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        {ticket.createdBy.name[0]}
                      </div>
                      <span className="text-xs text-gray-400 truncate max-w-[100px]">{ticket.createdBy.name}</span>
                    </div>
                    
                    <button 
                      onClick={() => user && toggleUpvote(ticket.id, user.uid, ticket.upvotes)}
                      disabled={!user}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95
                        ${user && ticket.upvotes.includes(user.uid) 
                          ? "bg-blue-600 text-white shadow-blue-200 shadow-md" 
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"}
                      `}
                    >
                      VOTE
                      <ArrowBigUp size={14} className={user && ticket.upvotes.includes(user.uid) ? "fill-current" : ""} />
                      {ticket.voteCount || 0}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* === CREATE MODE === */}
        {activeTab === "create" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!user && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-xs flex gap-2 items-center">
                <AlertTriangle size={16}/> You must be logged in to file a report.
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Category</label>
              <select 
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option>Electrical (Fan/Light/AC)</option>
                <option>Furniture (Bench/Desk)</option>
                <option>Civil (Wall/Floor/Window)</option>
                <option>Cleanliness</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Description</label>
              <textarea 
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                rows="4"
                placeholder="What seems to be the problem?"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Evidence Photo</label>
              <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all relative
                 ${file ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:bg-gray-100 hover:border-gray-400"}
              `}>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Camera size={24} className={file ? "text-blue-500" : "text-gray-400"} />
                  <span className="text-xs font-medium">{file ? file.name : "Tap to upload photo"}</span>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!user || loading}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center mt-4"
            >
              {loading ? "Submitting..." : "Submit Complaint"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default TicketPanel;