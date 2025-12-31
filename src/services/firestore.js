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

// MAP EDITOR FUNCTIONS
// Save Room Layout (Admin only)
export const saveMapLayout = async (rooms) => {
    try {
        // We overwrite the 'rooms' array in the 'main-campus' doc
        await setDoc(doc(db, "maps", "main-campus"), {
            rooms: rooms,
            lastUpdated: serverTimestamp(),
        });
        console.log("Map layout saved!");
    } catch (error) {
        console.error("Error saving map:", error);
        throw error;
    }
};

// Fetch Room Layout (For app & editor)
export const getMapLayout = async () => {
    try {
        const docRef = doc(db, "maps", "main-campus");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data().rooms;
        } else {
            return null; // No map saved yet
        }
    } catch (error) {
        console.error("Error fetching map:", error);
        return null;
    }
};

// Listen to Global Heatmaps (Active Tickets Only)
export const subscribeToHeatmap = (callback) => {
  // We want to count 'open' tickets. 
  // (You can include 'in-progress' if you want those to show red too)
  const q = query(
    collection(db, "tickets"), 
    where("status", "==", "open")
  );

  return onSnapshot(q, (snapshot) => {
    const counts = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.roomId) {
        // Increment count for this room
        counts[data.roomId] = (counts[data.roomId] || 0) + 1;
      }
    });
    
    callback(counts);
  });
};

