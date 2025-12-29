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
    arrayUnion,
    arrayRemove,
    serverTimestamp,
} from "firebase/firestore";


// CREATE A NEW TICKET
export const createTicket = async (ticketData, user) => {
    try {
        await addDoc(collection(db, "tickets"), {
            ...ticketData,
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
        where("roomId", "==", roomId),
        // where("status", "==", "open"),
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
        // Remove vote
        await updateDoc(ticketRef, {
            upvotes: arrayRemove(userId),
            voteCount: currentUpvotes.length - 1,
        });
    } else {
        // Add vote
        await updateDoc(ticketRef, {
            upvotes: arrayUnion(userId),
            voteCount: currentUpvotes.length + 1,
        });
    }
};
