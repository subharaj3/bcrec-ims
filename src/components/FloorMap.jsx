import React, { useRef, useEffect, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Info } from "lucide-react";
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

    const handleRoomClick = (room) => {
        if (onRoomSelect) onRoomSelect(room);
    };

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
            // Apply our custom CSS animation class
            classes += "animate-selection-glow ";

            // Set intensity and color variables based on complaint count
            if (count <= 2) {
                // Low intensity: Soft Red
                classes += "[--glow-intensity:10px] [--glow-color:rgba(248,113,113,0.7)] ";
            } else if (count <= 5) {
                // Mid intensity: Bright Red
                classes += "[--glow-intensity:22px] [--glow-color:rgba(239,68,68,0.8)] ";
            } else {
                // High intensity: Deep Red
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

    // Helper to split text into lines (max 2 words per line)
    const splitText = (text) => {
        if (!text) return [];
        const words = text.split(" ");
        const lines = [];
        // Group every word into a line
        for (let i = 0; i < words.length; i++) {
            lines.push(words.slice(i, i + 1).join(" "));
        }
        return lines;
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

                                // Text Calculation
                                const centerX = room.x + room.width / 2;
                                const centerY = room.y + room.height / 2;
                                const labelText = room.label || room.id;
                                const lines = splitText(labelText);
                                const lineHeight = 24; // Space between lines

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

                                        {/* Multi-line Text Block */}
                                        <text
                                            x={centerX}
                                            // Adjust Y up based on number of lines to keep the BLOCK centered
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
                                                    dy={index === 0 ? 0 : lineHeight} // Only add offset to lines after the first
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
