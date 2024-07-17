import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBnlUF33ko5kfeZoul0mhP9uMpmx4mArhg",
  authDomain: "feedforward-24ddd.firebaseapp.com",
  projectId: "feedforward-24ddd",
  storageBucket: "feedforward-24ddd.appspot.com",
  messagingSenderId: "1049373838134",
  appId: "1:1049373838134:web:f6a32929c23a3549d6c197",
  measurementId: "G-67YLZTFB5E"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };