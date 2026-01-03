import React, { useState, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import { ArrowLeft } from "lucide-react";
import FloorMap from "./components/FloorMap";
import TicketPanel from "./components/TicketPanel";
import AdminMapEditor from "./components/AdminMapEditor";
import ProfileSetup from "./components/ProfileSetup";
import ProfilePanel from "./components/ProfilePanel";
import SmartNavbar from "./components/SmartNavbar";
import LeftSidebar from "./components/LeftSidebar";

function App() {
    const { user, userData } = useAuth();
    const mapRef = useRef(null);

    // UI State
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [focusTicketId, setFocusTicketId] = useState(null);

    // Layout State
    const [isNavbarExpanded, setIsNavbarExpanded] = useState(false);
    const [isLegendOpen, setIsLegendOpen] = useState(true);

    const handleRoomSelect = (room) => {
        if (!isAdminMode) {
            setSelectedRoom(room);
            setFocusTicketId(null);
            setIsPanelOpen(true);
            setIsNavbarExpanded(false);
        }
    };

    const handleTicketNavigation = (ticket) => {
        if (!isAdminMode) {
            setIsProfileOpen(false);
            setSelectedRoom({ id: ticket.roomId, label: ticket.roomName });
            setFocusTicketId(ticket.id);
            setIsPanelOpen(true);
            setIsNavbarExpanded(false);
        }
    };

    const handleMapClick = () => {
        setIsNavbarExpanded(false);
        setIsLegendOpen(false);
    };

    const handleCenterMap = () => {
        if (mapRef.current) mapRef.current.resetView();
    };

    if (user && userData && !userData.isProfileComplete) return <ProfileSetup />;

    return (
        <div className="flex h-screen w-screen bg-gray-100 overflow-hidden font-sans text-gray-900">

            {!isAdminMode && (
                <LeftSidebar
                    onToggleLegend={() => setIsLegendOpen(!isLegendOpen)}
                    isLegendOpen={isLegendOpen}
                    onCenterMap={handleCenterMap}
                    onAdminClick={() => setIsAdminMode(!isAdminMode)}
                    isAdmin={userData?.role === "admin"}
                    isAdminMode={isAdminMode}
                />
            )}

            <div className={`flex-1 flex flex-col relative h-full transition-all duration-300
                ${isAdminMode ? "ml-0 p-0 gap-0" : "ml-[80px] p-4 gap-4"}
            `}>

                {!isAdminMode && isLegendOpen && (
                    <div className="absolute top-30 left-10 z-50 bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 w-60 animate-fade-in-right">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Zone Guide</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 bg-red-50 border-2 border-red-500 rounded-lg shadow-sm animate-pulse"></div>
                                <span className="text-xs font-bold text-gray-700">Active Alert</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 bg-blue-50 border border-blue-400 rounded-lg shadow-sm"></div>
                                <span className="text-xs font-bold text-gray-600">Labs & Depts</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 bg-green-50 border border-green-400 rounded-lg shadow-sm"></div>
                                <span className="text-xs font-bold text-gray-600">Utility / Staff</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 bg-red-50 border border-red-300 rounded-lg shadow-sm"></div>
                                <span className="text-xs font-bold text-gray-600">Classrooms</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 bg-gray-100 border border-gray-400 rounded-lg shadow-sm"></div>
                                <span className="text-xs font-bold text-gray-600">Common Areas</span>
                            </div>
                        </div>
                    </div>
                )}

                {!isAdminMode && (
                    <SmartNavbar
                        onOpenProfile={() => setIsProfileOpen(true)}
                    />
                )}

                <div className={`flex-1 relative overflow-hidden transition-all duration-300
                    ${isAdminMode
                        ? "rounded-none border-none shadow-none mt-0"
                        : "rounded-3xl mt-[80px]"
                    }
                `}>

                    {isAdminMode ? (
                        <div className="absolute inset-0 z-40 bg-white">
                            <AdminMapEditor />
                        </div>
                    ) : (
                        <>
                            {/* Map Container */}
                            <div
                                className={`absolute top-0 left-0 bottom-0 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                                    ${isPanelOpen ? "right-[500px]" : "right-0"}
                                `}
                                onClick={handleMapClick}
                            >
                                <FloorMap
                                    ref={mapRef}
                                    onRoomSelect={handleRoomSelect}
                                    isPanelOpen={isPanelOpen}
                                    selectedRoomId={selectedRoom?.id}
                                />
                            </div>

                            {/* Ticket/Room Panel */}
                            <div className={`absolute top-0 right-0 h-full w-[500px] bg-white border-l border-gray-200 shadow-[-10px_0_30px_rgba(0,0,0,0.05)] z-30 overflow-hidden rounded-l-3xl transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                                ${isPanelOpen ? "translate-x-0" : "translate-x-full"}
                            `}>
                                <div className="w-full h-full flex flex-col">
                                    {selectedRoom && (
                                        <TicketPanel
                                            room={selectedRoom}
                                            onClose={() => {
                                                setIsPanelOpen(false);
                                                setSelectedRoom(null);
                                                // Wait 600ms for panel to close, then re-center map in full view
                                                setTimeout(() => handleCenterMap(), 600);
                                            }}
                                            initialTicketId={focusTicketId}
                                        />
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {isAdminMode && (
                <button
                    onClick={() => setIsAdminMode(false)}
                    className="fixed bottom-6 left-6 z-[60] p-4 bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-200 hover:bg-gray-50 hover:text-blue-600 hover:scale-105 transition-all active:scale-95 group"
                    title="Exit Map Editor"
                >
                    <ArrowLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                </button>
            )}

            {isProfileOpen && (
                <ProfilePanel
                    onClose={() => setIsProfileOpen(false)}
                    onNavigate={handleTicketNavigation}
                />
            )}
        </div>
    );
}

export default App;