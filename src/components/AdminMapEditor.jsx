import React, { useState } from "react";
import { Rnd } from "react-rnd";
import { Plus, Trash2, Copy, Save } from "lucide-react";
import { RoomData as initialData } from "../utils/RoomData";

const AdminMapEditor = () => {
    const MAP_WIDTH = 1549;
    const MAP_HEIGHT = 2200;

    // State
    const [rects, setRects] = useState(initialData); // Start with existing data
    const [selectedId, setSelectedId] = useState(null);

    // Helper to find selected rect
    const selectedRect = rects.find((r) => r.id === selectedId);

    // 1. ADD NEW ROOM
    const addRoom = () => {
        const newId = `room-${Date.now()}`;
        const newRoom = {
            id: newId,
            label: "New Room",
            x: 100,
            y: 100,
            width: 150,
            height: 100,
            color: "blue",
        };
        setRects([...rects, newRoom]);
        setSelectedId(newId);
    };

    // 2. UPDATE POSITION/SIZE (On Drag/Resize Stop)
    const handleUpdate = (id, d) => {
        setRects(rects.map((r) => (r.id === id ? { ...r, ...d } : r)));
    };

    // 3. UPDATE METADATA (Label, ID, Color)
    const handleMetaUpdate = (key, value) => {
        setRects(rects.map((r) => (r.id === selectedId ? { ...r, [key]: value } : r)));
    };

    // 4. DELETE ROOM
    const deleteRoom = () => {
        setRects(rects.filter((r) => r.id !== selectedId));
        setSelectedId(null);
    };

    // 5. EXPORT DATA
    const copyToClipboard = () => {
        // Format it nicely as a JS array string
        const output = `export const roomData = ${JSON.stringify(rects, null, 2)};`;
        navigator.clipboard.writeText(output);
        alert("Copied to clipboard! Now paste it into src/utils/roomData.js");
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
            {/* SIDEBAR CONTROLS */}
            <div className="w-80 bg-white shadow-xl z-20 flex flex-col border-r border-gray-200">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-bold text-lg text-gray-800">Map Editor</h2>
                    <p className="text-xs text-gray-500">Visual Room Builder</p>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="space-y-4">
                        <button
                            onClick={addRoom}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center gap-2 font-medium transition-colors"
                        >
                            <Plus size={16} /> Add Room
                        </button>

                        {selectedId ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                                <h3 className="text-xs font-bold text-gray-400 uppercase">Edit Selected</h3>

                                <div>
                                    <label className="text-xs font-bold text-gray-700">ID (Database Key)</label>
                                    <input
                                        className="w-full p-1 border rounded text-sm"
                                        value={selectedRect.id}
                                        onChange={(e) => handleMetaUpdate("id", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700">Label (Display Name)</label>
                                    <input
                                        className="w-full p-1 border rounded text-sm"
                                        value={selectedRect.label}
                                        onChange={(e) => handleMetaUpdate("label", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700">Color Status</label>
                                    <select
                                        className="w-full p-1 border rounded text-sm"
                                        value={selectedRect.color || "blue"}
                                        onChange={(e) => handleMetaUpdate("color", e.target.value)}
                                    >
                                        <option value="blue">Blue (Lab/Hall)</option>
                                        <option value="red">Red (Classroom)</option>
                                        <option value="green">Green (Utility)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                    <div>X: {Math.round(selectedRect.x)}</div>
                                    <div>Y: {Math.round(selectedRect.y)}</div>
                                    <div>W: {Math.round(selectedRect.width)}</div>
                                    <div>H: {Math.round(selectedRect.height)}</div>
                                </div>

                                <button
                                    onClick={deleteRoom}
                                    className="w-full py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded flex items-center justify-center gap-1 text-xs font-bold"
                                >
                                    <Trash2 size={12} /> Delete Room
                                </button>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 text-sm py-10">
                                Select a room on the map to edit properties.
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={copyToClipboard}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded font-bold shadow-lg flex items-center justify-center gap-2"
                    >
                        <Copy size={18} /> Copy Array Code
                    </button>
                </div>
            </div>

            {/* MAP CANVAS (SCROLLABLE) */}
            <div className="flex-1 overflow-auto relative bg-gray-500 p-10 cursor-crosshair">
                <div className="relative bg-white shadow-2xl mx-auto" style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}>
                    {/* BACKGROUND IMAGE */}
                    <img
                        src="tf_floor_plan_1.jpg"
                        className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50 select-none"
                        alt="Reference"
                    />

                    {/* RND BOXES */}
                    {rects.map((room) => (
                        <Rnd
                            key={room.id}
                            size={{ width: room.width, height: room.height }}
                            position={{ x: room.x, y: room.y }}
                            bounds="parent"
                            onDragStop={(e, d) => handleUpdate(room.id, { x: d.x, y: d.y })}
                            onResizeStop={(e, direction, ref, delta, position) => {
                                handleUpdate(room.id, {
                                    width: parseInt(ref.style.width),
                                    height: parseInt(ref.style.height),
                                    ...position,
                                });
                            }}
                            onClick={() => setSelectedId(room.id)}
                            className={`
                border-2 
                ${selectedId === room.id ? "border-blue-600 bg-blue-500/30 z-50" : "border-red-500 bg-red-500/20"}
                flex items-center justify-center group
              `}
                        >
                            {/* Show Label inside box */}
                            <span className="text-[10px] font-bold text-black bg-white/70 px-1 rounded pointer-events-none truncate max-w-full">
                                {room.label || room.id}
                            </span>
                        </Rnd>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminMapEditor;
