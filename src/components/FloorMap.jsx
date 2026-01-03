import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { RoomData as fallbackData } from "../utils/RoomData";
import { getMapLayout, subscribeToHeatmap } from "../services/firestore";

const FloorMap = forwardRef(({ onRoomSelect, isPanelOpen, selectedRoomId }, ref) => {
    const MAP_WIDTH = 1549;
    const MAP_HEIGHT = 2200;
    const INITIAL_SCALE = 0.4;

    const transformComponentRef = useRef(null);
    const [rooms, setRooms] = useState(fallbackData);
    const [ticketCounts, setTicketCounts] = useState({});
    const wasPanelOpen = useRef(isPanelOpen);

    // === EXPOSE RESET FUNCTION (New Feature) ===
    useImperativeHandle(ref, () => ({
        resetView: () => {
            if (transformComponentRef.current) {
                // Use centerView to ensure map centers in the container
                const { centerView } = transformComponentRef.current;
                centerView(INITIAL_SCALE, 1000, "easeOutQuad");
            }
        },
    }));

    // 1. Fetch Room Coordinates
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

    // 2. Listen for Heatmap Data
    useEffect(() => {
        const unsubscribe = subscribeToHeatmap((counts) => {
            console.log("Setting ticket count");
            setTicketCounts(counts);
        });
        return () => unsubscribe();
    }, []);

    // 3. Zoom to Selected Room (New Feature: Logic)
    useEffect(() => {
        if (selectedRoomId && transformComponentRef.current) {
            const { zoomToElement } = transformComponentRef.current;
            const delay = !wasPanelOpen.current && isPanelOpen ? 600 : 0;

            setTimeout(() => {
                zoomToElement(selectedRoomId, 3, 800, "easeOutQuad");
            }, delay);
        }
        wasPanelOpen.current = isPanelOpen;
    }, [selectedRoomId, isPanelOpen]);

    // 4. Initial Center on Mount
    useEffect(() => {
        setTimeout(() => {
            if (transformComponentRef.current) transformComponentRef.current.centerView(INITIAL_SCALE, 0);
        }, 100);
    }, []);

    // === RESTORED STYLING LOGIC (From your uploaded file) ===
    const getRoomStyle = (room, isSelected) => {
        const normalizedId = room.id.toLowerCase().trim();
        const count = ticketCounts[normalizedId] || 0;
        console.log(normalizedId);
        const colorType = room.color || "blue";

        let classes = "cursor-pointer transition-all duration-300 ease-in-out ";

        // Specific Hex Colors
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

        // Fill Logic
        if (isSelected) {
            classes += (selectedFills[colorType] || selectedFills.default) + " ";
        } else {
            classes += (idleFills[colorType] || idleFills.default) + " ";
        }

        // Heatmap / Glow Logic
        if (count > 0 && !isSelected) {
            classes += "animate-selection-glow ";
            // Using your specific RGBA glow colors
            if (count <= 2) {
                classes += "[--glow-intensity:20px] [--glow-color:rgba(248,113,113,0.7)] ";
            } else if (count <= 5) {
                classes += "[--glow-intensity:60px] [--glow-color:rgba(239,68,68,0.8)] ";
            } else {
                classes += "[--glow-intensity:80px] [--glow-color:rgba(185,28,28,1)] ";
            }
            classes += `${strokeStyles[colorType] || strokeStyles.default} stroke-[1px] `;
        } else {
            // Default Stroke logic
            classes += `${strokeStyles[colorType] || strokeStyles.default} stroke-[${isSelected ? "2px" : "1px"}] `;
        }

        return classes;
    };

    const splitText = (text) => {
        if (!text) return [];
        const words = text.split(" ");
        const lines = [];
        for (let i = 0; i < words.length; i++) lines.push(words.slice(i, i + 1).join(" "));
        return lines;
    };

    return (
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
            <TransformWrapper
                initialScale={INITIAL_SCALE}
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
                        className="relative bg-[#101828] shadow-2xl rounded-sm"
                    >
                        {/* Map Image */}
                        <img
                            src="/Floorplan.jpg"
                            alt="Map"
                            className="w-full h-full object-contain pointer-events-none select-none"
                        />

                        {/* Interactive SVG Overlay */}
                        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="absolute top-0 left-0 w-full h-full">
                            {rooms.map((room) => {
                                const isSelected = isPanelOpen && selectedRoomId === room.id;
                                const centerX = room.x + room.width / 2;
                                const centerY = room.y + room.height / 2;
                                const lines = splitText(room.label || room.id);
                                const lineHeight = 24;

                                return (
                                    <g key={room.id}>
                                        <rect
                                            id={room.id} // New Feature: Required for Zoom
                                            onClick={() => onRoomSelect && onRoomSelect(room)}
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
                                                <tspan key={index} x={centerX} dy={index === 0 ? 0 : lineHeight}>
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
});

export default FloorMap;
