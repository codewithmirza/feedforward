import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from './firebaseConfig';
import moment from 'moment';
import { FaEdit, FaTrash, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import './Listings.css';
import MapComponent from './components/MapComponent';

const Listings = ({ currentRole, setCurrentRole }) => {  // Add setCurrentRole as a prop
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [newListing, setNewListing] = useState({ item: '', quantity: '', expiry: '', location: null, imageFile: null, locationDetails: '', phoneNumber: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState({ lat: null, lng: null, address: '' });
  const [range, setRange] = useState(10); // Default range in km
  const [loading, setLoading] = useState(false);

  const timeRemaining = (expiry) => {
    const duration = moment.duration(moment(expiry).diff(moment()));
    if (duration.asWeeks() >= 1) return `${Math.floor(duration.asWeeks())} weeks`;
    if (duration.asDays() >= 1) return `${Math.floor(duration.asDays())} days`;
    if (duration.asHours() >= 1) return `${Math.floor(duration.asHours())} hours`;
    return `${Math.floor(duration.asMinutes())} minutes`;
  };

  const requestLocationAccess = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await getAddress(latitude, longitude);
          setLocation({ lat: latitude, lng: longitude, address });
        },
        (error) => {
          console.error('Error fetching location', error);
          setLocation({ lat: null, lng: null, address: 'Location access denied' });
        }
      );
    }
  }, []);  // Add empty dependency array to memoize the function

  const getAddress = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.display_name;
    } catch (error) {
      console.error('Failed to fetch address:', error);
      return 'Failed to fetch address';
    }
  };

  const fetchListings = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const listingsQuery = query(collection(db, 'listings'), where('userId', '==', user.uid));
        const listingsSnapshot = await getDocs(listingsQuery);
        const listingsData = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setListings(listingsData);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    }
  };

  const filterListings = useCallback(() => {
    if (currentRole === 'donor') {
      setFilteredListings(listings);
    } else {
      const filtered = listings.filter(listing => {
        if (!listing.location || !location.lat || !location.lng) return false;
        const distance = getDistance(location.lat, location.lng, listing.location.lat, listing.location.lng);
        return distance <= range;
      });
      setFilteredListings(filtered);
    }
  }, [listings, range, location, currentRole]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          fetchListings();
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentRole(userDoc.data().currentRole);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    fetchUserData();
    requestLocationAccess();
  }, [setCurrentRole, requestLocationAccess]);  // Add setCurrentRole and requestLocationAccess to the dependency array

  useEffect(() => {
    filterListings();
  }, [listings, range, location, currentRole, filterListings]);

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLng / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleAddListing = async (e) => {
    e.preventDefault();
    try {
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
          locationDetails: newListing.locationDetails,
          phoneNumber: newListing.phoneNumber,
        };
        listingData.location.address = await getAddress(newListing.location.lat, newListing.location.lng);
        delete listingData.imageFile;
        await addDoc(collection(db, 'listings'), listingData);
        resetForm();
        fetchListings();
      }
    } catch (error) {
      console.error('Failed to add listing:', error);
    }
  };

  const handleEditListing = async (e) => {
    e.preventDefault();
    try {
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
          locationDetails: newListing.locationDetails,
          phoneNumber: newListing.phoneNumber,
        };
        listingData.location.address = await getAddress(newListing.location.lat, newListing.location.lng);
        delete listingData.imageFile;
        await updateDoc(doc(db, 'listings', editId), listingData);
        setEditId(null);
        setIsEditing(false);
        resetForm();
        fetchListings();
      }
    } catch (error) {
      console.error('Failed to edit listing:', error);
    }
  };

  const handleDeleteListing = async (id) => {
    try {
      await deleteDoc(doc(db, 'listings', id));
      fetchListings();
    } catch (error) {
      console.error('Failed to delete listing:', error);
    }
  };

  const handleRequestItem = async (listingId) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const requestData = {
          listingId,
          userId: user.uid,
          status: 'requested',
          timestamp: new Date().toISOString(),
        };
        await addDoc(collection(db, 'requests'), requestData);
        alert('Request sent!');
      } else {
        alert('Please log in to request items.');
      }
    } catch (error) {
      console.error('Failed to request item:', error);
    }
  };

  const openForm = (listing = null) => {
    if (listing) {
      setNewListing(listing);
      setEditId(listing.id);
      setIsEditing(true);
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleLocationConfirm = async (location) => {
    try {
      if (location && location.lat !== undefined && location.lng !== undefined) {
        const address = await getAddress(location.lat, location.lng);
        setNewListing({ ...newListing, location: { ...location, address } });
        setShowMap(false);
      }
    } catch (error) {
      console.error('Failed to confirm location:', error);
    }
  };

  const handleRangeChange = (e) => {
    setRange(e.target.value);
  };

  const handleFilter = () => {
    setLoading(true);
    setTimeout(() => {
      filterListings();
      setLoading(false);
    }, 1000); // Simulating network request
  };

  const resetForm = () => {
    setNewListing({ item: '', quantity: '', expiry: '', location: null, imageFile: null, locationDetails: '', phoneNumber: '' });
    setIsEditing(false);
    setEditId(null);
  };

  return (
    <div className="listings">
      <h1>{currentRole === 'donor' ? 'Your Listings' : 'Available Items'}</h1>
      {currentRole === 'recipient' && (
        <div className="filter-bar">
          <div className="search-location">
            <FaMapMarkerAlt />
            <input type="text" placeholder="Your location" value={location.address} readOnly />
          </div>
          <input
            type="range"
            min="1"
            max="50"
            value={range}
            onChange={handleRangeChange}
          />
          <span>{range} km</span>
          <button onClick={handleFilter}>Filter</button>
        </div>
      )}
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <ul>
          {filteredListings.length > 0 ? (
            filteredListings.map((listing) => (
              <li key={listing.id} className="listing-item">
                <div className="listing-details">
                  {listing.image && <img src={listing.image} alt={listing.item} className="listing-image" />}
                  <div>
                    <h2>{listing.item}</h2>
                    <p>{listing.quantity}</p>
                    <p>{listing.locationDetails}</p>
                    <p>Location: {listing.location.address}</p>
                    <p>Phone Number: {listing.phoneNumber}</p>
                    <p>Expiring in: {timeRemaining(listing.expiry)}</p>
                  </div>
                </div>
                {currentRole === 'donor' && (
                  <div className="listing-actions">
                    <button onClick={() => openForm(listing)}><FaEdit /></button>
                    <button onClick={() => handleDeleteListing(listing.id)}><FaTrash /></button>
                  </div>
                )}
                {currentRole === 'recipient' && (
                  <div className="listing-actions">
                    <button onClick={() => handleRequestItem(listing.id)}>Request Item</button>
                  </div>
                )}
              </li>
            ))
          ) : (
            <p>No items available currently</p>
          )}
        </ul>
      )}
      {currentRole === 'donor' && (
        <button className="add-button" onClick={() => openForm()}>
          Add Item
        </button>
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
            <div className="location-picker">
              <input
                type="text"
                placeholder="Location"
                value={newListing.location ? newListing.location.address : ''}
                readOnly
              />
              <button type="button" onClick={() => setShowMap(true)}>{newListing.location ? 'Edit Location' : 'Select Location'}</button>
            </div>
            <textarea
              placeholder="Additional location details (optional)"
              value={newListing.locationDetails}
              onChange={(e) => setNewListing({ ...newListing, locationDetails: e.target.value })}
            />
            <input
              type="file"
              placeholder="Image"
              onChange={(e) => setNewListing({ ...newListing, imageFile: e.target.files[0] })}
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={newListing.phoneNumber}
              onChange={(e) => setNewListing({ ...newListing, phoneNumber: e.target.value })}
              required
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
