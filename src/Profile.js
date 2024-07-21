import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FaEdit } from 'react-icons/fa';
import { MdAddAPhoto } from 'react-icons/md';
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

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditData({ ...editData, profilePicture: URL.createObjectURL(file) });
    }
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
        <button onClick={() => setIsEditing(true)}>
          <FaEdit /> Edit
        </button>
      </div>
      <div className="profile-details">
        <div className="profile-picture">
          <img src={userData.profilePicture || 'default.jpg'} alt="Profile" />
        </div>
        <p><strong>Full Name:</strong> {userData.name}</p>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Phone Number:</strong> {userData.phoneNumber || 'N/A'}</p>
        <p><strong>Role:</strong> {userData.currentRole}</p>
        <p><strong>Organization Name:</strong> {userData.organizationName || 'N/A'}</p>
        <p><strong>Address:</strong> {userData.address || 'N/A'}</p>
        <p><strong>Brief Description:</strong> {userData.description || 'N/A'}</p>
      </div>

      {isEditing && (
        <div className="edit-profile-modal">
          <h2>Edit Profile</h2>
          <div className="profile-picture-edit">
            <label htmlFor="profilePictureInput">
              <MdAddAPhoto />
              <img src={editData.profilePicture || 'default.jpg'} alt="Profile" />
            </label>
            <input 
              id="profilePictureInput" 
              type="file" 
              onChange={handleProfilePictureChange} 
              style={{ display: 'none' }} 
            />
          </div>
          <input type="text" name="name" value={editData.name} onChange={handleEditChange} placeholder="Full Name" />
          <input type="email" name="email" value={editData.email} onChange={handleEditChange} placeholder="Email" disabled />
          <input type="text" name="phoneNumber" value={editData.phoneNumber} onChange={handleEditChange} placeholder="Phone Number" />
          <select name="currentRole" value={editData.currentRole} onChange={handleEditChange}>
            <option value="donor">Donor</option>
            <option value="recipient">Recipient</option>
          </select>
          <input type="text" name="organizationName" value={editData.organizationName} onChange={handleEditChange} placeholder="Organization Name" />
          <input type="text" name="address" value={editData.address} onChange={handleEditChange} placeholder="Address" />
          <textarea name="description" value={editData.description} onChange={handleEditChange} placeholder="Brief Description"></textarea>
          <button onClick={handleSaveChanges}>Save Changes</button>
          <button className="cancel-button" onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
