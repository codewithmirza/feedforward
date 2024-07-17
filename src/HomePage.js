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
    const [role, setRole] = useState('donor');
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLogin) {
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log("Login successful", userCredential.user);
                    navigate('/dashboard'); // Navigate to dashboard on login success
                })
                .catch((error) => {
                    console.error("Error logging in", error);
                });
        } else {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log("Signup successful", userCredential.user);
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    name: name,
                    email: email,
                    role: role,
                    uid: userCredential.user.uid
                });
                console.log("User added to Firestore");
                navigate('/dashboard'); // Navigate to dashboard on signup success
            } catch (error) {
                console.error("Error signing up", error);
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
                    <>
                        <input
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <select value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="donor">Donor</option>
                            <option value="recipient">Recipient</option>
                            <option value="admin">Admin</option>
                        </select>
                    </>
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
