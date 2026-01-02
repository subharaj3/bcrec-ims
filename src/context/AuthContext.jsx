import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, db } from "../services/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"; // Added query imports

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const syncUserWithDb = async (currentUser) => {
        if (!currentUser) {
            setUserData(null);
            return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.isBanned) {
                alert("Your account has been banned due to low karma.");
                await signOut(auth);
                setUser(null);
                setUserData(null);
                return;
            }
            setUserData(data);
        } else {
            const newUserData = {
                uid: currentUser.uid,
                email: currentUser.email,
                name: currentUser.displayName,
                photoURL: currentUser.photoURL,
                role: "student",
                karma: 100,
                isProfileComplete: false,
                isBanned: false,
                createdAt: new Date(),
            };
            await setDoc(userRef, newUserData);
            setUserData(newUserData);
        }
    };

    // === UPDATED: COMPLETE PROFILE WITH UNIQUENESS CHECK ===
    const completeProfile = async (profileData) => {
        if (!user) return;

        // 1. CHECK FOR DUPLICATE ROLL NUMBER
        // Query users where rollNumber matches the input
        const q = query(collection(db, "users"), where("rollNumber", "==", profileData.rollNumber.trim()));

        const querySnapshot = await getDocs(q);

        // If we find a doc, check if it belongs to someone else
        const duplicateUser = querySnapshot.docs.find((doc) => doc.id !== user.uid);

        if (duplicateUser) {
            throw new Error("ROLL_NUMBER_TAKEN"); // Throw specific error
        }

        // 2. PROCEED IF UNIQUE
        const updates = {
            ...profileData,
            isProfileComplete: true,
        };

        await updateDoc(doc(db, "users", user.uid), updates);

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

    const value = { user, userData, login, logout, completeProfile, loading };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
