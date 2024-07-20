import React, { useEffect, useState } from 'react';
import { Link, useLocation, Route, Routes } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './Layout.css';
import Listings from './Listings';
import Matches from './Matches';

const Layout = () => {
  const location = useLocation();
  const activeLink = location.pathname.split('/')[2] || 'listings'; // Default to listings if no subpath
  const [user] = useAuthState(auth);
  const [currentRole, setCurrentRole] = useState('donor');

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentRole(userDoc.data().currentRole);
          } else {
            console.error('User document does not exist');
          }
        } catch (error) {
          console.error('Failed to fetch user role:', error);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  const toggleRole = async () => {
    if (user) {
      const newRole = currentRole === 'donor' ? 'recipient' : 'donor';
      setCurrentRole(newRole);
      try {
        await updateDoc(doc(db, 'users', user.uid), { currentRole: newRole });
        console.log('User role updated to', newRole);
      } catch (error) {
        console.error('Failed to update user role:', error);
        alert('Failed to update user role. Please try again later.');
      }
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
          <button onClick={toggleRole} className="toggle-button">
            {currentRole === 'donor' ? 'Switch to Recipient' : 'Switch to Donor'}
          </button>
        </div>
      </nav>
      <div className="content">
        <Routes>
          <Route path="listings" element={<Listings currentRole={currentRole} setCurrentRole={setCurrentRole} />} />
          <Route path="matches" element={<Matches />} />
          {/* Add other routes as necessary */}
        </Routes>
      </div>
    </div>
  );
};

export default Layout;
