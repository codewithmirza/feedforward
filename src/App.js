// src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './HomePage';
import Layout from './Layout'; // Assuming Layout is the new component

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/layout" element={<Layout />} />
            </Routes>
        </Router>
    );
};

export default App;
