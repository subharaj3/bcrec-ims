import { db } from "./firebase";
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    updateDoc,
    doc,
    getDoc,
    setDoc,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    runTransaction,
} from "firebase/firestore";

// CREATE A NEW TICKET
export const createTicket = async (ticketData, user) => {
    try {
        await addDoc(collection(db, "tickets"), {
            ...ticketData,
            roomId: ticketData.roomId.toLowerCase(), // 3. Sanitize Room ID on Ticket creation
            status: "open",
            upvotes: [],
            voteCount: 0,
            createdBy: {
                uid: user.uid,
                email: user.email,
                name: user.displayName || "Anonymous",
            },
            createdAt: serverTimestamp(),
        });
        console.log("Ticket created!");
    } catch (error) {
        console.error("Error creating ticket:", error);
        throw error;
    }
};

// LISTEN TO TICKETS FOR A SPECIFIC ROOM (Real-time!)
export const subscribeToRoomTickets = (roomId, callback) => {
    const q = query(
        collection(db, "tickets"),
        where("roomId", "==", roomId.toLowerCase()), // 4. Ensure query uses lowercase
        orderBy("voteCount", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const tickets = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(tickets);
    });
};

// TOGGLE UPVOTE
export const toggleUpvote = async (ticketId, userId, currentUpvotes) => {
    const ticketRef = doc(db, "tickets", ticketId);
    const isUpvoted = currentUpvotes.includes(userId);

    if (isUpvoted) {
        await updateDoc(ticketRef, {
            upvotes: arrayRemove(userId),
            voteCount: currentUpvotes.length - 1,
        });
    } else {
        await updateDoc(ticketRef, {
            upvotes: arrayUnion(userId),
            voteCount: currentUpvotes.length + 1,
        });
    }
};

// MAP EDITOR FUNCTIONS
const LOCAL_CACHE_KEY = "ccms_map_cache";

// SAVE ROOM LAYOUT (Admin Only)
export const saveMapLayout = async (rooms) => {
    try {
        // 5. SANITIZE BEFORE SAVING (Backend Guard)
        const sanitizedRooms = rooms.map((room) => ({
            ...room,
            id: room.id.toLowerCase().trim(),
        }));

        // 1. Save to Cloud (Firestore)
        await setDoc(doc(db, "maps", "main-campus"), {
            rooms: sanitizedRooms,
            lastUpdated: serverTimestamp(),
        });

        // Save to Local Cache (Browser DB)
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(sanitizedRooms));

        console.log("Map layout saved to Cloud & Local Cache!");
    } catch (error) {
        console.error("Error saving map:", error);
        throw error;
    }
};

// FETCH ROOM LAYOUT (Smart Sync)
export const getMapLayout = async () => {
    try {
        // Strategy: Network First, Fallback to Cache
        const docRef = doc(db, "maps", "main-campus");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // 6. SANITIZE ON READ (Fixes old bad data)
            const liveData = docSnap.data().rooms.map((room) => ({
                ...room,
                id: room.id.toLowerCase().trim(),
            }));

            // Update Local Cache
            localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(liveData));
            console.log("Map loaded from Cloud (and cached).");
            return liveData;
        }
    } catch (error) {
        console.warn("Firestore unavailable/offline. Checking Local Cache...");
    }

    // If Firestore failed or is empty, check Local Cache
    const cachedData = localStorage.getItem(LOCAL_CACHE_KEY);
    if (cachedData) {
        console.log("Map loaded from Local Cache (Offline Mode).");
        return JSON.parse(cachedData);
    }

    return null;
};

// Listen to Global Heatmaps (Active Tickets Only)
export const subscribeToHeatmap = (callback) => {
    const q = query(collection(db, "tickets"), where("status", "==", "open"));

    return onSnapshot(q, (snapshot) => {
        const counts = {};

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data.roomId) {
                // 7. Ensure ID is counted as lowercase
                const normalizedId = data.roomId.toLowerCase();
                counts[normalizedId] = (counts[normalizedId] || 0) + 1;
            }
        });

        callback(counts);
    });
};

// UPDATE TICKET STATUS (Staff/Admin)
export const updateTicketStatus = async (ticketId, updates) => {
    try {
        const ticketRef = doc(db, "tickets", ticketId);
        await updateDoc(ticketRef, {
            ...updates,
            lastUpdated: serverTimestamp(),
        });
        console.log("Ticket updated by staff");
    } catch (error) {
        console.error("Error updating ticket:", error);
        throw error;
    }
};

// REVIEW TICKET & KARMA LOGIC
export const reviewTicket = async (ticketId, ticketCreatorId, isFake, staffData, proofUrl = null) => {
    const userRef = doc(db, "users", ticketCreatorId);
    const ticketRef = doc(db, "tickets", ticketId);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const ticketDoc = await transaction.get(ticketRef);

            if (!ticketDoc.exists()) throw "Ticket does not exist!";

            const ticketData = ticketDoc.data();
            if (["verified", "fake", "resolved"].includes(ticketData.status)) {
                throw "Ticket has already been processed.";
            }

            let userData = userDoc.exists() ? userDoc.data() : {};
            let currentKarma = userData.karma !== undefined ? userData.karma : 100;
            let isBanned = userData.isBanned || false;
            let karmaChange = 0;

            if (isFake) {
                karmaChange = -10;
                if (currentKarma + karmaChange <= 0) {
                    currentKarma = 0;
                    isBanned = true;
                } else {
                    currentKarma += karmaChange;
                }
            } else {
                karmaChange = 20;
                currentKarma += karmaChange;
            }

            if (userDoc.exists()) {
                transaction.update(userRef, {
                    karma: currentKarma,
                    isBanned: isBanned,
                });
            }

            transaction.update(ticketRef, {
                status: isFake ? "fake" : "resolved",
                staffNote: staffData.note || "",
                resolutionImageUrl: proofUrl || ticketData.resolutionImageUrl || "",
                resolvedBy: {
                    uid: staffData.uid,
                    name: staffData.name,
                },
                reviewedAt: serverTimestamp(),
                karmaImpact: karmaChange,
            });
        });
        console.log("Ticket Reviewed & Karma Updated!");
    } catch (error) {
        console.error("Transaction failed: ", error);
        throw error;
    }
};
