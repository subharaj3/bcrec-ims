import { useState } from "react";
import FloorMap from "./components/FoorMap";
import AdminMapEditor from "./components/AdminMapEditor";
import { useAuth } from "./context/AuthContext";

function App() {
    // === MODE SWITCH ===
    // Set this to TRUE to build the map
    // Set this to FALSE to view the result
    const { user, login, logout } = useAuth();
    const isEditing = false;

    return (
        <div className="relative">
            {/* AUTH OVERLAY: Top Right Corner */}
            <div className="absolute top-4 right-4 z-50">
                {user ? (
                    <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-lg">
                        <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full" />
                        <div className="text-xs">
                            <p className="font-bold">{user.displayName}</p>
                            <button onClick={logout} className="text-red-500 hover:underline">
                                Sign Out
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={login}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow-lg font-bold hover:bg-blue-700 transition"
                    >
                        Sign in with Google
                    </button>
                )}
            </div>

            <FloorMap />
        </div>
    );
}

export default App;
