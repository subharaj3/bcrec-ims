# BCREC INFRASTRUCTURE MANAGEMENT SYSTEM (BCREC-IMS)
> **Hack Zenith 2025 Submission** | *Smart Campus Infrastructure Monitoring*

## The Problem
College campuses are complex ecosystems. When equipment breaks (e.g., a broken AC in Room TF-03 or a leaking pipe in the hallway), reporting it is often tedious. Emails get lost, locations are vague, and students have no visibility into whether a problem is being fixed.

## The Solution
**CCMS** is a "Digital Twin" solution for campus infrastructure. Instead of filling out boring forms, we mapped the entire college floor plan into an **Interactive Web Interface**.

*   **For Students:** Click the specific room on the map, snap a photo, and verify it with AI.
*   **For Management:** A visual heatmap showing "Red Zones" (high complaints) vs. "Green Zones" (healthy infrastructure).

---

## Tech Stack

### Frontend
*   ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) **React (Vite):** Fast, modern UI framework.
*   ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) **Tailwind CSS:** Rapid styling and responsive design.
*   **React Zoom Pan Pinch:** For the Google Maps-like interaction.
*   **React RND:** For the custom Drag-and-Drop Admin Map Editor.

### Backend & Cloud (Google Stack)
*   ![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white) **Firebase Auth:** Secure Google Login for students.
*   **Cloud Firestore:** Real-time database for ticket syncing.
*   **Firebase Storage:** Hosting images of broken equipment.
*   **Vertex AI (Planned):** To auto-validate uploaded images (e.g., detecting if an AC is actually broken).

---

## Key Features

### 1. Interactive Floor Map (Milestone 1 - Completed)
*   **Zoom & Pan:** Infinite canvas navigation (similar to Google Maps).
*   **Vector Overlays:** Precision-mapped click targets for every classroom, lab, and corridor.
*   **Responsive:** Works on large monitors and laptops.

### 2. Built-in Map Editor (Admin Tool)
*   We built a custom **Visual Editor** to avoid hardcoding coordinates.
*   Admins can **Drag, Resize, and Name** rooms directly on the UI.
*   One-click export to generate the JSON geometry data.

### 3. Real-time Complaint Tracking (In Progress)
*   Visual status indicators (Red/Green/Yellow).
*   Upvote system for prioritizing urgent repairs.

---

## Getting Started

Follow these steps to run the project locally.

### Prerequisites
*   Node.js installed.
*   Git installed.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/aranyaksamui/bcrec-ims.git
    cd bcrec_ims
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Open in Browser**
    Visit `http://localhost:5173` to see the map.

---

## Project Structure

```text
src/
├── components/
│   ├── FloorMap.jsx       # Main interactive map (Zoom/Pan logic)
│   ├── AdminMapEditor.jsx # The drag-and-drop tool for Admins
│   └── ...
├── utils/
│   └── roomData.js        # The "Database" of room coordinates
├── services/
│   └── firebase.js        # Firebase configuration
└── App.jsx                # Layout controller
```
