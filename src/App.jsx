import React, { useState } from "react";
import FloorMap from "./components/FloorMap";
import TicketPanel from "./components/TicketModal";
import { useAuth } from "./context/AuthContext";

function App() {
    const { user, login, logout } = useAuth();

    // State
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const handleRoomSelect = (room) => {
        setSelectedRoom(room);
        setIsPanelOpen(true);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
    };

    return (
        <div className="flex h-screen w-screen bg-gray-900 overflow-hidden">
            {/* 
         1. MAP SECTION 
         - min-w-0: CRITICAL FIX. Tells flexbox "You are allowed to shrink below your content size".
         - flex-1: Takes up all remaining space.
      */}
            <div className="flex-1 min-w-0 relative flex flex-col h-full transition-all duration-500 ease-in-out">
                {/* Navbar */}
                <div className="absolute top-4 right-4 z-50 pointer-events-auto">
                    {user ? (
                        <div className="flex items-center gap-3 bg-white/90 backdrop-blur p-1.5 pl-2 rounded-full shadow-lg border border-gray-200">
                            <span className="text-xs font-bold text-gray-700">{user.displayName.split(" ")[0]}</span>
                            <img
                                src={user.photoURL}
                                alt="User"
                                className="w-8 h-8 rounded-full border border-gray-200"
                            />
                            <button
                                onClick={logout}
                                className="bg-red-50 hover:bg-red-100 text-red-500 p-2 rounded-full transition-colors"
                                title="Sign Out"
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={login}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-lg font-bold text-xs hover:bg-blue-700 transition-all transform hover:-translate-y-0.5"
                        >
                            Sign in with Google
                        </button>
                    )}
                </div>

                {/* The Map */}
                <FloorMap
                    onRoomSelect={handleRoomSelect}
                    isPanelOpen={isPanelOpen} // <--- ADD THIS PROP
                />
            </div>

            {/* 
          2. SIDEBAR CONTAINER 
          - Using explicit 'w-[40vw]' instead of 'w-2/5' guarantees it takes half the viewport.
          - The transition works on 'width'.
      */}
            <div
                className={`
          h-full bg-white relative z-40 shadow-2xl overflow-hidden
          transition-[width] duration-500 ease-in-out border-l border-gray-200
          ${isPanelOpen ? "w-[40vw]" : "w-0 border-none"} 
        `}
            >
                {/* INNER WRAPPER: Fixed width 40vw */}
                <div className="w-[40vw] h-full">
                    {selectedRoom && <TicketPanel room={selectedRoom} onClose={handleClosePanel} />}
                </div>
            </div>
        </div>
    );
}

export default App;
