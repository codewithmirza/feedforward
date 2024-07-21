import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, addDoc } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import './Matches.css';

const Matches = () => {
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);

        // Fetch requests where the current user is either the requester or the donor
        const requestsQuery = query(
          collection(db, 'requests'),
          where('userId', '==', currentUser.uid)
        );
        const donorRequestsQuery = query(
          collection(db, 'requests'),
          where('donorId', '==', currentUser.uid)
        );

        const requestsSnapshot = await getDocs(requestsQuery);
        const donorRequestsSnapshot = await getDocs(donorRequestsQuery);

        const requestsData = await Promise.all(
          requestsSnapshot.docs.map(async (docSnap) => {
            const requestData = docSnap.data();
            const listingDoc = await getDoc(doc(db, 'listings', requestData.listingId));
            const listingData = listingDoc.exists() ? listingDoc.data() : {};
            return { id: docSnap.id, ...requestData, item: listingData.item, userRole: 'requester' };
          })
        );

        const donorRequestsData = await Promise.all(
          donorRequestsSnapshot.docs.map(async (docSnap) => {
            const requestData = docSnap.data();
            const listingDoc = await getDoc(doc(db, 'listings', requestData.listingId));
            const listingData = listingDoc.exists() ? listingDoc.data() : {};
            return { id: docSnap.id, ...requestData, item: listingData.item, userRole: 'donor' };
          })
        );

        setRequests([...requestsData, ...donorRequestsData]);
      }
    };

    fetchRequests();
  }, []);

  const handleAcceptRequest = async (requestId) => {
    await updateDoc(doc(db, 'requests', requestId), { status: 'accepted' });
    setRequests(requests.map(req => req.id === requestId ? { ...req, status: 'accepted' } : req));
    
    // Send notification to the recipient
    const requestDoc = await getDoc(doc(db, 'requests', requestId));
    const requestData = requestDoc.data();
    const recipientId = requestData.userId;
    const notificationData = {
      userId: recipientId,
      message: `Your request for item: ${requestData.item} has been accepted.`,
      timestamp: new Date().toISOString(),
    };
    await addDoc(collection(db, 'notifications'), notificationData);
  };

  const handleRejectRequest = async (requestId) => {
    await updateDoc(doc(db, 'requests', requestId), { status: 'rejected' });
    setRequests(requests.map(req => req.id === requestId ? { ...req, status: 'rejected' } : req));
    
    // Send notification to the recipient
    const requestDoc = await getDoc(doc(db, 'requests', requestId));
    const requestData = requestDoc.data();
    const recipientId = requestData.userId;
    const notificationData = {
      userId: recipientId,
      message: `Your request for item: ${requestData.item} has been rejected.`,
      timestamp: new Date().toISOString(),
    };
    await addDoc(collection(db, 'notifications'), notificationData);
  };

  return (
    <div className="matches">
      <h1>Matches</h1>
      <ul>
        {requests.map(request => (
          <li key={request.id} className={`request-item ${request.status}`}>
            <p>Request for item: {request.item}</p>
            <p>Status: {request.status}</p>
            {request.status === 'requested' && request.userRole === 'donor' && (
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
