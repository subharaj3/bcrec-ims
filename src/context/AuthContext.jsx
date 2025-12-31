import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, db } from "../services/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    // Create/Fetch User Document
    const handleUserRole = async (currentUser) => {
        if (!currentUser) {
            setRole(null);
            return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            // User exists, get their role
            setRole(userSnap.data().role);
        } else {
            // New user! Create them as "student"
            const defaultRole = "student";
            await setDoc(userRef, {
                email: currentUser.email,
                role: defaultRole,
                createdAt: new Date(),
                name: currentUser.displayName,
                photoURL: currentUser.photoURL,
            });
            setRole(defaultRole);
        }
    };

    // Login Function
    const login = async () => {
        const result = await signInWithPopup(auth, googleProvider);
    };

    // Logout Function
    const logout = () => {
        setRole(null);
        return signOut(auth);
    };

    // Check if user is logged in automatically
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await handleUserRole(currentUser);
            } else {
                setRole(null);
            }
            setLoading(false);
            console.log("User status changed:", currentUser);
        });
        return () => unsubscribe();
    }, []);

    const value = { user, role, login, logout, loading };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// Custom Hook for easy access
export const useAuth = () => useContext(AuthContext);
