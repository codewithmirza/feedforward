import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './DonorListingCard.css';

const DonorListingCard = ({ listing, onEdit, onDelete }) => {
  return (
    <li className="donor-listing-item">
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
        <button onClick={() => onEdit(listing)} className="edit-button"><FaEdit /></button>
        <button onClick={() => onDelete(listing.id)} className="delete-button"><FaTrash /></button>
      </div>
    </li>
  );
};

export default DonorListingCard;
