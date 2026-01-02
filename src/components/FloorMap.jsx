import React, { useRef, useEffect, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Info, Locate, Layers } from "lucide-react";
import { RoomData as fallbackData } from "../utils/RoomData";
import { getMapLayout, subscribeToHeatmap } from "../services/firestore";

const FloorMap = ({ onRoomSelect, isPanelOpen, selectedRoomId }) => {
    const MAP_WIDTH = 1549;
    const MAP_HEIGHT = 2200;

    const transformComponentRef = useRef(null);
    const [rooms, setRooms] = useState(fallbackData);
    const [ticketCounts, setTicketCounts] = useState({});

    const wasPanelOpen = useRef(isPanelOpen);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const dbRooms = await getMapLayout();
                if (dbRooms && dbRooms.length > 0) setRooms(dbRooms);
            } catch (error) {
                console.error("Using fallback map data");
            }
        };
        fetchRooms();
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeToHeatmap((counts) => setTicketCounts(counts));
        return () => unsubscribe();
    }, []);

    // === 1. REACTIVE ZOOM LOGIC ===
    useEffect(() => {
        if (selectedRoomId && transformComponentRef.current) {
            const { zoomToElement } = transformComponentRef.current;
            const isOpening = !wasPanelOpen.current && isPanelOpen;
            const delay = isOpening ? 550 : 0;

            setTimeout(() => {
                zoomToElement(selectedRoomId, 3, 800, "easeOutQuad");
            }, delay);
        }
        wasPanelOpen.current = isPanelOpen;
    }, [selectedRoomId, isPanelOpen]);

    // === 2. CENTER ON LOAD ===
    useEffect(() => {
        setTimeout(() => {
            if (transformComponentRef.current) transformComponentRef.current.centerView(0.4, 0);
        }, 100);
    }, []);

    // === 3. RESET ON CLOSE ===
    useEffect(() => {
        if (!isPanelOpen && transformComponentRef.current) {
            const { centerView } = transformComponentRef.current;
            setTimeout(() => centerView(0.4, 800, "easeOutQuad"), 600);
        }
    }, [isPanelOpen]);

    const handleResetView = () => {
        if (transformComponentRef.current) {
            transformComponentRef.current.centerView(0.4, 800, "easeOutQuad");
        }
    };

    const handleRoomClick = (room) => {
        if (onRoomSelect) onRoomSelect(room);
    };

    // ... (Keep existing getRoomStyle logic) ...
    const getRoomStyle = (room, isSelected) => {
        const count = ticketCounts[room.id] || 0;
        const colorType = room.color || "blue";

        let classes = "cursor-pointer transition-all duration-300 ease-in-out ";

        const selectedFills = {
            blue: "fill-[#abc9fe]",
            red: "fill-[#fba1a4]",
            green: "fill-[#98e7b9]",
            default: "fill-gray-500/60",
        };

        const idleFills = {
            blue: "fill-[#d5e5ff] hover:fill-[#bbd6ff]",
            red: "fill-[#fed5d7] hover:fill-[#ffc2c5]",
            green: "fill-[#ccf4dc] hover:fill-[#b2eecb]",
            default: "fill-gray-500/20 hover:fill-gray-500/40",
        };

        const strokeStyles = {
            blue: "stroke-blue-600",
            red: "stroke-red-600",
            green: "stroke-green-600",
            default: "stroke-gray-600",
        };

        if (isSelected) {
            classes += (selectedFills[colorType] || selectedFills.default) + " ";
        } else {
            classes += (idleFills[colorType] || idleFills.default) + " ";
        }

        if (count > 0 && !isSelected) {
            classes += "animate-selection-glow ";
            // Simplified glow logic for class string
            if (count <= 2) {
                classes += "[--glow-intensity:10px] [--glow-color:rgba(248,113,113,0.7)] ";
            } else if (count <= 5) {
                classes += "[--glow-intensity:22px] [--glow-color:rgba(239,68,68,0.8)] ";
            } else {
                classes += "[--glow-intensity:40px] [--glow-color:rgba(185,28,28,1)] ";
            }
            classes += `${strokeStyles[colorType] || strokeStyles.default} stroke-[1px] `;
        } else {
            if (isSelected) {
                classes += `${strokeStyles[colorType] || strokeStyles.default} stroke-[2px] `;
            } else {
                classes += `${strokeStyles[colorType] || strokeStyles.default} stroke-[1px] `;
            }
        }

        return classes;
    };

    const splitText = (text) => {
        if (!text) return [];
        const words = text.split(" ");
        const lines = [];
        for (let i = 0; i < words.length; i++) {
            lines.push(words.slice(i, i + 1).join(" "));
        }
        return lines;
    };

    return (
        <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">

            {/* 1. INFO BADGE (Top Center) */}
            <div className="absolute top-6 z-50 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-xl border border-gray-200 flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                <div>
                    <h1 className="font-bold text-gray-800 text-sm">3rd Floor Map</h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        Real-time Infrastructure Monitoring
                    </p>
                </div>
            </div>

            {/* 2. LEGEND (Bottom Left - Hides on Panel Open) */}
            <div className={`absolute bottom-6 left-6 z-50 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-gray-200 transition-all duration-500 ease-in-out transform
                ${isPanelOpen ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100"}
            `}>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                    <Layers size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Map Legend</span>
                </div>

                <div className="space-y-2.5">
                    {/* Active Complaints (Glow Effect) */}
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-md border border-red-500 bg-red-100 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse"></div>
                        <span className="text-xs font-bold text-gray-700">Active Complaints</span>
                    </div>

                    {/* Room Colors */}
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-md bg-[#d5e5ff] border border-blue-400"></div>
                        <span className="text-xs text-gray-600">Labs & Depts</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-md bg-[#ccf4dc] border border-green-400"></div>
                        <span className="text-xs text-gray-600">Classrooms</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-md bg-[#fed5d7] border border-red-400"></div>
                        <span className="text-xs text-gray-600">Restricted / Staff</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-md bg-gray-200 border border-gray-400"></div>
                        <span className="text-xs text-gray-600">Common Areas</span>
                    </div>
                </div>
            </div>

            {/* 3. RE-CENTER BUTTON (Bottom Right - Hides on Panel Open) */}
            <button
                onClick={handleResetView}
                className={`absolute bottom-6 right-6 z-50 p-3 bg-white hover:bg-gray-100 text-gray-700 rounded-full shadow-xl border border-gray-200 transition-all duration-500 ease-in-out transform hover:scale-110 active:scale-95
                    ${isPanelOpen ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}
                `}
                title="Reset Map View"
            >
                <Locate size={24} />
            </button>

            {/* 4. MAP CANVAS */}
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
                    <div
                        style={{ width: `${MAP_WIDTH}px`, height: `${MAP_HEIGHT}px` }}
                        className="relative bg-white shadow-2xl"
                    >
                        <img
                            src="/Floorplan.jpg"
                            alt="Campus Map"
                            className="w-full h-full object-contain pointer-events-none select-none"
                        />

                        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="absolute top-0 left-0 w-full h-full">
                            {rooms.map((room) => {
                                const isSelected = isPanelOpen && selectedRoomId === room.id;
                                const centerX = room.x + room.width / 2;
                                const centerY = room.y + room.height / 2;
                                const labelText = room.label || room.id;
                                const lines = splitText(labelText);
                                const lineHeight = 24;

                                return (
                                    <g key={room.id}>
                                        <rect
                                            id={room.id}
                                            onClick={() => handleRoomClick(room)}
                                            x={room.x}
                                            y={room.y}
                                            width={room.width}
                                            height={room.height}
                                            className={getRoomStyle(room, isSelected)}
                                        />
                                        <text
                                            x={centerX}
                                            y={centerY - ((lines.length - 1) * lineHeight) / 2}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="pointer-events-none select-none fill-slate-800 font-bold opacity-75"
                                            style={{
                                                fontSize: "20px",
                                                textShadow: "0px 0px 4px rgba(255,255,255,0.8)",
                                            }}
                                        >
                                            {lines.map((line, index) => (
                                                <tspan
                                                    key={index}
                                                    x={centerX}
                                                    dy={index === 0 ? 0 : lineHeight}
                                                >
                                                    {line}
                                                </tspan>
                                            ))}
                                        </text>
                                    </g>
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