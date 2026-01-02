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
// src/services/firestore.js
// ... imports

// A Key for our local cache
const LOCAL_CACHE_KEY = "ccms_map_cache";

// 5. SAVE ROOM LAYOUT (Admin Only)
export const saveMapLayout = async (rooms) => {
  try {
    // 1. Save to Cloud (Firestore)
    await setDoc(doc(db, "maps", "main-campus"), {
      rooms: rooms,
      lastUpdated: serverTimestamp(),
    });

    // 2. Save to Local Cache (Browser DB)
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(rooms));

    console.log("Map layout saved to Cloud & Local Cache!");
  } catch (error) {
    console.error("Error saving map:", error);
    throw error;
  }
};

// 6. FETCH ROOM LAYOUT (Smart Sync)
export const getMapLayout = async () => {
  try {
    // Strategy: Network First, Fallback to Cache

    // 1. Try to fetch from Firestore
    const docRef = doc(db, "maps", "main-campus");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const liveData = docSnap.data().rooms;

      // Update Local Cache with new data
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(liveData));
      console.log("Map loaded from Cloud (and cached).");
      return liveData;
    }
  } catch (error) {
    console.warn("Firestore unavailable/offline. Checking Local Cache...");
  }

  // 2. If Firestore failed or is empty, check Local Cache
  const cachedData = localStorage.getItem(LOCAL_CACHE_KEY);
  if (cachedData) {
    console.log("Map loaded from Local Cache (Offline Mode).");
    return JSON.parse(cachedData);
  }

  // 3. If Cache is empty, return null (FloorMap will use roomData.js)
  return null;
};

// Listen to Global Heatmaps (Active Tickets Only)
export const subscribeToHeatmap = (callback) => {
  // We want to count 'open' tickets.
  // (You can include 'in-progress' if you want those to show red too)
  const q = query(collection(db, "tickets"), where("status", "==", "open"));

  return onSnapshot(q, (snapshot) => {
    const counts = {};

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.roomId) {
        // Increment count for this room
        counts[data.roomId] = (counts[data.roomId] || 0) + 1;
      }
    });

    callback(counts);
  });
};

// ... existing code ...

// 8. UPDATE TICKET STATUS (Staff/Admin)
export const updateTicketStatus = async (ticketId, updates) => {
  try {
    const ticketRef = doc(db, "tickets", ticketId);

    // Updates object will contain: { status, staffNote, resolutionImageUrl, etc. }
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

export const reviewTicket = async (
  ticketId,
  ticketCreatorId,
  isFake,
  staffData,
  proofUrl = null
) => {
  const userRef = doc(db, "users", ticketCreatorId);
  const ticketRef = doc(db, "tickets", ticketId);

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const ticketDoc = await transaction.get(ticketRef);

      if (!ticketDoc.exists()) throw "Ticket does not exist!";

      // Prevent double grading
      const ticketData = ticketDoc.data();
      if (["verified", "fake", "resolved"].includes(ticketData.status)) {
        throw "Ticket has already been processed.";
      }

      // Calculate New Karma
      let userData = userDoc.exists() ? userDoc.data() : {};
      let currentKarma = userData.karma !== undefined ? userData.karma : 100;
      let isBanned = userData.isBanned || false;
      let karmaChange = 0;

      if (isFake) {
        karmaChange = -10;
        // Check Ban Condition
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

      // 1. Update User
      if (userDoc.exists()) {
        transaction.update(userRef, {
          karma: currentKarma,
          isBanned: isBanned,
        });
      }

      // 2. Update Ticket
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
