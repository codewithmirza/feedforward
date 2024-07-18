// src/Listings.js

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from './firebaseConfig';
import moment from 'moment';
import { FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import './Listings.css';
import MapComponent from './components/MapComponent';

const Listings = () => {
  const [listings, setListings] = useState([]);
  const [newListing, setNewListing] = useState({ item: '', quantity: '', expiry: '', location: null, imageFile: null, locationDetails: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const fetchListings = async () => {
    const user = auth.currentUser;
    if (user) {
      const listingsQuery = query(collection(db, 'listings'), where('userId', '==', user.uid));
      const listingsSnapshot = await getDocs(listingsQuery);
      const listingsData = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListings(listingsData);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleAddListing = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      let imageUrl = '';
      if (newListing.imageFile) {
        const imageRef = ref(storage, `images/${new Date().getTime()}-${newListing.imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, newListing.imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      await addDoc(collection(db, 'listings'), { 
        ...newListing, 
        userId: user.uid, 
        expiry: moment(newListing.expiry).toISOString(),
        image: imageUrl,
        location: newListing.location, // Store the coordinates
        locationDetails: newListing.locationDetails // Store additional location details
      });
      setNewListing({ item: '', quantity: '', expiry: '', location: null, imageFile: null, locationDetails: '' });
      setShowForm(false);
      fetchListings();
    }
  };

  const handleEditListing = async (e) => {
    e.preventDefault();
    if (editId) {
      let imageUrl = newListing.image;
      if (newListing.imageFile) {
        const imageRef = ref(storage, `images/${new Date().getTime()}-${newListing.imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, newListing.imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      await updateDoc(doc(db, 'listings', editId), { 
        ...newListing, 
        expiry: moment(newListing.expiry).toISOString(),
        image: imageUrl,
        location: newListing.location,
        locationDetails: newListing.locationDetails
      });
      setEditId(null);
      setIsEditing(false);
      setNewListing({ item: '', quantity: '', expiry: '', location: null, imageFile: null, locationDetails: '' });
      fetchListings();
    }
  };

  const handleDeleteListing = async (id) => {
    await deleteDoc(doc(db, 'listings', id));
    fetchListings();
  };

  const openForm = (listing = null) => {
    if (listing) {
      setNewListing(listing);
      setEditId(listing.id);
      setIsEditing(true);
    } else {
      setNewListing({ item: '', quantity: '', expiry: '', location: null, imageFile: null, locationDetails: '' });
      setIsEditing(false);
      setEditId(null);
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setNewListing({ item: '', quantity: '', expiry: '', location: null, imageFile: null, locationDetails: '' });
    setIsEditing(false);
    setEditId(null);
    setShowForm(false);
  };

  const timeRemaining = (expiry) => {
    const duration = moment.duration(moment(expiry).diff(moment()));
    if (duration.asWeeks() >= 1) return `${Math.floor(duration.asWeeks())} weeks`;
    if (duration.asDays() >= 1) return `${Math.floor(duration.asDays())} days`;
    if (duration.asHours() >= 1) return `${Math.floor(duration.asHours())} hours`;
    return `${Math.floor(duration.asMinutes())} minutes`;
  };

  const handleLocationConfirm = (location) => {
    if (location && location.lat !== undefined && location.lng !== undefined) {
      setNewListing({ ...newListing, location });
      setShowMap(false);
    }
  };

  return (
    <div className="listings">
      <h1>Your Listings</h1>
      <ul>
        {listings.map((listing) => (
          <li key={listing.id} className="listing-item">
            <div className="listing-details">
              {listing.image && <img src={listing.image} alt={listing.item} className="listing-image" />}
              <div>
                <h2>{listing.item}</h2>
                <p>{listing.quantity}</p>
                <p>{listing.location ? `Lat: ${listing.location.lat}, Lng: ${listing.location.lng}` : 'No location set'}</p>
                <p>{listing.locationDetails}</p>
                <p>Expiring in: {timeRemaining(listing.expiry)}</p>
              </div>
            </div>
            <div className="listing-actions">
              <button onClick={() => openForm(listing)}><FaEdit /></button>
              <button onClick={() => handleDeleteListing(listing.id)}><FaTrash /></button>
            </div>
          </li>
        ))}
      </ul>
      <button className="add-button" onClick={() => openForm()}><FaPlus /></button>
      {showForm && (
        <div className="form-overlay" onClick={(e) => { if (e.target.className === 'form-overlay') closeForm(); }}>
          <form onSubmit={isEditing ? handleEditListing : handleAddListing} className="listing-form" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="close-button" onClick={closeForm}><FaTimes /></button>
            <h2>{isEditing ? 'Edit Listing' : 'Add Listing'}</h2>
            <input
              type="text"
              placeholder="Item"
              value={newListing.item}
              onChange={(e) => setNewListing({ ...newListing, item: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Quantity"
              value={newListing.quantity}
              onChange={(e) => setNewListing({ ...newListing, quantity: e.target.value })}
              required
            />
            <input
              type="datetime-local"
              placeholder="Expiry Date"
              value={newListing.expiry}
              onChange={(e) => setNewListing({ ...newListing, expiry: e.target.value })}
              required
            />
            <textarea
              placeholder="Additional location details (optional)"
              value={newListing.locationDetails}
              onChange={(e) => setNewListing({ ...newListing, locationDetails: e.target.value })}
            />
            <div className="location-picker">
              <input
                type="text"
                placeholder="Location"
                value={newListing.location ? `Lat: ${newListing.location.lat}, Lng: ${newListing.location.lng}` : ''}
                readOnly
              />
              <button type="button" onClick={() => setShowMap(true)}>{newListing.location ? 'Edit Location' : 'Select Location'}</button>
            </div>
            <input
              type="file"
              placeholder="Image"
              onChange={(e) => setNewListing({ ...newListing, imageFile: e.target.files[0] })}
            />
            <button type="submit">{isEditing ? 'Update Listing' : 'Add Listing'}</button>
          </form>
          {showMap && <div className="map-container" onClick={(e) => e.stopPropagation()}><MapComponent location={newListing.location} onLocationConfirm={handleLocationConfirm} /></div>}
        </div>
      )}
    </div>
  );
};

export default Listings;
