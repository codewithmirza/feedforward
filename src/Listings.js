import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from './firebaseConfig';
import moment from 'moment';
import { FaTimes, FaMapMarkerAlt, FaPlus } from 'react-icons/fa';
import './Listings.css';
import MapComponent from './components/MapComponent';
import DonorListingCard from './components/DonorListingCard';
import RecipientListingCard from './components/RecipientListingCard';

const Listings = ({ currentRole, setCurrentRole }) => {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [newListing, setNewListing] = useState({ item: '', quantity: '', expiry: '', location: null, imageFile: null, locationDetails: '', phoneNumber: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState({ lat: null, lng: null, address: '' });
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [range, setRange] = useState(10); // Default range in km
  const [loading, setLoading] = useState(false);

  // Function to calculate the time remaining until expiry
  const timeRemaining = (expiry) => {
    const duration = moment.duration(moment(expiry).diff(moment()));
    if (duration.asWeeks() >= 1) return `${Math.floor(duration.asWeeks())} weeks`;
    if (duration.asDays() >= 1) return `${Math.floor(duration.asDays())} days`;
    if (duration.asHours() >= 1) return `${Math.floor(duration.asHours())} hours`;
    return `${Math.floor(duration.asMinutes())} minutes`;
  };

  // Requesting user's location
  const requestLocationAccess = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await getAddress(latitude, longitude);
          setLocation({ lat: latitude, lng: longitude, address });
          setLocationInput(address); // Set the location input to the user's current location
        },
        (error) => {
          console.error('Error fetching location', error);
          setLocation({ lat: null, lng: null, address: 'Location access denied' });
        }
      );
    }
  }, []);

  // Function to get the address from latitude and longitude
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

  // Fetching listings from Firestore
  const fetchListings = async () => {
    try {
      console.log("Fetching listings...");
      const listingsQuery = query(collection(db, 'listings'));
      const listingsSnapshot = await getDocs(listingsQuery);
      const listingsData = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Listings fetched:", listingsData);
      setListings(listingsData);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    }
  };

  // Filtering listings based on the user's role
  const filterListings = useCallback(() => {
    console.log("Filtering listings for role:", currentRole);
    if (currentRole === 'donor') {
      const donorListings = listings.filter(listing => listing.userId === auth.currentUser.uid);
      console.log("Donor listings:", donorListings);
      setFilteredListings(donorListings);
    } else {
      const filtered = listings.filter(listing => {
        if (listing.userId === auth.currentUser.uid) return false; // Exclude listings by the current user
        if (!listing.location || !location.lat || !location.lng) return false;
        const distance = getDistance(location.lat, location.lng, listing.location.lat, listing.location.lng);
        console.log(`Distance to listing ${listing.id} (${listing.item}):`, distance);
        return distance <= range;
      });
      console.log("Filtered listings for recipient:", filtered);
      setFilteredListings(filtered);
    }
  }, [listings, range, location, currentRole]);

  // Initial fetch and set up
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          await fetchListings();
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            console.log("User data fetched:", userDoc.data());
            setCurrentRole(userDoc.data().currentRole);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    fetchUserData();
    requestLocationAccess();
  }, [setCurrentRole, requestLocationAccess]);

  // Apply filtering whenever listings, range, or location change
  useEffect(() => {
    filterListings();
  }, [listings, range, location, filterListings]);

  // Function to calculate the distance between two points
  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLng / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Handle adding a new listing
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
        setShowForm(false); // Close the form after adding listing
      }
    } catch (error) {
      console.error('Failed to add listing:', error);
    }
  };

  // Handle editing an existing listing
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
        setShowForm(false); // Close the form after editing listing
      }
    } catch (error) {
      console.error('Failed to edit listing:', error);
    }
  };

  // Handle deleting a listing
  const handleDeleteListing = async (id) => {
    try {
      await deleteDoc(doc(db, 'listings', id));
      fetchListings();
    } catch (error) {
      console.error('Failed to delete listing:', error);
    }
  };

  // Handle requesting an item
  const handleRequestItem = async (listingId, donorId) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const requestData = {
          listingId,
          userId: user.uid,
          donorId,
          status: 'requested',
          timestamp: new Date().toISOString(),
        };
        await addDoc(collection(db, 'requests'), requestData);
        await addDoc(collection(db, 'notifications'), {
          userId: donorId,
          message: `You have a new request for item: ${newListing.item}`,
          timestamp: new Date().toISOString(),
        });
        alert('Request sent!');
      } else {
        alert('Please log in to request items.');
      }
    } catch (error) {
      console.error('Failed to request item:', error);
    }
  };

  // Open the form for adding or editing a listing
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

  // Close the form
  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  // Confirm location selection
  const handleLocationConfirm = async (location) => {
    try {
      if (location && location.lat !== undefined && location.lng !== undefined) {
        const address = await getAddress(location.lat, location.lng);
        setNewListing({ ...newListing, location: { ...location, address } });
        setLocationInput(address); // Update the location input field with the address
        setShowMap(false);
      }
    } catch (error) {
      console.error('Failed to confirm location:', error);
    }
  };

  // Handle range change for filtering
  const handleRangeChange = (e) => {
    setRange(e.target.value);
  };

  // Apply filtering with loading state
  const handleFilter = () => {
    setLoading(true);
    setTimeout(() => {
      filterListings();
      setLoading(false);
    }, 1000);
  };

  // Reset form state
  const resetForm = () => {
    setNewListing({ item: '', quantity: '', expiry: '', location: null, imageFile: null, locationDetails: '', phoneNumber: '' });
    setIsEditing(false);
    setEditId(null);
  };

  // Handle location input change and fetch suggestions
  const handleLocationInputChange = async (e) => {
    const input = e.target.value;
    setLocationInput(input);
    if (input.length > 2) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${input}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setLocationSuggestions(data);
      } catch (error) {
        console.error('Failed to fetch location suggestions:', error);
      }
    } else {
      setLocationSuggestions([]);
    }
  };

  // Handle location selection from suggestions
  const handleLocationSelect = (suggestion) => {
    const { lat, lon, display_name } = suggestion;
    setLocation({ lat: parseFloat(lat), lng: parseFloat(lon), address: display_name });
    setLocationInput(display_name);
    setLocationSuggestions([]);
  };

  // Handle location search
  const handleLocationSearch = async () => {
    if (locationInput) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${locationInput}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.length > 0) {
          const { lat, lon } = data[0];
          const address = data[0].display_name;
          setLocation({ lat: parseFloat(lat), lng: parseFloat(lon), address });
        } else {
          alert('Location not found.');
        }
      } catch (error) {
        console.error('Failed to search location:', error);
      }
    }
  };

  return (
    <div className="listings">
      <h1 className="listings-title">{currentRole === 'donor' ? 'Your Listings' : 'Available Items'}</h1>
      {currentRole === 'recipient' && (
        <div className="filter-bar">
          <div className="search-location">
            <FaMapMarkerAlt style={{ marginRight: '10px', marginBottom:'10px'}}/>
            <input 
              type="text" 
              placeholder="Enter location" 
              value={locationInput} 
              onChange={handleLocationInputChange} 
              style={{ width: '300px' }} // Increase the width of the location input field
            />
            {locationSuggestions.length > 0 && (
              <ul className="location-suggestions">
                {locationSuggestions.map((suggestion, index) => (
                  <li key={index} onClick={() => handleLocationSelect(suggestion)}>
                    {suggestion.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input
            type="number"
            placeholder="Enter range in km"
            value={range}
            onChange={handleRangeChange}
            min="1"
            max="6371"
          />
          <button onClick={handleFilter} className="button-filter">Filter</button>
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
              currentRole === 'donor' ? (
                <DonorListingCard key={listing.id} listing={listing} onEdit={openForm} onDelete={handleDeleteListing} />
              ) : (
                <RecipientListingCard key={listing.id} listing={listing} onRequest={handleRequestItem} />
              )
            ))
          ) : (
            <p>No items available currently</p>
          )}
        </ul>
      )}
      {currentRole === 'donor' && (
        <button className="add-button" onClick={() => openForm()}>
          <FaPlus style={{ marginRight: '8px' }} />
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
                style={{ width: '300px' }} // Increase the width of the location input field
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
          {showMap && <div className="map-container" onClick={(e) => e.stopPropagation()}><MapComponent location={location} onLocationConfirm={handleLocationConfirm} /></div>}
        </div>
      )}
    </div>
  );
};

export default Listings;
