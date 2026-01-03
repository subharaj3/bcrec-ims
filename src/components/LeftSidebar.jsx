import React from "react";
import { Layers, Locate, Settings } from "lucide-react";

const LeftSidebar = ({
    onToggleLegend,
    isLegendOpen,
    onCenterMap,
    onAdminClick,
    isAdmin,
    isAdminMode
}) => {
    return (
        // CHANGED: Wider sidebar, stronger shadow, z-index fix
        <div className="w-[80px] h-full bg-white border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.08)] z-[60] flex flex-col justify-between items-center py-8 fixed left-0 top-0">

            {/* TOP: Legend Toggle */}
            <div className="relative group">
                <button
                    onClick={onToggleLegend}
                    // CHANGED: Defined border and shadow for default state
                    className={`p-3.5 rounded-2xl border-2 transition-all duration-300 ${isLegendOpen
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:shadow-md"
                        }`}
                >
                    <Layers size={24} />
                </button>
                <span className="absolute left-20 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    Map Legend
                </span>
            </div>

            {/* BOTTOM: Map Controls */}
            <div className="flex flex-col gap-5 mb-2">

                {isAdmin && (
                    <div className="relative group">
                        <button
                            onClick={onAdminClick}
                            className={`p-3.5 rounded-2xl border-2 transition-all duration-300 ${isAdminMode
                                ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-200"
                                : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-800 hover:text-gray-800 hover:shadow-md"
                                }`}
                        >
                            <Settings size={24} />
                        </button>
                        <span className="absolute left-20 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                            {isAdminMode ? "Exit Editor" : "Map Editor"}
                        </span>
                    </div>
                )}

                <div className="relative group">
                    <button
                        onClick={onCenterMap}
                        className="p-3.5 bg-gray-50 border-2 border-gray-200 text-gray-500 rounded-2xl hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 active:scale-95"
                    >
                        <Locate size={24} />
                    </button>
                    <span className="absolute left-20 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                        Reset View
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LeftSidebar;