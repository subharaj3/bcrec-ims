import React, { useRef, useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Info } from 'lucide-react';
import { RoomData as fallbackData } from '../utils/RoomData';
import { getMapLayout, subscribeToHeatmap } from '../services/firestore';

const FloorMap = ({ onRoomSelect, isPanelOpen, selectedRoomId }) => {
    const MAP_WIDTH = 1549;
    const MAP_HEIGHT = 2200;

    const transformComponentRef = useRef(null);
    const [rooms, setRooms] = useState(fallbackData);
    const [ticketCounts, setTicketCounts] = useState({});

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const dbRooms = await getMapLayout();
                if (dbRooms && dbRooms.length > 0) setRooms(dbRooms);
            } catch (error) { console.error("Using fallback map data"); }
        };
        fetchRooms();
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeToHeatmap((counts) => setTicketCounts(counts));
        return () => unsubscribe();
    }, []);

    // === FIXED STYLE LOGIC (No Dynamic Strings) ===
    const getRoomStyle = (room, isSelected) => {
        const count = ticketCounts[room.id] || 0;
        const colorType = room.color || 'blue';

        // 1. Base Classes
        let classes = "cursor-pointer transition-all duration-300 ease-in-out ";

        // 2. DEFINE FILLS (Separated by State)
        const selectedFills = {
            blue: "fill-blue-500/60",   // Less transparent when selected
            red: "fill-red-500/60",
            green: "fill-green-500/60",
            default: "fill-gray-500/60"
        };

        const idleFills = {
            blue: "fill-blue-500/20 hover:fill-blue-500/40", // More transparent when idle
            red: "fill-red-500/20 hover:fill-red-500/40",
            green: "fill-green-500/20 hover:fill-green-500/40",
            default: "fill-gray-500/20 hover:fill-gray-500/40"
        };

        // 3. DEFINE STROKES (Borders)
        const strokeStyles = {
            blue: "stroke-blue-600",
            red: "stroke-red-600",
            green: "stroke-green-600",
            default: "stroke-gray-600"
        };

        // --- APPLY FILL ---
        if (isSelected) {
            classes += (selectedFills[colorType] || selectedFills.default) + " ";
        } else {
            classes += (idleFills[colorType] || idleFills.default) + " ";
        }

        // --- APPLY STROKE & GLOW ---
        if (count > 0) {
            // HEATMAP ACTIVE (Red Glow)
            if (count <= 2) {
                classes += "drop-shadow-[0_0_5px_rgba(248,113,113,1)] animate-pulse ";
            } else if (count <= 5) {
                classes += "drop-shadow-[0_0_15px_rgba(220,38,38,1)] animate-pulse ";
            } else {
                classes += "drop-shadow-[0_0_30px_rgba(220,38,38,1)] animate-pulse ";
            }

            // If selected, OVERRIDE the Red Border with the Identity Border (Thick)
            // But keep the Red Glow (drop-shadow)
            if (isSelected) {
                classes += `${strokeStyles[colorType] || strokeStyles.default} stroke-[2px] `;
            }

        } else {
            // IDLE STATE (No Complaints)
            if (isSelected) {
                classes += `${strokeStyles[colorType] || strokeStyles.default} stroke-[2px] `;
            } else {
                classes += `${strokeStyles[colorType] || strokeStyles.default} stroke-[1px] `;
            }
        }

        return classes;
    };

    // ... (Zoom/Center effects remain unchanged) ...
    useEffect(() => {
        setTimeout(() => {
            if (transformComponentRef.current) transformComponentRef.current.centerView(0.4, 0);
        }, 100);
    }, []);

    useEffect(() => {
        if (!isPanelOpen && transformComponentRef.current) {
            const { centerView } = transformComponentRef.current;
            setTimeout(() => centerView(0.4, 800, "easeOutQuad"), 600);
        }
    }, [isPanelOpen]);

    const handleRoomClick = (room) => {
        if (onRoomSelect) onRoomSelect(room);
        const delay = isPanelOpen ? 0 : 550;
        if (transformComponentRef.current) {
            const { zoomToElement } = transformComponentRef.current;
            setTimeout(() => zoomToElement(room.id, 3, 800, "easeOutQuad"), delay);
        }
    };

    return (
        <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">

            <div className="absolute top-6 z-50 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-xl border border-gray-200 flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                <div>
                    <h1 className="font-bold text-gray-800 text-sm">3rd Floor Map</h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        Heatmap: Red Glow = Active Issues
                    </p>
                </div>
            </div>

            <TransformWrapper
                initialScale={0.4}
                minScale={0.1}
                maxScale={6}
                centerOnInit={true}
                wheel={{ step: 0.1 }}
                limitToBounds={false}
                ref={transformComponentRef}
            >
                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                    <div style={{ width: `${MAP_WIDTH}px`, height: `${MAP_HEIGHT}px` }} className="relative bg-white shadow-2xl">
                        <img src="/Floor3.jpg" alt="Campus Map" className="w-full h-full object-contain pointer-events-none select-none" />

                        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="absolute top-0 left-0 w-full h-full">
                            {rooms.map((room) => {
                                const isSelected = isPanelOpen && selectedRoomId === room.id;
                                return (
                                    <rect
                                        key={room.id}
                                        id={room.id}
                                        onClick={() => handleRoomClick(room)}
                                        x={room.x}
                                        y={room.y}
                                        width={room.width}
                                        height={room.height}
                                        className={getRoomStyle(room, isSelected)}
                                    />
                                );
                            })}
                        </svg>
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
};

export default FloorMap;