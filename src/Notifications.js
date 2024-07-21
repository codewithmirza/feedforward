import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', user.uid));
          const notificationsSnapshot = await getDocs(notificationsQuery);
          const notificationsData = await Promise.all(notificationsSnapshot.docs.map(async (notificationDoc) => {
            const notificationData = notificationDoc.data();

            let item = '';
            if (notificationData.requestId) {
              const requestDoc = await getDoc(doc(db, 'requests', notificationData.requestId));
              if (requestDoc.exists()) {
                const requestData = requestDoc.data();
                if (requestData.listingId) {
                  const listingDoc = await getDoc(doc(db, 'listings', requestData.listingId));
                  if (listingDoc.exists()) {
                    item = listingDoc.data().item;
                  }
                }
              }
            }

            return { id: notificationDoc.id, ...notificationData, item };
          }));

          setNotifications(notificationsData);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
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
