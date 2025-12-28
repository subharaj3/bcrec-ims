import React, { useState, useEffect } from "react";
import { X, Camera, AlertTriangle, ArrowBigUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeToRoomTickets, createTicket, toggleUpvote, uploadEvidence } from "../services/firestore";

const TicketModal = ({ room, onClose }) => {
  const { user } = useAuth();
  
  // State
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("view"); // "view" or "create"
  const [loading, setLoading] = useState(false);

  // Form State
  const [category, setCategory] = useState("Electrical");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);

  // 1. Fetch Tickets on Load (Real-time!)
  useEffect(() => {
    if (!room) return;
    const unsubscribe = subscribeToRoomTickets(room.id, (data) => {
      setTickets(data);
    });
    return () => unsubscribe(); // Cleanup listener on close
  }, [room]);

  // 2. Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please login first!");
    setLoading(true);

    try {
      // A. Upload Image (if any)
      let imageUrl = "";
      if (file) {
        imageUrl = await uploadEvidence(file);
      }

      // B. Create Ticket in DB
      await createTicket({
        roomId: room.id,
        roomName: room.label, // Save label for easier display later
        category,
        description: desc,
        photoUrl: imageUrl,
      }, user);

      // C. Reset & Switch to View
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{room.label}</h2>
            <p className="text-blue-100 text-xs">{room.id}</p>
          </div>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded-full"><X size={24}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button 
            onClick={() => setActiveTab("view")}
            className={`flex-1 p-3 font-semibold text-sm ${activeTab === "view" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          >
            Current Issues ({tickets.length})
          </button>
          <button 
            onClick={() => setActiveTab("create")}
            className={`flex-1 p-3 font-semibold text-sm ${activeTab === "create" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          >
            Report New
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
          
          {/* === VIEW MODE === */}
          {activeTab === "view" && (
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p>No active complaints here.</p>
                  <p className="text-xs">Room is in good condition! 🎉</p>
                </div>
              ) : (
                tickets.map(ticket => (
                  <div key={ticket.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider mb-2 inline-block
                        ${ticket.category === 'Electrical' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}
                      `}>
                        {ticket.category}
                      </span>
                      <span className={`text-[10px] font-bold ${ticket.status === 'resolved' ? 'text-green-600' : 'text-orange-500'}`}>
                        {ticket.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-gray-800 font-medium text-sm mb-2">{ticket.description}</p>
                    
                    {ticket.photoUrl && (
                      <img src={ticket.photoUrl} alt="Evidence" className="w-full h-32 object-cover rounded-md mb-2 bg-gray-100" />
                    )}

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-400">by {ticket.createdBy.name}</span>
                      
                      <button 
                        onClick={() => user && toggleUpvote(ticket.id, user.uid, ticket.upvotes)}
                        disabled={!user}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors disabled:cursor-not-allowed
                          ${user && ticket.upvotes.includes(user.uid) 
                            ? "bg-blue-100 text-blue-600" 
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"}
                        `}
                      >
                        VOTE 
                        <ArrowBigUp size={14} />
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
                <div className="bg-red-50 text-red-600 p-3 rounded text-xs flex gap-2 items-center">
                  <AlertTriangle size={16}/> Please sign in to file a complaint.
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                <select 
                  className="w-full p-2 border rounded-lg bg-white text-sm"
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea 
                  className="w-full p-2 border rounded-lg bg-white text-sm focus:ring-2 ring-blue-500 outline-none"
                  rows="3"
                  placeholder="Describe the issue..."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Evidence Photo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Camera size={24} />
                    <span className="text-xs">{file ? file.name : "Tap to upload photo"}</span>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={!user || loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
              >
                {loading ? "Submitting..." : "Submit Complaint"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketModal;