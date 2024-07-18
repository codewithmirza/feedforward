// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './HomePage';
import Layout from './Layout';
import Listings from './Listings';
import Matches from './Matches';
import Profile from './Profile';
import Notifications from './Notifications';
import Settings from './Settings';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/layout" element={<Layout />}>
          <Route path="listings" element={<Listings />} />
          <Route path="matches" element={<Matches />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route index element={<Navigate to="/layout/listings" />} /> {/* Default to listings */}
        </Route>
        <Route path="*" element={<Navigate to="/" />} /> {/* Fallback to HomePage */}
      </Routes>
    </Router>
  );
};

export default App;
