import React, { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Info } from "lucide-react";
import { RoomData } from "../utils/RoomData";

const FloorMap = ({ onRoomSelect }) => {
    const MAP_WIDTH = 1549;
    const MAP_HEIGHT = 2200;

    const [activeRoom, setActiveRoom] = useState(null);

    const handleRoomClick = (room) => {
        console.log("Clicked:", room.label);
        // setActiveRoom(room.id);
        // alert(`You clicked: ${room.label}`);
        if (onRoomSelect) {
            onRoomSelect(room);
        }
    };

    return (
        <div className="w-full h-screen bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Header Overlay */}
            <div className="absolute top-6 z-50 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-xl border border-gray-200 flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                <div>
                    <h1 className="font-bold text-gray-800 text-sm">Computer Science Building - Third Floor</h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Scroll to Zoom • Drag to Pan</p>
                </div>
            </div>

            <TransformWrapper
                initialScale={0.4}
                minScale={0.1} // FIX 1: Allow zooming way out
                maxScale={4}
                centerOnInit={true}
                wheel={{ step: 0.1 }}
                limitToBounds={false} // FIX 2: THIS IS THE MAGIC KEY! It removes the "invisible walls"
            >
                <TransformComponent
                    // FIX 3: Force the wrapper to be full screen so centering works
                    wrapperStyle={{ width: "100%", height: "100%" }}
                >
                    <div
                        style={{ width: `${MAP_WIDTH}px`, height: `${MAP_HEIGHT}px` }}
                        className="relative bg-white shadow-2xl"
                    >
                        <img
                            src="/tf_floor_plan_1.jpg"
                            alt="Campus Map"
                            className="w-full h-full object-contain pointer-events-none select-none"
                        />

                        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="absolute top-0 left-0 w-full h-full">
                            {RoomData.map((room) => (
                                <rect
                                    key={room.id}
                                    id={room.id}
                                    x={room.x}
                                    y={room.y}
                                    width={room.width}
                                    height={room.height}
                                    className={`
                    opacity-20 hover:opacity-50 cursor-pointer transition-all duration-200
                    ${room.color === "red" ? "fill-red-500 hover:stroke-red-600" : ""}
                    ${room.color === "blue" ? "fill-blue-500 hover:stroke-blue-600" : ""}
                    ${room.color === "green" ? "fill-green-500 hover:stroke-green-600" : ""}
                    ${!room.color ? "fill-gray-500" : ""}
                  `}
                                    onClick={() => handleRoomClick(room)}
                                />
                            ))}
                        </svg>
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
};

export default FloorMap;
