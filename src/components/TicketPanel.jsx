import React, { useState, useEffect } from "react";
import {
    ArrowUpRight,
    ArrowBigUp,
    ArrowLeft,
    Calendar,
    Camera,
    AlertTriangle,
    Sparkles,
    ShieldAlert,
    Ban,
    Info,
    Clock,
    User
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeToRoomTickets, createTicket, toggleUpvote } from "../services/firestore";
import { validateImageContent } from "../services/aiValidator";
import { uploadEvidence } from "../services/cloudinary";
import { Home } from "lucide-react";

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

    // NAVIGATION STATE
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    // FLOW STATE
    const [showBlockedMsg, setShowBlockedMsg] = useState(false);
    const [showKarmaWarning, setShowKarmaWarning] = useState(false);
    const [aiReason, setAiReason] = useState("");

    // Form State
    const [category, setCategory] = useState("Electrical");
    const [desc, setDesc] = useState("");
    const [file, setFile] = useState(null);

    // Fetch Tickets
    useEffect(() => {
        if (!room) return;
        const unsubscribe = subscribeToRoomTickets(room.id, (data) => setTickets(data));
        return () => unsubscribe();
    }, [room]);

    // Reset selection when room changes
    useEffect(() => {
        setSelectedTicketId(null);
        setActiveTab("view");
    }, [room]);

    // Derived State for Detail View (Keeps it reactive!)
    const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

    // === FILTER FOR SIMILAR TICKETS ===
    const similarTickets = tickets.filter((t) => t.category === category && t.status === "open");

    // === ACTION: JUMP TO TICKET ===
    const handleJumpToTicket = async (ticket) => {
        if (!user) {
            alert("Please login to perform this action.");
            return;
        }
        // Auto-Upvote
        if (!ticket.upvotes.includes(user.uid)) {
            await toggleUpvote(ticket.id, user.uid, ticket.upvotes);
        }
        // Open Detail View
        setSelectedTicketId(ticket.id);
        setActiveTab("view");
    };

    const handleUpvoteClick = (e, ticket) => {
        e.stopPropagation(); // Prevent opening detail view when clicking upvote
        if (!user) return;
        toggleUpvote(ticket.id, user.uid, ticket.upvotes);
    };

    // Helper: Format Firestore Timestamp
    const formatDate = (timestamp) => {
        if (!timestamp) return "Just now";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // === SUBMIT LOGIC ===
    const finalizeSubmit = async () => {
        setLoading(true);
        setShowKarmaWarning(false);

        try {
            let imageUrl = "";
            if (file) imageUrl = await uploadEvidence(file);

            await createTicket(
                {
                    roomId: room.id,
                    roomName: room.label,
                    category,
                    description: desc,
                    photoUrl: imageUrl,
                    requiresAudit: RISK_CATEGORIES.includes(category),
                },
                user
            );

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

    const initiateSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

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
                <div className="flex items-center gap-2">
                    {/* Back Button (Only in Detail Mode) */}
                    {activeTab === "view" && selectedTicketId && (
                        <button
                            onClick={() => setSelectedTicketId(null)}
                            className="mr-1 p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{room.label}</h2>
                        <p className="text-gray-500 text-xs font-mono">{room.id}</p>
                    </div>
                </div>
                <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                    <Home size={20} className="text-gray-600" />
                </button>
            </div>

            {/* Tabs (Hidden in Detail Mode) */}
            {!selectedTicketId && (
                <div className="flex border-b bg-gray-50/50">
                    <button
                        onClick={() => setActiveTab("view")}
                        className={`flex-1 p-3 font-semibold text-xs uppercase ${
                            activeTab === "view" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-gray-500"
                        }`}
                    >
                        Issues ({tickets.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("create")}
                        className={`flex-1 p-3 font-semibold text-xs uppercase ${
                            activeTab === "create"
                                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                                : "text-gray-500"
                        }`}
                    >
                        Report New
                    </button>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
                {/* === VIEW TAB === */}
                {activeTab === "view" && (
                    <div className="h-full">
                        {/* A. TICKET LIST */}
                        {!selectedTicketId ? (
                            <div className="p-4 space-y-4">
                                {tickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => setSelectedTicketId(ticket.id)}
                                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] px-2 py-0.5 rounded border font-bold uppercase bg-gray-50 text-gray-700">
                                                {ticket.category}
                                            </span>
                                            <span
                                                className={`text-[10px] font-bold ${
                                                    ticket.status === "resolved" ? "text-green-600" : "text-orange-500"
                                                }`}
                                            >
                                                {ticket.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <p className="text-sm font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                                            {ticket.description.length > 60
                                                ? ticket.description.substring(0, 60) + "..."
                                                : ticket.description}
                                        </p>

                                        {ticket.photoUrl && (
                                            <div className="h-24 w-full rounded-lg overflow-hidden my-3 border border-gray-100">
                                                <img
                                                    src={ticket.photoUrl}
                                                    className="w-full h-full object-cover"
                                                    alt="Preview"
                                                />
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center pt-2 border-t mt-2">
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Clock size={10} /> {formatDate(ticket.createdAt).split(",")[0]}
                                            </span>

                                            <button
                                                disabled={!user}
                                                onClick={(e) => handleUpvoteClick(e, ticket)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                            ${
                                !user
                                    ? "bg-gray-50 text-gray-300"
                                    : ticket.upvotes.includes(user.uid)
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }
                          `}
                                            >
                                                <ArrowBigUp size={12} /> {ticket.voteCount || 0}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {tickets.length === 0 && (
                                    <div className="text-center py-12 text-gray-400">No issues reported.</div>
                                )}
                            </div>
                        ) : (
                            // B. TICKET DETAIL VIEW
                            selectedTicket && (
                                <div className="bg-white min-h-full p-6 animate-fade-in">
                                    {/* Category & Date */}
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-100">
                                            {selectedTicket.category}
                                        </span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                                            <Calendar size={12} />
                                            {formatDate(selectedTicket.createdAt)}
                                        </span>
                                    </div>

                                    {/* Title/Description */}
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
                                        {selectedTicket.description}
                                    </h3>

                                    {/* Full Image */}
                                    {selectedTicket.photoUrl && (
                                        <div className="mb-6 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                            <img
                                                src={selectedTicket.photoUrl}
                                                className="w-full h-auto object-contain bg-gray-50"
                                                alt="Evidence"
                                            />
                                        </div>
                                    )}

                                    {/* Metadata Card */}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-700">Reported by</p>
                                                    <p className="text-xs text-gray-500">
                                                        {selectedTicket.createdBy.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-700">Status</p>
                                                <p
                                                    className={`text-xs font-bold uppercase ${
                                                        selectedTicket.status === "resolved"
                                                            ? "text-green-600"
                                                            : "text-orange-500"
                                                    }`}
                                                >
                                                    {selectedTicket.status}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex gap-3">
                                        <button
                                            disabled={!user}
                                            onClick={(e) => handleUpvoteClick(e, selectedTicket)}
                                            className={`flex-1 py-3 rounded-xl font-bold shadow-sm flex justify-center items-center gap-2 transition-all
                        ${
                            !user
                                ? "bg-gray-100 text-gray-400"
                                : selectedTicket.upvotes.includes(user.uid)
                                ? "bg-blue-600 text-white shadow-blue-200"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }
                      `}
                                        >
                                            <ArrowBigUp
                                                size={18}
                                                className={
                                                    selectedTicket.upvotes.includes(user.uid) ? "fill-current" : ""
                                                }
                                            />
                                            {selectedTicket.voteCount || 0} Upvotes
                                        </button>

                                        {/* Placeholder for Admin Actions */}
                                        {/* <button className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600">
                      <Share2 size={18} />
                    </button> */}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* === CREATE TAB (Standard Form) === */}
                {activeTab === "create" && (
                    <div className="p-4 space-y-4">
                        {/* ... Same Create Form Logic ... */}
                        {!user && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs flex gap-2 items-center animate-pulse">
                                <AlertTriangle size={16} className="shrink-0" />
                                <span className="font-bold">Please sign in to file a complaint.</span>
                            </div>
                        )}

                        {showBlockedMsg && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
                                <div className="flex items-center gap-2 mb-2 text-red-800 font-bold">
                                    <Ban size={20} />
                                    <span>Upload Blocked</span>
                                </div>
                                <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                                    Reason:{" "}
                                    <span className="font-bold">{aiReason.replace("Image appears to be: ", "")}</span>.
                                </p>
                                <button
                                    onClick={() => {
                                        setShowBlockedMsg(false);
                                        setFile(null);
                                    }}
                                    className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {showKarmaWarning && (
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 animate-fade-in">
                                <div className="flex items-center gap-2 mb-2 text-orange-800 font-bold">
                                    <ShieldAlert size={20} />
                                    <span>Karma Risk Warning</span>
                                </div>
                                <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                                    If Admins mark this as fake,{" "}
                                    <span className="font-bold text-red-600">your Karma will decrease</span>.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowKarmaWarning(false)}
                                        className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold"
                                    >
                                        Go Back
                                    </button>
                                    <button
                                        onClick={finalizeSubmit}
                                        className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 shadow-sm"
                                    >
                                        I Understand
                                    </button>
                                </div>
                            </div>
                        )}

                        {!showBlockedMsg && !showKarmaWarning && (
                            <form
                                onSubmit={initiateSubmit}
                                className={`space-y-4 ${!user ? "opacity-50 pointer-events-none" : ""}`}
                            >
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Category</label>
                                    <select
                                        className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:border-blue-500"
                                        value={category}
                                        onChange={(e) => {
                                            setCategory(e.target.value);
                                            setShowBlockedMsg(false);
                                        }}
                                    >
                                        <option value="Electrical">Electrical (AI Checked)</option>
                                        <option value="Civil">Civil (AI Checked)</option>
                                        <option value="Furniture">Furniture (AI Checked)</option>
                                        <option value="Washroom">Washroom (AI Checked)</option>
                                        <option value="Cleanliness">Cleanliness (Karma Risk)</option>
                                        <option value="Other">Other (Karma Risk)</option>
                                    </select>
                                </div>

                                {/* SUGGESTION BOX */}
                                {similarTickets.length > 0 && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 animate-fade-in">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Info size={16} className="text-blue-600" />
                                            <span className="text-xs font-bold text-blue-800">
                                                {similarTickets.length} open {category.toLowerCase()} issue(s) found:
                                            </span>
                                        </div>
                                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                            {similarTickets.map((ticket) => (
                                                <div
                                                    key={ticket.id}
                                                    className="bg-white p-2 rounded border border-blue-100 flex justify-between items-center gap-3"
                                                >
                                                    <p className="text-[11px] text-gray-600 truncate flex-1">
                                                        {ticket.description}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleJumpToTicket(ticket)}
                                                        className="flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-[10px] font-bold transition-colors whitespace-nowrap"
                                                    >
                                                        View Issue <ArrowUpRight size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Description</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:border-blue-500"
                                        rows="4"
                                        placeholder="Describe the issue..."
                                        value={desc}
                                        onChange={(e) => setDesc(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                        Evidence{" "}
                                        {STRICT_CATEGORIES.includes(category) && (
                                            <span className="text-red-500">*</span>
                                        )}
                                    </label>
                                    <div
                                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer relative transition-colors ${
                                            file ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:bg-gray-100"
                                        }`}
                                    >
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setFile(e.target.files[0])}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex flex-col items-center gap-2 text-gray-500">
                                            <Camera size={24} className={file ? "text-blue-500" : "text-gray-400"} />
                                            <span className="text-xs font-medium">
                                                {file ? file.name : "Tap to upload"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!user || loading || isValidating}
                                    className={`w-full py-3.5 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition-all ${
                                        !user
                                            ? "bg-gray-300 cursor-not-allowed text-gray-500"
                                            : loading || isValidating
                                            ? "bg-gray-400 cursor-wait text-white"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                    }`}
                                >
                                    {isValidating ? (
                                        <>
                                            {" "}
                                            <Sparkles size={18} className="animate-spin" /> Verifying...{" "}
                                        </>
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
