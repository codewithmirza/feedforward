// src/Matches.js

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import './Matches.css';

const Matches = () => {
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      const user = auth.currentUser;
      if (user) {
        setUser(user);
        const requestsQuery = query(collection(db, 'requests'), where('userId', '==', user.uid));
        const requestsSnapshot = await getDocs(requestsQuery);
        const requestsData = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRequests(requestsData);
      }
    };
    fetchRequests();
  }, []);

  const handleAcceptRequest = async (requestId) => {
    await updateDoc(doc(db, 'requests', requestId), { status: 'accepted' });
    setRequests(requests.map(req => req.id === requestId ? { ...req, status: 'accepted' } : req));
  };

  const handleRejectRequest = async (requestId) => {
    await updateDoc(doc(db, 'requests', requestId), { status: 'rejected' });
    setRequests(requests.map(req => req.id === requestId ? { ...req, status: 'rejected' } : req));
  };

  return (
    <div className="matches">
      <h1>Matches</h1>
      <ul>
        {requests.map(request => (
          <li key={request.id} className={`request-item ${request.status}`}>
            <p>Request for item ID: {request.listingId}</p>
            <p>Status: {request.status}</p>
            {request.status === 'requested' && (
              <div className="actions">
                <button onClick={() => handleAcceptRequest(request.id)}>Accept</button>
                <button onClick={() => handleRejectRequest(request.id)}>Reject</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Matches;
