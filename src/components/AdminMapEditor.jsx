import React, { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import { Plus, Trash2, Save, Copy, Loader2 } from "lucide-react";
import { RoomData as fallbackData } from "../utils/RoomData";
import { saveMapLayout, getMapLayout } from "../services/firestore";

const AdminMapEditor = () => {
    const MAP_WIDTH = 1549;
    const MAP_HEIGHT = 2200;

    // State
    const [rects, setRects] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // FETCH DATA ON MOUNT
    useEffect(() => {
        const loadData = async () => {
            const dbRooms = await getMapLayout();
            if (dbRooms && dbRooms.length > 0) {
                setRects(dbRooms);
            } else {
                setRects(fallbackData);
            }
            setLoading(false);
        };
        loadData();
    }, []);

    const selectedRect = rects.find((r) => r.id === selectedId);

    // SAVE TO FIREBASE
    const handleSave = async () => {
        setSaving(true);
        try {
            await saveMapLayout(rects);
            alert("✅ Map Layout Updated in Database!");
        } catch (error) {
            alert("❌ Failed to save map. Check console.");
        } finally {
            setSaving(false);
        }
    };

    // COPY TO CLIPBOARD (Backup Feature)
    const copyToClipboard = () => {
        const output = `export const RoomData = ${JSON.stringify(rects, null, 2)};`;
        navigator.clipboard.writeText(output);
        alert("📋 Copied Array to Clipboard! Paste this into src/utils/RoomData.js");
    };

    // --- STANDARD EDITOR FUNCTIONS ---
    const addRoom = () => {
        const newId = `room-${Date.now()}`;
        const newRoom = {
            id: newId.toLowerCase(), // 1. Force Lowercase on Creation
            label: "New Room",
            x: 100,
            y: 100,
            width: 150,
            height: 100,
            color: "blue",
        };
        setRects([...rects, newRoom]);
        setSelectedId(newRoom.id);
    };

    const handleUpdate = (id, d) => {
        setRects(rects.map((r) => (r.id === id ? { ...r, ...d } : r)));
    };

    const handleMetaUpdate = (key, value) => {
        // 2. Force Lowercase on Manual Input
        const finalValue = key === "id" ? value.toLowerCase().trim() : value;

        setRects(rects.map((r) => (r.id === selectedId ? { ...r, [key]: finalValue } : r)));

        // If ID changed, update selection tracking
        if (key === "id") {
            setSelectedId(finalValue);
        }
    };

    const deleteRoom = () => {
        setRects(rects.filter((r) => r.id !== selectedId));
        setSelectedId(null);
    };

    if (loading)
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin" /> Loading Map Data...
            </div>
        );

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
            {/* SIDEBAR */}
            <div className="w-80 bg-white shadow-xl z-20 flex flex-col border-r border-gray-200">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-bold text-lg text-gray-800">Map Editor</h2>
                    <p className="text-xs text-green-600 font-semibold">Connected to Firestore</p>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="space-y-4">
                        <button
                            onClick={addRoom}
                            className="w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded flex items-center justify-center gap-2 font-bold transition-colors"
                        >
                            <Plus size={16} /> Add Room
                        </button>

                        {selectedRect ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 animate-fade-in">
                                <h3 className="text-xs font-bold text-gray-400 uppercase">Edit Properties</h3>

                                <div>
                                    <label className="text-xs font-bold text-gray-700">ID (Unique)</label>
                                    <input
                                        className="w-full p-1 border rounded text-sm font-mono"
                                        value={selectedRect.id}
                                        onChange={(e) => handleMetaUpdate("id", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700">Label (Visible)</label>
                                    <input
                                        className="w-full p-1 border rounded text-sm"
                                        value={selectedRect.label}
                                        onChange={(e) => handleMetaUpdate("label", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700">Color Type</label>
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

                                <button
                                    onClick={deleteRoom}
                                    className="w-full py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded flex items-center justify-center gap-1 text-xs font-bold mt-2"
                                >
                                    <Trash2 size={12} /> Delete
                                </button>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 text-xs py-10 italic">
                                Select a room to edit details.
                            </div>
                        )}
                    </div>
                </div>

                {/* SAVE & COPY AREA */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                        {saving ? "Saving..." : "Update Live Map"}
                    </button>

                    <button
                        onClick={copyToClipboard}
                        className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                    >
                        <Copy size={14} /> Copy Code for Backup
                    </button>
                </div>
            </div>

            {/* MAP CANVAS */}
            <div className="flex-1 overflow-auto relative bg-gray-500 p-10 cursor-crosshair">
                <div className="relative bg-white shadow-2xl mx-auto" style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}>
                    <img
                        src="/Floorplan.jpg"
                        className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50 select-none"
                        alt="Reference"
                    />

                    {rects.map((room) => (
                        <Rnd
                            key={room.id}
                            size={{ width: room.width, height: room.height }}
                            position={{ x: room.x, y: room.y }}
                            bounds="parent"
                            onDragStop={(e, d) => handleUpdate(room.id, { x: d.x, y: d.y })}
                            onResizeStop={(e, dir, ref, delta, pos) =>
                                handleUpdate(room.id, {
                                    width: parseInt(ref.style.width),
                                    height: parseInt(ref.style.height),
                                    ...pos,
                                })
                            }
                            onClick={() => setSelectedId(room.id)}
                            className={`border-2 flex items-center justify-center group ${
                                selectedId === room.id
                                    ? "border-blue-600 bg-blue-500/30 z-50"
                                    : "border-red-500 bg-red-500/20"
                            }`}
                        >
                            <span className="text-[10px] font-bold text-black bg-white/80 px-1 rounded pointer-events-none truncate max-w-full">
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
