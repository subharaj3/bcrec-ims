import { useState } from "react";
import FloorMap from "./components/FoorMap";
import AdminMapEditor from "./components/AdminMapEditor";

function App() {
    // === MODE SWITCH ===
    // Set this to TRUE to build the map
    // Set this to FALSE to view the result
    const isEditing = false;

    return <>{isEditing ? <AdminMapEditor /> : <FloorMap />}</>;
}

export default App;
