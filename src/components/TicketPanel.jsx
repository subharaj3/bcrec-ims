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
    User,
    Home,
    Briefcase,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeToRoomTickets, createTicket, toggleUpvote, updateTicketStatus, reviewTicket } from "../services/firestore";
import { validateImageContent } from "../services/aiValidator";
import { uploadEvidence } from "../services/cloudinary";

// === CONFIGURATION ===
const STRICT_CATEGORIES = ["Electrical", "Furniture", "Civil", "Washroom"];
const RISK_CATEGORIES = ["Cleanliness", "Other"];

const TicketPanel = ({ room, onClose, initialTicketId }) => {
    const { user, userData } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [activeTab, setActiveTab] = useState("view");

    // UI State
    const [loading, setLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [highlightedTicketId, setHighlightedTicketId] = useState(initialTicketId || null);

    // Flow State
    const [showBlockedMsg, setShowBlockedMsg] = useState(false);
    const [showKarmaWarning, setShowKarmaWarning] = useState(false);
    const [aiReason, setAiReason] = useState("");

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({ show: false, action: null });

    // Forms
    const [category, setCategory] = useState("Electrical");
    const [desc, setDesc] = useState("");
    const [file, setFile] = useState(null);

    // Staff Action Inputs
    const [staffNote, setStaffNote] = useState("");
    const [staffFile, setStaffFile] = useState(null);

    useEffect(() => {
        if (!room) return;
        const unsubscribe = subscribeToRoomTickets(room.id, (data) => setTickets(data));
        return () => unsubscribe();
    }, [room]);

    useEffect(() => {
        setSelectedTicketId(null);
        setActiveTab("view");
        setShowBlockedMsg(false);
        setShowKarmaWarning(false);
        setConfirmModal({ show: false, action: null });
    }, [room]);

    useEffect(() => {
        if (initialTicketId) {
            setActiveTab("view");
            // BUG FIX: This forces the panel to switch to "Detail View" immediately
            setSelectedTicketId(initialTicketId);
            setHighlightedTicketId(initialTicketId);
        }
    }, [initialTicketId]);
    const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

    const similarTickets = tickets.filter((t) => t.category === category && ["open", "in-progress"].includes(t.status));

    const handleJumpToTicket = async (ticket) => {
        if (!user) {
            alert("Please login to perform this action.");
            return;
        }
        if (!ticket.upvotes.includes(user.uid)) {
            await toggleUpvote(ticket.id, user.uid, ticket.upvotes);
        }
        setSelectedTicketId(ticket.id);
        setActiveTab("view");
    };

    const handleUpvoteClick = (e, ticket) => {
        e.stopPropagation();
        if (!user) return;
        toggleUpvote(ticket.id, user.uid, ticket.upvotes);
    };

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

    // === STAFF ACTIONS ===
    const initiateStaffAction = (actionType) => {
        setConfirmModal({ show: true, action: actionType });
    };

    const executeStaffUpdate = async () => {
        setLoading(true);
        const actionType = confirmModal.action; // "in-progress", "resolved", or "fake"

        try {
            let proofUrl = selectedTicket.resolutionImageUrl || "";
            if (staffFile) {
                proofUrl = await uploadEvidence(staffFile);
            }

            const staffData = {
                uid: user.uid,
                name: user.displayName,
                note: staffNote || selectedTicket.staffNote || ""
            };

            if (actionType === "in-progress") {
                // Simple update for "In Progress" (No karma change)
                await updateTicketStatus(selectedTicket.id, {
                    status: "in-progress",
                    staffNote: staffData.note,
                    resolutionImageUrl: proofUrl,
                    resolvedBy: { name: staffData.name, uid: staffData.uid },
                });
            } else {
                // === NEW: USE TRANSACTION FOR RESULT/FAKE ===
                // This handles Karma logic automatically
                const isFake = actionType === "fake";
                // We need the original creator's ID to deduct/add their karma
                const ticketCreatorId = selectedTicket.createdBy.uid;

                await reviewTicket(selectedTicket.id, ticketCreatorId, isFake, staffData, proofUrl);
            }

            setStaffNote("");
            setStaffFile(null);
            setConfirmModal({ show: false, action: null });
        } catch (error) {
            console.error(error);
            alert("Failed to update status: " + error);
        } finally {
            setLoading(false);
        }
    };

    // === STUDENT SUBMISSION ===
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
        <div className="h-full w-full bg-white flex flex-col border-l border-gray-200 shadow-2xl relative">
            {/* CONFIRMATION DIALOG */}
            {confirmModal.show && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-gray-200">
                        <div className="flex flex-col items-center text-center mb-4">
                            <div
                                className={`p-3 rounded-full mb-3 
                ${confirmModal.action === "fake"
                                        ? "bg-red-100 text-red-600"
                                        : confirmModal.action === "resolved"
                                            ? "bg-green-100 text-green-600"
                                            : "bg-blue-100 text-blue-600"
                                    }`}
                            >
                                {confirmModal.action === "fake" ? (
                                    <XCircle size={32} />
                                ) : confirmModal.action === "resolved" ? (
                                    <CheckCircle size={32} />
                                ) : (
                                    <Clock size={32} />
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">
                                Mark as {confirmModal.action.replace("-", " ").toUpperCase()}?
                            </h3>
                            <p className="text-xs text-gray-500 mt-2">
                                This will update the ticket status visible to all students.
                                {confirmModal.action === "fake" && " This action cannot be easily undone."}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal({ show: false, action: null })}
                                disabled={loading}
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeStaffUpdate}
                                disabled={loading}
                                className={`flex-1 py-2.5 text-white rounded-lg text-sm font-bold shadow-md transition-all flex justify-center items-center gap-2
                  ${loading
                                        ? "bg-gray-400"
                                        : confirmModal.action === "fake"
                                            ? "bg-red-600 hover:bg-red-700"
                                            : confirmModal.action === "resolved"
                                                ? "bg-green-600 hover:bg-green-700"
                                                : "bg-blue-600 hover:bg-blue-700"
                                    }
                `}
                            >
                                {loading ? <Sparkles size={16} className="animate-spin" /> : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
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

            {/* TABS */}
            {!selectedTicketId && (
                <div className="flex border-b bg-gray-50/50">
                    <button
                        onClick={() => setActiveTab("view")}
                        className={`flex-1 p-3 font-semibold text-xs uppercase ${activeTab === "view"
                            ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                            : "text-gray-500 hover:bg-gray-100"
                            }`}
                    >
                        Issues ({tickets.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("create")}
                        className={`flex-1 p-3 font-semibold text-xs uppercase ${activeTab === "create"
                            ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                            : "text-gray-500 hover:bg-gray-100"
                            }`}
                    >
                        Report New
                    </button>
                </div>
            )}

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
                {/* VIEW TAB */}
                {activeTab === "view" && (
                    <div className="h-full">
                        {!selectedTicketId ? (
                            <div className="p-4 space-y-4">
                                {tickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => setSelectedTicketId(ticket.id)}
                                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer group transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] px-2 py-0.5 rounded border font-bold uppercase bg-gray-50 text-gray-700">
                                                {ticket.category}
                                            </span>
                                            <span
                                                className={`text-[10px] font-bold ${ticket.status === "resolved"
                                                    ? "text-green-600"
                                                    : ticket.status === "in-progress"
                                                        ? "text-blue-600"
                                                        : ticket.status === "fake"
                                                            ? "text-red-500"
                                                            : "text-orange-500"
                                                    }`}
                                            >
                                                {ticket.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-800 mb-1 group-hover:text-blue-600 truncate">
                                            {ticket.description}
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
                                            {/* ANONYMOUS DISPLAY IN LIST */}
                                            <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                                <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <User size={10} className="text-gray-500" />
                                                </div>
                                                Student
                                            </span>

                                            <button
                                                disabled={!user}
                                                onClick={(e) => handleUpvoteClick(e, ticket)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                            ${!user
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
                            // DETAIL VIEW
                            selectedTicket && (
                                <div className="bg-white min-h-full p-6 animate-fade-in pb-20">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-100">
                                            {selectedTicket.category}
                                        </span>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${selectedTicket.status === "resolved"
                                                ? "bg-green-100 text-green-700 border-green-200"
                                                : selectedTicket.status === "in-progress"
                                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                                    : selectedTicket.status === "fake"
                                                        ? "bg-red-100 text-red-700 border-red-200"
                                                        : "bg-orange-100 text-orange-700 border-orange-200"
                                                }`}
                                        >
                                            {selectedTicket.status}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
                                        {selectedTicket.description}
                                    </h3>

                                    {selectedTicket.photoUrl && (
                                        <div className="mb-6 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative group">
                                            <img
                                                src={selectedTicket.photoUrl}
                                                className="w-full h-auto object-contain bg-gray-50"
                                                alt="Issue"
                                            />
                                        </div>
                                    )}

                                    {/* ANONYMOUS METADATA CARD */}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-3">
                                                {/* Generic Avatar */}
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border-2 border-white shadow-sm">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-700">Reported by</p>
                                                    <p className="text-xs text-gray-500 font-medium">Student</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-700">Status</p>
                                                <p
                                                    className={`text-xs font-bold uppercase ${selectedTicket.status === "resolved"
                                                        ? "text-green-600"
                                                        : "text-orange-500"
                                                        }`}
                                                >
                                                    {selectedTicket.status}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                                            <ArrowBigUp size={14} className="text-blue-500" />{" "}
                                            <span className="font-bold text-xs">{selectedTicket.voteCount}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            disabled={!user}
                                            onClick={(e) => handleUpvoteClick(e, selectedTicket)}
                                            className={`flex-1 py-3 rounded-xl font-bold shadow-sm flex justify-center items-center gap-2 transition-all
                        ${!user
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
                                    </div>
                                    {/* === STAFF ACTIONS (Light UI) === */}
                                    {(userData.role === "staff" || userData.role === "admin") && selectedTicket.status !== "fake" && (
                                        <div className="mt-5 bg-gray-50 rounded-xl p-5 shadow-sm mb-6 border border-gray-200">
                                            <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
                                                <Briefcase size={18} className="text-blue-600" />
                                                <span className="font-bold text-sm text-gray-700 tracking-wide">
                                                    Staff Actions
                                                </span>
                                            </div>

                                            {/* Note Input */}
                                            <textarea
                                                className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none mb-3 transition-colors"
                                                rows="2"
                                                placeholder="Add progress note or resolution details..."
                                                value={staffNote}
                                                onChange={(e) => setStaffNote(e.target.value)}
                                            />

                                            {/* Upload */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-300 hover:bg-gray-100 px-3 py-2 rounded-lg text-xs font-bold text-gray-700 transition-colors shadow-sm">
                                                    <Camera size={14} /> {staffFile ? "Change Proof" : "Upload Proof"}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={(e) => setStaffFile(e.target.files[0])}
                                                        accept="image/*"
                                                    />
                                                </label>
                                                {staffFile && (
                                                    <span className="text-xs text-green-600 font-medium truncate max-w-[150px]">
                                                        {staffFile.name}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Buttons */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={() => initiateStaffAction("in-progress")}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-colors shadow-sm"
                                                >
                                                    <Clock size={14} /> In Progress
                                                </button>
                                                <button
                                                    onClick={() => initiateStaffAction("resolved")}
                                                    className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-colors shadow-sm"
                                                >
                                                    <CheckCircle size={14} /> Resolve
                                                </button>
                                                <button
                                                    onClick={() => initiateStaffAction("fake")}
                                                    className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-colors shadow-sm"
                                                >
                                                    <XCircle size={14} /> Flag Fake
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* OFFICIAL UPDATE */}
                                    {(selectedTicket.staffNote || selectedTicket.resolutionImageUrl) && (
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-fade-in">
                                            <h4 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <CheckCircle size={12} /> Official Update
                                            </h4>
                                            {selectedTicket.staffNote && (
                                                <p className="text-sm text-gray-800 mb-2">{selectedTicket.staffNote}</p>
                                            )}
                                            {selectedTicket.resolutionImageUrl && (
                                                <div className="rounded-lg overflow-hidden border border-green-100">
                                                    <img
                                                        src={selectedTicket.resolutionImageUrl}
                                                        className="w-full h-auto object-cover"
                                                        alt="Resolution"
                                                    />
                                                </div>
                                            )}
                                            {selectedTicket.resolvedBy && (
                                                <p className="text-[10px] text-green-600 mt-2 text-right">
                                                    Updated by: {selectedTicket.resolvedBy.name}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* CREATE TAB */}
                {activeTab === "create" && (
                    <div className="p-4 space-y-4">
                        {!user && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs flex gap-2 items-center animate-pulse">
                                <AlertTriangle size={16} className="shrink-0" />{" "}
                                <span className="font-bold">Please sign in to file a complaint.</span>
                            </div>
                        )}

                        {showBlockedMsg && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
                                <div className="flex items-center gap-2 mb-2 text-red-800 font-bold">
                                    <Ban size={20} />
                                    <span>Upload Blocked</span>
                                </div>
                                <p className="text-xs text-gray-700 mb-3">
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
                                <p className="text-xs text-gray-700 mb-3">
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

                                {similarTickets.length > 0 && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 animate-fade-in">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Info size={16} className="text-blue-600" />
                                            <span className="text-xs font-bold text-blue-800">
                                                {similarTickets.length} active {category.toLowerCase()} issue(s):
                                            </span>
                                        </div>
                                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                            {similarTickets.map((ticket) => (
                                                <div
                                                    key={ticket.id}
                                                    className="bg-white p-2 rounded border border-blue-100 flex justify-between items-center gap-3"
                                                >
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-[11px] text-gray-600 truncate">
                                                            {ticket.description}
                                                        </p>
                                                        <span
                                                            className={`text-[9px] font-bold uppercase ${ticket.status === "in-progress"
                                                                ? "text-blue-500"
                                                                : "text-orange-500"
                                                                }`}
                                                        >
                                                            {ticket.status}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleJumpToTicket(ticket)}
                                                        className="flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-[10px] font-bold transition-colors whitespace-nowrap"
                                                    >
                                                        View & Vote <ArrowUpRight size={10} />
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
                                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer relative transition-colors ${file ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:bg-gray-100"
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
                                    className={`w-full py-3.5 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition-all ${!user
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
