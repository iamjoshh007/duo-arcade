// 1) Create a Firebase project at https://console.firebase.google.com/
// 2) Add a Web App and paste its config below.
// 3) Enable Realtime Database (test mode while developing; secure rules before public launch).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://PASTE_YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "PASTE_YOUR_PROJECT",
  appId: "PASTE_YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const configured = !firebaseConfig.apiKey.startsWith("PASTE") && !firebaseConfig.projectId.startsWith("PASTE");
