// src/Listings.js

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from './firebaseConfig';
import moment from 'moment';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import './Listings.css';
import MapComponent from './components/MapComponent';

const Listings = () => {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [newListing, setNewListing] = useState({ item: '', quantity: '', expiry: '', location: null, imageFile: null, locationDetails: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [currentRole, setCurrentRole] = useState('donor');
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState({ lat: null, lng: null, address: '' });
  const [range, setRange] = useState(10); // Default range in km
  const [searchTerm, setSearchTerm] = useState('');

  const timeRemaining = (expiry) => {
    const duration = moment.duration(moment(expiry).diff(moment()));
    if (duration.asWeeks() >= 1) return `${Math.floor(duration.asWeeks())} weeks`;
    if (duration.asDays() >= 1) return `${Math.floor(duration.asDays())} days`;
    if (duration.asHours() >= 1) return `${Math.floor(duration.asHours())} hours`;
    return `${Math.floor(duration.asMinutes())} minutes`;
  };

  const requestLocationAccess = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await getAddress(latitude, longitude);
          setLocation({ lat: latitude, lng: longitude, address });
        },
        (error) => console.error('Error fetching location', error)
      );
    }
  };

  const getAddress = async (lat, lng) => {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await response.json();
    return data.display_name;
  };

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
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        setUser(user);
        fetchListings();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentRole(userDoc.data().currentRole);
        }
      }
    };
    fetchUserData();
    requestLocationAccess();
  }, []);

  useEffect(() => {
    filterListings();
  }, [listings, searchTerm, range, location, currentRole]);

  const filterListings = () => {
    if (currentRole === 'donor') {
      setFilteredListings(listings);
    } else {
      // Filter for recipients based on range and search term
      const filtered = listings.filter(listing => {
        const distance = getDistance(location.lat, location.lng, listing.location.lat, listing.location.lng);
        const matchesSearch = listing.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
          listing.locationDetails.toLowerCase().includes(searchTerm.toLowerCase());
        return distance <= range && matchesSearch;
      });
      setFilteredListings(filtered);
    }
  };

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

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
      const listingData = {
        ...newListing,
        userId: user.uid,
        expiry: moment(newListing.expiry).toISOString(),
        image: imageUrl,
        location: newListing.location,
        locationDetails: newListing.locationDetails
      };
      delete listingData.imageFile;
      await addDoc(collection(db, 'listings'), listingData);
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
      const listingData = {
        ...newListing,
        expiry: moment(newListing.expiry).toISOString(),
        image: imageUrl,
        location: newListing.location,
        locationDetails: newListing.locationDetails
      };
      delete listingData.imageFile;
      await updateDoc(doc(db, 'listings', editId), listingData);
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

  const handleLocationConfirm = (location) => {
    if (location && location.lat !== undefined && location.lng !== undefined) {
      setNewListing({ ...newListing, location });
      setShowMap(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRangeChange = (e) => {
    setRange(e.target.value);
  };

  const toggleRole = async (e) => {
    const newRole = e.target.value;
    setCurrentRole(newRole);
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { currentRole: newRole });
    }
  };

  return (
    <div className="listings">
      <h1>{currentRole === 'donor' ? 'Your Listings' : 'Available Items'}</h1>
      <div className="role-toggle">
        <span>I want to </span>
        <select value={currentRole} onChange={toggleRole}>
          <option value="donor">donate</option>
          <option value="recipient">receive</option>
        </select>
        <span> food</span>
      </div>
      {currentRole === 'recipient' && (
        <div className="filter-bar">
          <div className="search-location">
            <FaMapMarkerAlt />
            <input type="text" placeholder="Your location" value={location.address} readOnly />
          </div>
          <input
            type="text"
            placeholder="Search items"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <select value={range} onChange={handleRangeChange}>
            <option value="5">5 km</option>
            <option value="10">10 km</option>
            <option value="20">20 km</option>
            <option value="50">50 km</option>
          </select>
        </div>
      )}
      <ul>
        {filteredListings.map((listing) => (
          <li key={listing.id} className="listing-item">
            <div className="listing-details">
              {listing.image && <img src={listing.image} alt={listing.item} className="listing-image" />}
              <div>
                <h2>{listing.item}</h2>
                <p>{listing.quantity}</p>
                <p>{listing.locationDetails}</p>
                <p>Location: {listing.locationDetails || listing.address}</p>
                <p>Expiring in: {timeRemaining(listing.expiry)}</p>
              </div>
            </div>
            {currentRole === 'donor' && (
              <div className="listing-actions">
                <button onClick={() => openForm(listing)}><FaEdit /></button>
                <button onClick={() => handleDeleteListing(listing.id)}><FaTrash /></button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {currentRole === 'donor' && (
        <button className="add-button" onClick={() => openForm()}><FaPlus /></button>
      )}
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
