// Firebase Configuration for Client-Side

const firebaseConfig = {
    apiKey: "AIzaSyDLknCYpP-WmEdfC8cjx1y-Hf_sRFCOF9o",
    authDomain: "studymate-28123.firebaseapp.com",
    databaseURL: "https://studymate-28123-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "studymate-28123",
    storageBucket: "studymate-28123.firebasestorage.app",
    messagingSenderId: "971088390534",
    appId: "1:971088390534:web:0afb27d1edc58ce65a6407",
    measurementId: "G-RE7JWJH5QM"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get auth instance
const firebaseAuth = firebase.auth();

console.log('Firebase client initialized for project: studymate-28123');
