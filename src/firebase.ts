import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyDmtiawl0FF9SlDL2BXei7Db6aSCbJBqcE",
    authDomain: "farefit.firebaseapp.com",
    projectId: "farefit",
    storageBucket: "farefit.firebasestorage.app",
    messagingSenderId: "1070470589283",
    appId: "1:1070470589283:web:92acabab864d302949c156",
    measurementId: "G-J1XPZP1E3L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services for use in your application
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);