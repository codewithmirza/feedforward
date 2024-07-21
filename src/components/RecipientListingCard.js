import React, { useState } from 'react';
import './RecipientListingCard.css';

const RecipientListingCard = ({ listing, onRequest }) => {
  const [requestSent, setRequestSent] = useState(false);

  const handleRequest = async () => {
    await onRequest(listing.id, listing.userId);
    setRequestSent(true);
  };

  return (
    <li className="recipient-listing-item">
      <div className="listing-details">
        {listing.image && <img src={listing.image} alt={listing.item} className="listing-image" />}
        <div>
          <h2>{listing.item}</h2>
          <p>{listing.quantity}</p>
          <p>{listing.locationDetails}</p>
          <p>Location: {listing.location.address}</p>
          <p>Phone Number: {listing.phoneNumber}</p>
          <p>Expiring in: {listing.expiry}</p>
        </div>
      </div>
      <div className="listing-actions">
        <button 
          onClick={handleRequest} 
          disabled={requestSent} 
          className={requestSent ? 'request-sent' : ''}
        >
          {requestSent ? 'Request Sent' : 'Request Item'}
        </button>
      </div>
    </li>
  );
};

export default RecipientListingCard;
