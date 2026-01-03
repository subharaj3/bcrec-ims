import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
    ShieldCheck,
    AlertCircle,
    Clock,
    CheckCircle,
    Menu,
    MapPin,
    User
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore"; // Import Firestore functions
import { db } from "../services/firebase"; // Import database instance

const SmartNavbar = ({ onOpenProfile }) => {
    const { user, userData, login } = useAuth();
    const [stats, setStats] = useState({ active: 0, progress: 0, resolved: 0 });
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        // Subscribe to real-time updates from the "tickets" collection
        const unsubscribe = onSnapshot(collection(db, "tickets"), (snapshot) => {
            let activeCount = 0;
            let progressCount = 0;
            let resolvedCount = 0;

            snapshot.forEach((doc) => {
                const data = doc.data();
                // Check status and increment specific counters
                if (data.status === 'open') {
                    activeCount++;
                } else if (data.status === 'in-progress') {
                    progressCount++;
                } else if (data.status === 'resolved') {
                    resolvedCount++;
                }
            });

            setStats({
                active: activeCount,
                progress: progressCount,
                resolved: resolvedCount
            });
        });

        return () => unsubscribe();
    }, []);

    // Reset error state when user changes
    useEffect(() => {
        setImageError(false);
    }, [user?.photoURL]);

    return (
        <div className="fixed top-4 left-[96px] right-4 z-40 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-lg px-8 h-[72px]">
            <div className="flex items-center justify-between h-full max-w-7xl mx-auto">

                {/* 1. LOGO & FLOOR INFO */}
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-3 cursor-pointer group">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
                        />
                        <div>
                            {/* CHANGED: IMS color set to #54ac70 */}
                            <h1 className="text-lg font-black text-gray-800 leading-none tracking-tight">
                                BCREC <span className="text-[#54ac70]">IMS</span>
                            </h1>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-gray-200" />

                    <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} className="text-blue-600" />
                        <div>
                            <p className="text-xs font-bold text-gray-800 uppercase">3rd Floor</p>
                            <p className="text-[10px] font-bold text-gray-400">Main Building</p>
                        </div>
                    </div>
                </div>

                {/* 2. STATS CENTER */}
                <div className="flex items-center gap-10">
                    <div className="flex flex-col items-center group cursor-default">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-gray-800 text-2xl">
                                {stats.active}
                            </span>
                            <AlertCircle size={16} className="text-red-500 drop-shadow-sm" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Active
                        </span>
                    </div>

                    <div className="h-6 w-px bg-gray-200" />

                    <div className="flex flex-col items-center group cursor-default">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-gray-800 text-2xl">
                                {stats.progress}
                            </span>
                            <Clock size={16} className="text-orange-500 drop-shadow-sm" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Progress
                        </span>
                    </div>

                    <div className="h-6 w-px bg-gray-200" />

                    <div className="flex flex-col items-center group cursor-default">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-gray-800 text-2xl">
                                {stats.resolved}
                            </span>
                            <CheckCircle size={16} className="text-green-500 drop-shadow-sm" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Resolved
                        </span>
                    </div>
                </div>

                {/* 3. PROFILE TRIGGER */}
                <div className="flex items-center gap-4">
                    {!user ? (
                        <button
                            onClick={login}
                            className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xl transition-all active:scale-95"
                        >
                            Sign In
                        </button>
                    ) : (
                        <button
                            onClick={onOpenProfile}
                            className="flex items-center gap-3 p-1.5 pr-4 rounded-full border border-gray-200 shadow-sm hover:bg-white hover:border-blue-300 hover:shadow-md transition-all duration-300 group bg-gray-50"
                        >
                            {/* Logic: Show Image if valid, otherwise show Icon */}
                            {user.photoURL && !imageError ? (
                                <img
                                    src={user.photoURL}
                                    onError={() => setImageError(true)}
                                    alt="User"
                                    className="rounded-full border-2 border-white shadow-sm object-cover w-9 h-9"
                                />
                            ) : (
                                <div className="rounded-full border-2 border-white shadow-sm bg-blue-100 flex items-center justify-center w-9 h-9 text-blue-600">
                                    <User size={18} />
                                </div>
                            )}

                            <div className="text-left max-w-[120px]">
                                <p className="text-xs font-bold text-gray-800 truncate">
                                    {user.displayName?.split(" ")[0]}
                                </p>
                                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wide">
                                    {userData?.role || "Student"}
                                </p>
                            </div>

                            <Menu size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SmartNavbar;