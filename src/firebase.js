// src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging"; 

const firebaseConfig = {
  apiKey: "AIzaSyCPQq0I_KmoMR9C1GmtRqo5Dt-t8ZrtxYQ",
  authDomain: "smartattendancenotifications.firebaseapp.com",
  projectId: "smartattendancenotifications",
  storageBucket: "smartattendancenotifications.firebasestorage.app",
  messagingSenderId: "486884846821",
  appId: "1:486884846821:web:bdcf953e0cc3c698e0780c",
  measurementId: "G-DGM3C41EF0" 
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Bildirim servisini dışarı aktar
export const messaging = getMessaging(app);