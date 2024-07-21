// src/Notifications.js
import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const user = auth.currentUser;
      if (user) {
        const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', user.uid));
        const notificationsSnapshot = await getDocs(notificationsQuery);
        const notificationsData = await Promise.all(notificationsSnapshot.docs.map(async doc => {
          const requestDoc = await getDocs(doc(db, 'requests', doc.data().listingId));
          const listingDoc = await getDocs(doc(db, 'listings', requestDoc.data().listingId));
          return { id: doc.id, ...doc.data(), item: listingDoc.data().item };
        }));
        setNotifications(notificationsData);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <div className="notifications">
      <h1>Notifications</h1>
      <ul>
        {notifications.map(notification => (
          <li key={notification.id} className="notification-item">
            <p>{notification.message.replace('item ID:', `item: ${notification.item}`)}</p>
            <p><small>{new Date(notification.timestamp).toLocaleString()}</small></p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
