# BCREC Infrastructure Monitoring System (IMS)

![Project Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)

**BCREC IMS** is a real-time smart campus solution designed to streamline infrastructure maintenance. It features an interactive, zoomable floor map that allows students and staff to report, track, and resolve facility issues (like electrical faults, broken furniture, or cleanliness) directly on a digital twin of the college building.

## 🌟 Key Features

### 🗺️ Interactive Floor Map
* **Digital Twin:** A high-fidelity, zoomable map of the 3rd Floor, Main Building.
* **Smart Navigation:** Click on any room to auto-zoom and view specific details.
* **Real-time Heatmap:** Rooms dynamically change color based on issue severity:
    * 🟠 **Orange:** Low severity (1-2 active issues)
    * 🔴 **Red:** Medium severity (3-5 active issues)
    * 🛑 **Deep Red:** Critical (5+ active issues)

### 🎫 Smart Ticketing System
* **Report Issues:** Users can file complaints under categories like Electrical, Civil, Furniture, and Cleanliness.
* **Evidence Upload:** Integrated image uploading for proof of damage.
* **AI Validation:** (Optional integration) Automatically validates uploaded images to ensure relevance before submission.
* **Upvote System:** Students can upvote existing issues to prioritize them, preventing duplicate reports.

### 👤 User Profile & Gamification
* **Karma Points:** Users earn Karma for reporting valid issues and lose Karma for filing fake reports.
* **Role-Based Access:**
    * **Students:** Report and upvote issues.
    * **Staff:** Update status (In-Progress, Resolved) and add official notes.
    * **Admins:** Manage the map layout and oversee the system.

### 🛠️ Dashboard & Analytics
* **Live Status Tracking:** Track tickets through **Open** → **In Progress** → **Resolved**.
* **Fake Report Detection:** Staff can flag tickets as "Fake," which penalizes the reporter's Karma.

---

## 🚀 Tech Stack

* **Frontend:** React.js, Tailwind CSS
* **Map Interaction:** `react-zoom-pan-pinch`
* **Backend & Database:** Google Firebase (Firestore, Authentication)
* **Icons:** Lucide React
* **State Management:** React Hooks & Context API

---

## 📦 Installation & Setup

Follow these steps to run the project locally.

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/bcrec-ims.git](https://github.com/your-username/bcrec-ims.git)
cd bcrec-ims
