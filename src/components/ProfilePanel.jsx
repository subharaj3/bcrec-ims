import React, { useState, useEffect } from "react";
import {
    User,
    Mail,
    Hash,
    BookOpen,
    GraduationCap,
    Edit2,
    Save,
    X,
    Award,
    Loader2,
    Ticket,
    ArrowBigUp,
    ArrowUpRight,
    Calendar,
    Ban
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const ProfilePanel = ({ onClose, onNavigate }) => {
    const { user, userData, completeProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userTickets, setUserTickets] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        rollNumber: "",
        course: "",
        stream: "",
    });

    useEffect(() => {
        if (userData) {
            setFormData({
                rollNumber: userData.rollNumber || "",
                course: userData.course || "B.Tech",
                stream: userData.stream || "CSE",
            });
        }
    }, [userData]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "tickets"), where("createdBy.uid", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tickets = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            tickets.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setUserTickets(tickets);
        });
        return () => unsubscribe();
    }, [user]);

    const formatDate = (timestamp) => {
        if (!timestamp) return "Just now";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await completeProfile(formData);
            setIsEditing(false);
        } catch (error) {
            alert("Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!userData) return null;

    return (
        <div className="absolute top-16 right-4 z-[60] w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-down origin-top-right flex flex-col max-h-[85vh]">

            {/* === HEADER === */}
            <div className="bg-blue-600 p-6 text-white relative shrink-0">
                {/* 1. Close Button (Top-Right) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 hover:bg-blue-500 rounded-full transition-colors z-10"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center gap-4">
                    {/* 2. Avatar */}
                    <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-16 h-16 rounded-full border-4 border-blue-400 shadow-md object-cover bg-white"
                    />

                    {/* 3. Name & Role */}
                    <div className="flex flex-col pr-8"> {/* Added padding-right to avoid hitting X */}
                        <h3 className="font-bold text-lg leading-tight truncate max-w-[180px]">
                            {user.displayName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-blue-700 px-2 py-0.5 rounded text-blue-100 uppercase font-bold tracking-wider">
                                {userData.role}
                            </span>
                            {userData.isBanned && (
                                <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white uppercase font-bold tracking-wider flex items-center gap-1">
                                    <Ban size={10} /> Banned
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Karma Display (Absolute Bottom-Right) */}
                <div className={`absolute bottom-8 right-12 flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-lg transition-colors
                    ${(userData.karma ?? 100) <= 0
                        ? 'bg-red-500/30 border-red-400/50 text-red-50'
                        : 'bg-white/20 border-white/30 text-white'}
                `}>
                    <span className="text-2xl font-bold leading-none filter drop-shadow-sm">
                        {userData.karma ?? 100}
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-wider opacity-90 flex items-center gap-1 mt-0.5">
                        <Award size={10} className="fill-current" /> Karma
                    </span>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-1 p-5">
                {/* Email */}
                <div className="flex items-center gap-3 mb-4 text-gray-500">
                    <Mail size={16} />
                    <span className="text-xs font-mono">{user.email}</span>
                </div>

                <hr className="border-gray-100 mb-4" />

                {/* --- EDITABLE PROFILE SECTION --- */}
                <div className="space-y-4 mb-6">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                            <Hash size={10} /> Roll Number
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.rollNumber}
                                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        ) : (
                            <p className="text-sm font-bold text-gray-800 font-mono">{formData.rollNumber}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                                <GraduationCap size={10} /> Course
                            </label>
                            {isEditing ? (
                                <select
                                    value={formData.course}
                                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded text-sm outline-none bg-white"
                                >
                                    <option>B.Tech</option>
                                    <option>M.Tech</option>
                                    <option>BCA</option>
                                    <option>MCA</option>
                                </select>
                            ) : (
                                <p className="text-sm font-bold text-gray-800">{formData.course}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                                <BookOpen size={10} /> Stream
                            </label>
                            {isEditing ? (
                                <select
                                    value={formData.stream}
                                    onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded text-sm outline-none bg-white"
                                >
                                    <option>CSE</option>
                                    <option>IT</option>
                                    <option>ECE</option>
                                    <option>EE</option>
                                    <option>ME</option>
                                    <option>CE</option>
                                    <option>AIML</option>
                                </select>
                            ) : (
                                <p className="text-sm font-bold text-gray-800">{formData.stream}</p>
                            )}
                        </div>
                    </div>

                    {/* Edit Buttons */}
                    <div className="pt-2">
                        {isEditing ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="flex-1 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded flex justify-center items-center gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Save size={12} /> Save
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                            >
                                <Edit2 size={12} /> Edit Details
                            </button>
                        )}
                    </div>
                </div>

                <hr className="border-gray-100 mb-4" />

                {/* --- TICKET HISTORY SECTION --- */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1">
                        <Ticket size={12} /> My Contributions ({userTickets.length})
                    </h4>

                    <div className="space-y-2">
                        {userTickets.length === 0 ? (
                            <p className="text-center text-xs text-gray-400 py-4 italic">
                                You haven't filed any complaints yet.
                            </p>
                        ) : (
                            userTickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    onClick={() => onNavigate(ticket)}
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase
                      ${ticket.status === "resolved" ? "bg-green-100 text-green-700" : ticket.status === "fake" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}
                    `}
                                        >
                                            {ticket.status}
                                        </span>
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                            <Calendar size={10} /> {formatDate(ticket.createdAt)}
                                        </span>
                                        <ArrowUpRight size={12} className="text-gray-300 group-hover:text-blue-500" />
                                    </div>

                                    <p className="text-xs font-semibold text-gray-800 truncate mb-1">
                                        {ticket.description}
                                    </p>

                                    <div className="flex justify-between items-center text-[10px] text-gray-500">
                                        <span>{ticket.roomName || ticket.roomId}</span>
                                        <span className="flex items-center gap-1 font-bold">
                                            <ArrowBigUp size={10} /> {ticket.voteCount || 0}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePanel;