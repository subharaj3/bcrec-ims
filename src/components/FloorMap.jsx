import React, { useState, useRef, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Info } from "lucide-react";
import { RoomData as fallbackData } from "../utils/RoomData";
import { getMapLayout } from "../services/firestore";

const FloorMap = ({ onRoomSelect, isPanelOpen, selectedRoomId }) => {
    const MAP_WIDTH = 1549;
    const MAP_HEIGHT = 2200;

    const transformComponentRef = useRef(null);

    // STATE: Holds the list of rooms (either from DB or Local File)
    const [rooms, setRooms] = useState(fallbackData);

    // 1. FETCH DATA ON LOAD
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const dbRooms = await getMapLayout();
                if (dbRooms && dbRooms.length > 0) {
                    console.log("Loaded map from Firestore...");
                    setRooms(dbRooms);
                }
            } catch (error) {
                console.error("Failed to load map from DB, using fallback.");
            }
        };
        fetchRooms();
    }, []);

    // 2. FIX INITIAL LOAD CENTERING
    // We force a centerView calculation at scale 0.4 (your initial scale)
    // This ensures it is perfectly centered on the full screen on load.
    useEffect(() => {
        setTimeout(() => {
            if (transformComponentRef.current) {
                // centerView(scale, duration, animationType)
                transformComponentRef.current.centerView(0.4, 0);
            }
        }, 100);
    }, []);

    // 2. LISTEN FOR PANEL CLOSING (Zoom Out Fix)
    useEffect(() => {
        if (!isPanelOpen && transformComponentRef.current) {
            const { centerView } = transformComponentRef.current; // <--- Changed from resetTransform

            // Wait for the width animation to finish (600ms)
            setTimeout(() => {
                // Recalculate the center based on the NEW 100vw width and move there.
                // Scale 0.4 (Default), Duration 800ms
                centerView(0.4, 800, "easeOutQuad");
            }, 600);
        }
    }, [isPanelOpen]);

    const handleRoomClick = (room) => {
        if (onRoomSelect) onRoomSelect(room);

        // Zoom Logic for Opening
        const delay = isPanelOpen ? 0 : 550;

        if (transformComponentRef.current) {
            const { zoomToElement } = transformComponentRef.current;
            setTimeout(() => {
                zoomToElement(room.id, 3, 800, "easeOutQuad");
            }, delay);
        }
    };

    return (
        <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Header Info Overlay */}
            <div className="absolute top-6 z-50 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-xl border border-gray-200 flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                <div>
                    <h1 className="font-bold text-gray-800 text-sm">Campus Map</h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Scroll to Zoom • Drag to Pan</p>
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
                        {/* Layer 1: The Image */}
                        <img
                            src="/Floor3.jpg"
                            alt="Campus Map"
                            className="w-full h-full object-contain pointer-events-none select-none"
                        />

                        {/* Layer 2: The Interactive SVG Overlay */}
                        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="absolute top-0 left-0 w-full h-full">
                            {rooms.map((room) => {
                                const isSelected = selectedRoomId === room.id;

                                return (
                                    <rect
                                        key={room.id}
                                        id={room.id} // Important for zoomToElement
                                        onClick={() => handleRoomClick(room)}
                                        x={room.x}
                                        y={room.y}
                                        width={room.width}
                                        height={room.height}
                                        className={`
                      cursor-pointer transition-all duration-300
                      ${isSelected ? "fill-blue-500/40 stroke-blue-600 stroke-4" : "opacity-20 hover:opacity-50"}
                      ${!isSelected && room.color === "red" ? "fill-red-500 hover:stroke-red-600" : ""}
                      ${!isSelected && room.color === "blue" ? "fill-blue-500 hover:stroke-blue-600" : ""}
                      ${!isSelected && room.color === "green" ? "fill-green-500 hover:stroke-green-600" : ""}
                      ${!isSelected && !room.color ? "fill-gray-500" : ""}
                    `}
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
