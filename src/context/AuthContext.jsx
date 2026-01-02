import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, db } from "../services/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Auth User (Google)
    const [userData, setUserData] = useState(null); // DB User (Firestore Data)
    const [loading, setLoading] = useState(true);

    // SYNC USER WITH FIRESTORE
    const syncUserWithDb = async (currentUser) => {
        if (!currentUser) {
            setUserData(null);
            return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();

            // === NEW: BAN CHECK ===
            if (data.isBanned) {
                alert("🚫 ACCOUNT BANNED: Your Karma has dropped to 0 due to fake reports.");
                await signOut(auth);
                setUser(null);
                setUserData(null);
                return;
            }

            setUserData(data);
        } else {
            // New User -> Create default doc
            const newUserData = {
                uid: currentUser.uid,
                email: currentUser.email,
                name: currentUser.displayName,
                photoURL: currentUser.photoURL,
                role: "student",
                isProfileComplete: false,
                createdAt: new Date(),
                karma: 100,
                isBanned: false
            };
            await setDoc(userRef, newUserData);
            setUserData(newUserData);
        }
    };

    // FUNCTION TO COMPLETE PROFILE
    const completeProfile = async (profileData) => {
        if (!user) return;

        const updates = {
            ...profileData, // rollNumber, course, stream
            isProfileComplete: true,
        };

        // Update DB
        await updateDoc(doc(db, "users", user.uid), updates);

        // Update Local State (Instant UI update)
        setUserData((prev) => ({ ...prev, ...updates }));
    };

    const login = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const logout = async () => {
        setUserData(null);
        await signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            await syncUserWithDb(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const value = {
        user,
        userData, // Contains role, rollNumber, isProfileComplete
        login,
        logout,
        completeProfile, // Export this so the form can use it
        loading,
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
