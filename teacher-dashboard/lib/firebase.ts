// Firebase configuration for Cervantes teacher dashboard

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCqg1C73wRsi7nRs--xvD_t3RORGs22mZI",
  authDomain: "cervantes-caebc.firebaseapp.com",
  projectId: "cervantes-caebc",
  storageBucket: "cervantes-caebc.firebasestorage.app",
  messagingSenderId: "878325801565",
  appId: "1:878325801565:web:2dd8c4bf2013efd781a3b4",
  measurementId: "G-W0LQPLJHL9",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { app, auth };
