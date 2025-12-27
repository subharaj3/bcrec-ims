import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "../services/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Login Function
    const login = () => {
        return signInWithPopup(auth, googleProvider);
    };

    // Logout Function
    const logout = () => {
        return signOut(auth);
    };

    // Check if user is logged in automatically
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            console.log("User status changed:", currentUser);
        });
        return () => unsubscribe();
    }, []);

    const value = { user, login, logout, loading };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// Custom Hook for easy access
export const useAuth = () => useContext(AuthContext);
