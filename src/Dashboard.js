// src/Dashboard.js

import React from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import './Dashboard.css';
import Profile from './Profile';
import Listings from './Listings';
import Matches from './Matches';
import Notifications from './Notifications';
import Settings from './Settings';

const Dashboard = () => {
    return (
        <div className="dashboard">
            <nav className="sidebar">
                <ul>
                    <li><Link to="/dashboard/profile">Profile</Link></li>
                    <li><Link to="/dashboard/listings">Listings</Link></li>
                    <li><Link to="/dashboard/matches">Matches</Link></li>
                    <li><Link to="/dashboard/notifications">Notifications</Link></li>
                    <li><Link to="/dashboard/settings">Settings</Link></li>
                </ul>
            </nav>
            <div className="content">
                <Routes>
                    <Route path="profile" element={<Profile />} />
                    <Route path="listings" element={<Listings />} />
                    <Route path="matches" element={<Matches />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="settings" element={<Settings />} />
                </Routes>
            </div>
        </div>
    );
};

export default Dashboard;
