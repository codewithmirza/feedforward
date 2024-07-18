// src/Layout.js

import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
    return (
        <div className="layout">
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
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
