// src/Layout.js

import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  const activeLink = location.pathname.split('/')[2] || 'listings'; // Default to listings if no subpath
  const [user] = useAuthState(auth);
  const [currentRole, setCurrentRole] = useState('donor');

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentRole(userDoc.data().currentRole);
        }
      }
    };
    fetchUserRole();
  }, [user]);

  const toggleRole = async (e) => {
    const newRole = e.target.value;
    setCurrentRole(newRole);
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { currentRole: newRole });
    }
  };

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2 className="app-title">FeedForward</h2>
        </div>
        <ul className="sidebar-links">
          <li className={`sidebar-link ${activeLink === 'listings' ? 'active' : ''}`}>
            <Link to="/layout/listings">Listings</Link>
          </li>
          <li className={`sidebar-link ${activeLink === 'matches' ? 'active' : ''}`}>
            <Link to="/layout/matches">Matches</Link>
          </li>
          <li className={`sidebar-link ${activeLink === 'profile' ? 'active' : ''}`}>
            <Link to="/layout/profile">Profile</Link>
          </li>
          <li className={`sidebar-link ${activeLink === 'notifications' ? 'active' : ''}`}>
            <Link to="/layout/notifications">Notifications</Link>
          </li>
          <li className={`sidebar-link ${activeLink === 'settings' ? 'active' : ''}`}>
            <Link to="/layout/settings">Settings</Link>
          </li>
        </ul>
        <div className="role-toggle">
          <select value={currentRole} onChange={toggleRole} className="toggle-select">
            <option value="donor">Donor</option>
            <option value="recipient">Recipient</option>
          </select>
        </div>
      </nav>
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
