// src/Profile.js

import React, { useEffect, useState } from 'react';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        setUser(user);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    };
    fetchUserData();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), userData);
      alert('Profile updated!');
    }
  };

  return (
    <div className="profile">
      <h1>Profile</h1>
      <form onSubmit={handleUpdate}>
        <label>
          Name:
          <input
            type="text"
            value={userData.name || ''}
            onChange={(e) => setUserData({ ...userData, name: e.target.value })}
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            value={userData.email || ''}
            readOnly
          />
        </label>
        <label>
          Phone Number:
          <input
            type="text"
            value={userData.phoneNumber || ''}
            onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
          />
        </label>
        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
};

export default Profile;
