// src/Layout.js

import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
    const location = useLocation();
    const activeLink = location.pathname.split('/')[2] || 'listings'; // Default to listings if no subpath

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
            </nav>
            <div className="content">
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
