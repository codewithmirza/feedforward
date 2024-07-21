import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FaEdit } from 'react-icons/fa';
import './Profile.css';

const ProfilePage = () => {
  const [userData, setUserData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
          setEditData(docSnap.data());
        } else {
          console.log('No such document!');
        }
      };
      fetchUserData();
    }
  }, [user]);

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async () => {
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, editData);
      setUserData(editData);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile: ', error);
      alert('Error updating profile: ' + error.message);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Profile Page</h1>
        <button onClick={() => setIsEditing(true)}><FaEdit /> Edit</button>
      </div>
      <div className="profile-details">
        <p><strong>Full Name:</strong> {userData.name}</p>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Phone Number:</strong> {userData.phoneNumber || 'N/A'}</p>
        <p><strong>Role:</strong> {userData.currentRole}</p>
        {userData.currentRole === 'donor' && (
          <>
            <p><strong>Organization Name:</strong> {userData.organizationName || 'N/A'}</p>
            <p><strong>Address:</strong> {userData.address || 'N/A'}</p>
            <p><strong>Type of Food Provided:</strong> {userData.foodType || 'N/A'}</p>
            <p><strong>Quantity and Frequency:</strong> {userData.quantityFrequency || 'N/A'}</p>
            <p><strong>Preferred Pickup Times:</strong> {userData.pickupTimes || 'N/A'}</p>
          </>
        )}
        {userData.currentRole === 'recipient' && (
          <>
            <p><strong>Organization Name:</strong> {userData.organizationName || 'N/A'}</p>
            <p><strong>Address:</strong> {userData.address || 'N/A'}</p>
            <p><strong>Type of Food Needed:</strong> {userData.foodNeeded || 'N/A'}</p>
            <p><strong>Storage Capacity:</strong> {userData.storageCapacity || 'N/A'}</p>
            <p><strong>Preferred Pickup/Delivery Times:</strong> {userData.pickupDeliveryTimes || 'N/A'}</p>
          </>
        )}
        <p><strong>Profile Picture:</strong> <img src={userData.profilePicture || 'default.jpg'} alt="Profile" /></p>
        <p><strong>Brief Description:</strong> {userData.description || 'N/A'}</p>
      </div>

      {isEditing && (
        <div className="edit-profile-modal">
          <h2>Edit Profile</h2>
          <input type="text" name="name" value={editData.name} onChange={handleEditChange} placeholder="Full Name" />
          <input type="email" name="email" value={editData.email} onChange={handleEditChange} placeholder="Email" disabled />
          <input type="text" name="phoneNumber" value={editData.phoneNumber} onChange={handleEditChange} placeholder="Phone Number" />
          {userData.currentRole === 'donor' && (
            <>
              <input type="text" name="organizationName" value={editData.organizationName} onChange={handleEditChange} placeholder="Organization Name" />
              <input type="text" name="address" value={editData.address} onChange={handleEditChange} placeholder="Address" />
              <input type="text" name="foodType" value={editData.foodType} onChange={handleEditChange} placeholder="Type of Food Provided" />
              <input type="text" name="quantityFrequency" value={editData.quantityFrequency} onChange={handleEditChange} placeholder="Quantity and Frequency" />
              <input type="text" name="pickupTimes" value={editData.pickupTimes} onChange={handleEditChange} placeholder="Preferred Pickup Times" />
            </>
          )}
          {userData.currentRole === 'recipient' && (
            <>
              <input type="text" name="organizationName" value={editData.organizationName} onChange={handleEditChange} placeholder="Organization Name" />
              <input type="text" name="address" value={editData.address} onChange={handleEditChange} placeholder="Address" />
              <input type="text" name="foodNeeded" value={editData.foodNeeded} onChange={handleEditChange} placeholder="Type of Food Needed" />
              <input type="text" name="storageCapacity" value={editData.storageCapacity} onChange={handleEditChange} placeholder="Storage Capacity" />
              <input type="text" name="pickupDeliveryTimes" value={editData.pickupDeliveryTimes} onChange={handleEditChange} placeholder="Preferred Pickup/Delivery Times" />
            </>
          )}
          <input type="file" name="profilePicture" onChange={(e) => setEditData({ ...editData, profilePicture: URL.createObjectURL(e.target.files[0]) })} placeholder="Profile Picture" />
          <textarea name="description" value={editData.description} onChange={handleEditChange} placeholder="Brief Description"></textarea>
          <button onClick={handleSaveChanges}>Save Changes</button>
          <button className="cancel-button" onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
