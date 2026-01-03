import { db } from "./firebase";
import {
    collection,
    addDoc,
    updateDoc,
    setDoc,
    doc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    getDoc,
    getDocs,
    orderBy,
    writeBatch,
} from "firebase/firestore";

// Collection References
const ticketsRef = collection(db, "tickets");
const roomsRef = collection(db, "rooms");
const usersRef = collection(db, "users");

// === 1. MAP LAYOUT SERVICES ===

// Fetch Map Layout (Rooms coordinates)
export const getMapLayout = async () => {
    try {
        const snapshot = await getDocs(roomsRef);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching map layout:", error);
        return [];
    }
};

// FIXED: Added missing 'saveMapLayout' function
export const saveMapLayout = async (rooms) => {
    try {
        const batch = writeBatch(db);

        rooms.forEach((room) => {
            // Ensure we use the room's ID as the document ID
            const roomDocRef = doc(db, "rooms", room.id);
            // setDoc with { merge: true } updates existing fields or creates if missing
            batch.set(roomDocRef, room, { merge: true });
        });

        await batch.commit();
        console.log("Map layout saved successfully!");
    } catch (error) {
        console.error("Error saving map layout:", error);
        throw error;
    }
};

// Listen to Global Heatmaps (Active Tickets Only)
export const subscribeToHeatmap = (callback) => {
    // Query all tickets (Client-side filtering is safer for now to avoid Index errors)
    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef);

    return onSnapshot(
        q,
        (snapshot) => {
            const counts = {};

            snapshot.forEach((doc) => {
                const data = doc.data();

                // 1. Filter: Only count Open or In-Progress
                if (["open", "in-progress"].includes(data.status)) {
                    const rawId = data.roomId;

                    if (rawId) {
                        // 2. CRITICAL FIX: Normalize to lowercase & trim
                        // This ensures "TF-08" in DB matches "tf-08" in the map logic
                        const normalizedId = rawId.toLowerCase().trim();

                        counts[normalizedId] = (counts[normalizedId] || 0) + 1;
                    }
                }
            });

            console.log("Heatmap Data Updated:", counts); // Debug log to verify data
            callback(counts);
        },
        (error) => {
            // 3. CRITICAL FIX: Catch Permission/Network errors
            console.error("Heatmap Subscription Failed:", error);
        }
    );
};

// === 2. TICKET SERVICES ===

// Create a new ticket
export const createTicket = async (ticketData, user) => {
    try {
        // 1. PREPARE & SANITIZE PAYLOAD
        // Firestore crashes if any value is 'undefined'. We default them to null or strings.
        const safePayload = {
            roomId: (ticketData.roomId || "").toLowerCase(),
            roomName: ticketData.roomName || "Unknown Room",
            category: ticketData.category || "General",
            description: ticketData.description || "",
            photoUrl: ticketData.photoUrl || null, // Use null, not undefined/empty string
            requiresAudit: !!ticketData.requiresAudit, // Force boolean

            // Default Fields
            status: "open",
            upvotes: [],
            voteCount: 0,

            // User Data
            createdBy: {
                uid: user.uid,
                email: user.email || "no-email", // Handle missing email
                name: user.displayName || "Anonymous",
            },

            createdAt: serverTimestamp(),
        };

        // 2. SEND TO FIREBASE
        await addDoc(collection(db, "tickets"), safePayload);

        console.log("Ticket created successfully!");
    } catch (error) {
        console.error("Error creating ticket:", error);
        throw error;
    }
};

// Listen to tickets for a specific room
export const subscribeToRoomTickets = (roomId, callback) => {
    const q = query(
        ticketsRef,
        where("roomId", "==", roomId),
        orderBy("createdAt", "desc") // Show newest first
    );

    return onSnapshot(q, (snapshot) => {
        const tickets = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(tickets);
    });
};

// Upvote a ticket
export const toggleUpvote = async (ticketId, userId, currentUpvotes = []) => {
    const ticketDocRef = doc(db, "tickets", ticketId);

    let newUpvotes;
    if (currentUpvotes.includes(userId)) {
        newUpvotes = currentUpvotes.filter((id) => id !== userId);
    } else {
        newUpvotes = [...currentUpvotes, userId];
    }

    await updateDoc(ticketDocRef, {
        upvotes: newUpvotes,
        voteCount: newUpvotes.length,
    });
};

// Update ticket status (Staff only)
export const updateTicketStatus = async (ticketId, updates) => {
    const ticketDocRef = doc(db, "tickets", ticketId);
    await updateDoc(ticketDocRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
};

// Review Ticket (Mark as Fake or Resolved) and update Karma
export const reviewTicket = async (ticketId, creatorId, isFake, staffData, proofUrl) => {
    const ticketDocRef = doc(db, "tickets", ticketId);
    const creatorRef = doc(db, "users", creatorId);

    // 1. Update Ticket
    await updateDoc(ticketDocRef, {
        status: isFake ? "fake" : "resolved",
        staffNote: staffData.note,
        resolutionImageUrl: proofUrl,
        resolvedBy: { name: staffData.name, uid: staffData.uid },
        updatedAt: serverTimestamp(),
    });

    // 2. Update Creator's Karma
    const creatorSnap = await getDoc(creatorRef);
    if (creatorSnap.exists()) {
        const currentKarma = creatorSnap.data().karma || 100;
        // Decrease karma if fake, Increase if valid resolution
        const karmaChange = isFake ? -20 : 10;

        await updateDoc(creatorRef, {
            karma: currentKarma + karmaChange,
        });
    }
};
