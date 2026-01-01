import React, { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { Settings, LogOut } from "lucide-react";
import FloorMap from "./components/FloorMap";
import TicketPanel from "./components/TicketPanel";
import AdminMapEditor from "./components/AdminMapEditor";
import ProfileSetup from "./components/ProfileSetup";
import ProfilePanel from "./components/ProfilePanel";

function App() {
    const { user, userData, login, logout } = useAuth();

    // State
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Track specific ticket to focus on
    const [focusTicketId, setFocusTicketId] = useState(null);

    const handleRoomSelect = (room) => {
        if (!isAdminMode) {
            setSelectedRoom(room);
            setFocusTicketId(null); // Clear focus if just clicking room
            setIsPanelOpen(true);
        }
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setFocusTicketId(null);
    };

    // Handler for Profile Navigation
    const handleTicketNavigation = (ticket) => {
        // 1. Close Profile Panel
        setIsProfileOpen(false);

        // 2. Set the Room (triggers Map Zoom via FloorMap useEffect)
        // We construct a minimal room object since we might not have the full rect data here,
        // but TicketPanel mainly needs ID and Label.
        setSelectedRoom({
            id: ticket.roomId,
            label: ticket.roomName,
        });

        // 3. Set the Ticket ID to highlight
        setFocusTicketId(ticket.id);

        // 4. Open Panel
        setIsPanelOpen(true);
    };

    if (user && userData && !userData.isProfileComplete) {
        return <ProfileSetup />;
    }

    return (
        <div className="relative h-screen w-screen bg-gray-900 overflow-hidden">
            {userData?.role === "admin" && (
                <button
                    onClick={() => setIsAdminMode(!isAdminMode)}
                    className={`absolute bottom-6 left-6 z-50 p-3 rounded-full shadow-xl transition-all border border-gray-700
                        ${
                            isAdminMode
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                        }
                    `}
                    title={isAdminMode ? "Exit Editor" : "Open Map Editor"}
                >
                    <Settings size={24} />
                </button>
            )}

            {isAdminMode ? (
                <div className="w-full h-full bg-white z-40">
                    <AdminMapEditor />
                </div>
            ) : (
                <div className="flex h-full w-full">
                    <div className="flex-1 min-w-0 relative flex flex-col h-full transition-all duration-500 ease-in-out">
                        <div className="absolute top-4 right-4 z-50 pointer-events-auto flex items-center gap-2">
                            {user ? (
                                <>
                                    <div
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className={`flex items-center gap-3 bg-white/90 backdrop-blur p-1.5 pl-3 rounded-full shadow-lg border cursor-pointer transition-all hover:bg-white
                                            ${
                                                isProfileOpen
                                                    ? "border-blue-500 ring-2 ring-blue-100"
                                                    : "border-gray-200"
                                            }
                                        `}
                                    >
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-bold text-gray-700 leading-none">
                                                {user.displayName.split(" ")[0]}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {userData?.stream || "Student"}
                                            </span>
                                        </div>
                                        <img
                                            src={user.photoURL}
                                            alt="User"
                                            className="w-8 h-8 rounded-full border border-gray-200"
                                        />
                                    </div>

                                    <button
                                        onClick={logout}
                                        className="bg-red-50 hover:bg-red-100 text-red-500 p-2.5 rounded-full transition-colors shadow-lg border border-red-100"
                                    >
                                        <LogOut size={16} />
                                    </button>

                                    {/* Pass Navigation Handler */}
                                    {isProfileOpen && (
                                        <ProfilePanel
                                            onClose={() => setIsProfileOpen(false)}
                                            onNavigate={handleTicketNavigation} // <--- Passed Here
                                        />
                                    )}
                                </>
                            ) : (
                                <button
                                    onClick={login}
                                    className="bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-lg font-bold text-xs hover:bg-blue-700 transition-all transform hover:-translate-y-0.5"
                                >
                                    Sign in with Google
                                </button>
                            )}
                        </div>

                        <FloorMap
                            onRoomSelect={handleRoomSelect}
                            isPanelOpen={isPanelOpen}
                            selectedRoomId={selectedRoom?.id}
                        />
                    </div>

                    <div
                        className={`h-full bg-white relative z-40 shadow-2xl overflow-hidden transition-[width] duration-500 ease-in-out border-l border-gray-200 ${
                            isPanelOpen ? "w-[40vw]" : "w-0 border-none"
                        }`}
                    >
                        <div className="w-[40vw] h-full">
                            {/* Pass Focus ID */}
                            {selectedRoom && (
                                <TicketPanel
                                    room={selectedRoom}
                                    onClose={handleClosePanel}
                                    initialTicketId={focusTicketId}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
