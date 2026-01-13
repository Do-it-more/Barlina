// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBNoosMNxTGe-2OAPIDzOmajLCT3l9hMC0",
    authDomain: "barlina-fashion-design.firebaseapp.com",
    projectId: "barlina-fashion-design",
    storageBucket: "barlina-fashion-design.firebasestorage.app",
    messagingSenderId: "887238259454",
    appId: "1:887238259454:web:c7ee6dd3581800ef822baf",
    measurementId: "G-96TE55P26W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth };
export default app;
