import { useState } from "react";
import FloorMap from "./components/FoorMap";
import TicketModal from './components/TicketModal';
// import AdminMapEditor from "./components/AdminMapEditor";
import { useAuth } from "./context/AuthContext";

function App() {
    const { user, login, logout } = useAuth();
    const [selectedRoom, setSelectedRoom] = useState(null);
    const handleRoomClick = (roomData) => {
        setSelectedRoom(roomData);
    };
    // const isEditing = true;

    return (
        <div className="relative font-sans text-gray-900">
        
        {/* Auth */}
        <div className="absolute top-4 right-4 z-50">
            {user ? (
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg border border-gray-200">
                <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full" />
                <div className="pr-2">
                <p className="text-xs font-bold leading-none">{user.displayName}</p>
                <button onClick={logout} className="text-[10px] text-red-500 font-semibold hover:underline">Sign Out</button>
                </div>
            </div>
            ) : (
            <button 
                onClick={login}
                className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm hover:bg-blue-700 transition transform hover:scale-105"
            >
                Sign in with Google
            </button>
            )}
        </div>

        {/* The Map */}
        <FloorMap onRoomSelect={handleRoomClick} /> 

        {/* The Modal */}
        {selectedRoom && (
            <TicketModal 
            room={selectedRoom} 
            onClose={() => setSelectedRoom(null)} 
            />
        )}
        </div>
    );
}

export default App;
