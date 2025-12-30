import React, { useState, useEffect } from "react";
import { ArrowRight, ArrowBigUp, Camera, AlertTriangle, Sparkles, ShieldAlert, Ban } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeToRoomTickets, createTicket, toggleUpvote } from "../services/firestore";
import { validateImageContent } from "../services/aiValidator";
import { uploadEvidence } from "../services/cloudinary";

// 1. CONFIGURATION
const STRICT_CATEGORIES = ["Electrical", "Furniture", "Civil", "Washroom"];
const RISK_CATEGORIES = ["Cleanliness", "Other"];

const TicketPanel = ({ room, onClose }) => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [activeTab, setActiveTab] = useState("view");

    // UI State
    const [loading, setLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(false);

    // FLOW STATE
    const [showBlockedMsg, setShowBlockedMsg] = useState(false);
    const [showKarmaWarning, setShowKarmaWarning] = useState(false);
    const [aiReason, setAiReason] = useState("");

    // Form State
    const [category, setCategory] = useState("Electrical");
    const [desc, setDesc] = useState("");
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (!room) return;
        const unsubscribe = subscribeToRoomTickets(room.id, (data) => setTickets(data));
        return () => unsubscribe();
    }, [room]);

    // === SUBMIT LOGIC ===
    const finalizeSubmit = async () => {
        setLoading(true);
        setShowKarmaWarning(false);

        try {
            let imageUrl = "";
            if (file) imageUrl = await uploadEvidence(file);

            await createTicket({
                roomId: room.id,
                roomName: room.label,
                category,
                description: desc,
                photoUrl: imageUrl,
                requiresAudit: RISK_CATEGORIES.includes(category),
            }, user);

            // Reset
            setDesc("");
            setFile(null);
            setCategory("Electrical");
            setShowBlockedMsg(false);
            setActiveTab("view");

        } catch (err) {
            console.error(err);
            alert("Failed to submit ticket.");
        } finally {
            setLoading(false);
        }
    };

    // === THE NEW UX FLOW ===
    const initiateSubmit = async (e) => {
        e.preventDefault();
        if (!user) return; // Should be blocked by UI anyway

        setShowBlockedMsg(false);
        setShowKarmaWarning(false);

        if (RISK_CATEGORIES.includes(category)) {
            setShowKarmaWarning(true);
            return;
        }

        if (STRICT_CATEGORIES.includes(category)) {
            if (!file) {
                alert("Photo evidence is mandatory for this category.");
                return;
            }

            setIsValidating(true);
            const aiResult = await validateImageContent(file);
            setIsValidating(false);

            if (!aiResult.isValid) {
                setAiReason(aiResult.reason);
                setShowBlockedMsg(true);
                return;
            }
        }

        await finalizeSubmit();
    };

    return (
        <div className="h-full w-full bg-white flex flex-col border-l border-gray-200 shadow-2xl">

            {/* Header */}
            <div className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{room.label}</h2>
                    <p className="text-gray-500 text-xs font-mono">{room.id}</p>
                </div>
                <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                    <ArrowRight size={20} className="text-gray-600" />
                </button>
            </div>

            <div className="flex border-b bg-gray-50/50">
                <button onClick={() => setActiveTab("view")} className={`flex-1 p-3 font-semibold text-xs uppercase ${activeTab === "view" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-gray-500"}`}>Issues ({tickets.length})</button>
                <button onClick={() => setActiveTab("create")} className={`flex-1 p-3 font-semibold text-xs uppercase ${activeTab === "create" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-gray-500"}`}>Report New</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">

                {/* VIEW TAB */}
                {activeTab === "view" && (
                    <div className="space-y-4">
                        {tickets.map(ticket => (
                            <div key={ticket.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] px-2 py-0.5 rounded border font-bold uppercase bg-gray-50 text-gray-700">{ticket.category}</span>
                                    <span className="text-[10px] font-bold text-orange-500">{ticket.status}</span>
                                </div>
                                <p className="text-sm font-medium mb-3">{ticket.description}</p>
                                {ticket.photoUrl && <img src={ticket.photoUrl} className="w-full h-32 object-cover rounded-lg mb-2" />}
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <span className="text-xs text-gray-400">by {ticket.createdBy.name}</span>

                                    {/* DISABLED UPVOTE IF NO USER */}
                                    <button
                                        disabled={!user}
                                        title={!user ? "Login to upvote" : "Upvote this issue"}
                                        onClick={() => toggleUpvote(ticket.id, user.uid, ticket.upvotes)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                        ${!user
                                                ? "bg-gray-50 text-gray-300 cursor-not-allowed" // Disabled State
                                                : (ticket.upvotes.includes(user.uid)
                                                    ? "bg-blue-600 text-white shadow-blue-200 shadow-md"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200")
                                            }
                      `}
                                    >
                                        <ArrowBigUp size={12} /> VOTE {ticket.voteCount || 0}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {tickets.length === 0 && <div className="text-center py-10 text-gray-400">No issues reported.</div>}
                    </div>
                )}

                {/* CREATE TAB */}
                {activeTab === "create" && (
                    <div className="space-y-4">

                        {/* 🛑 LOGIN REQUIRED WARNING */}
                        {!user && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs flex gap-2 items-center">
                                <AlertTriangle size={16} className="shrink-0" />
                                <span className="font-bold">Please sign in to file a complaint.</span>
                            </div>
                        )}

                        {/* 🛑 STATE 1: BLOCKED MESSAGE */}
                        {showBlockedMsg && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
                                <div className="flex items-center gap-2 mb-2 text-red-800 font-bold">
                                    <Ban size={20} />
                                    <span>Upload Blocked</span>
                                </div>
                                <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                                    Reason: <span className="font-bold">{aiReason.replace("Image appears to be: ", "")}</span>.
                                    <br /><br />
                                    We only accept clear photos of infrastructure for this category.
                                    <br />
                                    If you think this is a mistake file your complaint in 'Others' category!
                                </p>
                                <button
                                    onClick={() => { setShowBlockedMsg(false); setFile(null); }}
                                    className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* ⚠️ STATE 2: KARMA WARNING */}
                        {showKarmaWarning && (
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 animate-fade-in">
                                <div className="flex items-center gap-2 mb-2 text-orange-800 font-bold">
                                    <ShieldAlert size={20} />
                                    <span>Karma Risk Warning</span>
                                </div>
                                <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                                    You selected <strong>{category}</strong>. If Admins mark this as fake,
                                    <span className="font-bold text-red-600"> your Karma Points will decrease</span>.
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowKarmaWarning(false)} className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold">Go Back</button>
                                    <button onClick={finalizeSubmit} className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 shadow-sm">I Understand</button>
                                </div>
                            </div>
                        )}

                        {/* 📝 STATE 3: STANDARD FORM */}
                        {!showBlockedMsg && !showKarmaWarning && (
                            <form onSubmit={initiateSubmit} className={`space-y-4 ${!user ? "opacity-50 pointer-events-none" : ""}`}>

                                {/* Category Select */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Category</label>
                                    <select
                                        className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:border-blue-500"
                                        value={category}
                                        onChange={e => {
                                            setCategory(e.target.value);
                                            setShowBlockedMsg(false);
                                        }}
                                    >
                                        <option value="Electrical">Electrical</option>
                                        <option value="Civil">Civil</option>
                                        <option value="Furniture">Furniture</option>
                                        <option value="Washroom">Washroom</option>
                                        <option value="Cleanliness">Cleanliness</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Description</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:border-blue-500"
                                        rows="4"
                                        placeholder="Describe the issue in details..."
                                        value={desc}
                                        onChange={e => setDesc(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                        Evidence {STRICT_CATEGORIES.includes(category) && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer relative transition-colors
                     ${file ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:bg-gray-100"}
                  `}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => setFile(e.target.files[0])}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex flex-col items-center gap-2 text-gray-500">
                                            <Camera size={24} className={file ? "text-blue-500" : "text-gray-400"} />
                                            <span className="text-xs font-medium">{file ? file.name : "Tap to upload clear photo of your issue wiht the object in focus"}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!user || loading || isValidating}
                                    className={`w-full py-3.5 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition-all
                    ${loading || isValidating ? "bg-gray-400 cursor-wait text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
                  `}
                                >
                                    {isValidating ? (
                                        <> <Sparkles size={18} className="animate-spin" /> Verifying... </>
                                    ) : loading ? (
                                        "Submitting..."
                                    ) : (
                                        "Submit Complaint"
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketPanel;