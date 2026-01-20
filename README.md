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

Here is the text formatted in Markdown, ready to be pasted into your `README.md` file.

```markdown
### 2. Install Dependencies
```bash
npm install

```

### 3. Configure Firebase

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Google Sign-In) and **Firestore Database**.
3. Create a file named `.env` in the root directory and add your Firebase keys:

```env
VITE_API_KEY=your_api_key
VITE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_project.appspot.com
VITE_MESSAGING_SENDER_ID=your_sender_id
VITE_APP_ID=your_app_id

```

### 4. Run the Development Server

```bash
npm run dev

```

Open [http://localhost:5173](https://www.google.com/search?q=http://localhost:5173) to view it in the browser.

---

## 📖 Usage Guide

* **Sign In:** Use your Google account to log in.
* **Navigate:** Use your mouse wheel to zoom or click the "Reset View" button.
* **Select a Room:** Click on any room (e.g., a Lab or Classroom) to open the Ticket Panel.
* **Report an Issue:**
1. Click "Report New".
2. Select a category and add a description.
3. Upload a photo (required for certain categories).
4. Submit!


* **View Heatmap:** Watch the map colors change in real-time as tickets are added.

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is open-source and available under the MIT License.

**Developed for BCREC**

