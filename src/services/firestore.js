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

// Listen to all tickets and count them by Room ID for the Heatmap
export const subscribeToHeatmap = (callback) => {
  const q = query(ticketsRef);

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const counts = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Only count active issues (Open or In-Progress)
      if (data.status === "open" || data.status === "in-progress") {
        const roomId = data.roomId;
        if (roomId) {
          counts[roomId] = (counts[roomId] || 0) + 1;
        }
      }
    });

    callback(counts);
  });

  return unsubscribe;
};

// === 2. TICKET SERVICES ===

// Create a new ticket
export const createTicket = async (ticketData, user) => {
  if (!user) throw new Error("User not authenticated");

  await addDoc(ticketsRef, {
    ...ticketData,
    status: "open",
    createdAt: serverTimestamp(),
    createdBy: {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    },
    upvotes: [],
    voteCount: 0,
    staffNote: "",
    resolutionImageUrl: "",
  });
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
export const reviewTicket = async (
  ticketId,
  creatorId,
  isFake,
  staffData,
  proofUrl
) => {
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
