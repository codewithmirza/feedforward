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
                <div className="sidebar-header">
                    <h2 className="app-title">FeedForward</h2>
                </div>
                <ul className="sidebar-links">
                    <li className="sidebar-link">
                        <Link to="/dashboard/listings">Listings</Link>
                    </li>
                    <li className="sidebar-link">
                        <Link to="/dashboard/matches">Matches</Link>
                    </li>
                    <li className="sidebar-link">
                        <Link to="/dashboard/profile">Profile</Link>
                    </li>
                    <li className="sidebar-link">
                        <Link to="/dashboard/notifications">Notifications</Link>
                    </li>
                    <li className="sidebar-link">
                        <Link to="/dashboard/settings">Settings</Link>
                    </li>
                </ul>
            </nav>
            <div className="content">
                <Routes>
                    <Route path="/dashboard" element={<Listings />} /> {/* Default to Listings */}
                    <Route path="/dashboard/listings" element={<Listings />} />
                    <Route path="/dashboard/matches" element={<Matches />} />
                    <Route path="/dashboard/profile" element={<Profile />} />
                    <Route path="/dashboard/notifications" element={<Notifications />} />
                    <Route path="/dashboard/settings" element={<Settings />} />
                </Routes>
            </div>
        </div>
    );
};

export default Dashboard;
