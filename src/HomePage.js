// src/HomePage.js

import React, { useState } from 'react';
import './HomePage.css';
import { auth, db } from './firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLogin) {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log("Login successful", userCredential.user);
                navigate('/layout/listings'); // Navigate to listings on login success
            } catch (error) {
                console.error("Error logging in", error);
                alert("Error logging in: " + error.message);
            }
        } else {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log("Signup successful", userCredential.user);
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    name: name,
                    email: email,
                    currentRole: 'donor', // Default role
                    uid: userCredential.user.uid
                });
                console.log("User added to Firestore");
                navigate('/layout/listings'); // Navigate to listings on signup success
            } catch (error) {
                console.error("Error signing up", error);
                alert("Error signing up: " + error.message);
            }
        }
    };

    return (
        <div className="homepage">
            <h1>Welcome to FeedForward</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {!isLogin && (
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                )}
                <button type="submit">{isLogin ? "Login" : "Sign Up"}</button>
            </form>
            <p onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </p>
        </div>
    );
};

export default HomePage;
