// src/components/MapComponent.js

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const SearchField = ({ onLocationSelect }) => {
  const map = useMapEvents({});

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: false,
      retainZoomLevel: false,
      autoClose: false, // Ensure search results stay open
      searchLabel: 'Enter address',
      keepResult: true,
    });

    map.addControl(searchControl);
    map.on('geosearch/showlocation', (result) => {
      if (result.location && result.location.lat !== undefined && result.location.lng !== undefined) {
        onLocationSelect(result.location);
        map.setView([result.location.lat, result.location.lng], 13);
      }
    });

    return () => map.removeControl(searchControl);
  }, [map, onLocationSelect]);

  return null;
};

const MapComponent = ({ location, onLocationConfirm }) => {
  const defaultLocation = [51.505, -0.09]; // Default location (e.g., London)
  const [position, setPosition] = useState(location ? [location.lat, location.lng] : defaultLocation);

  useEffect(() => {
    if (location && location.lat !== undefined && location.lng !== undefined) {
      setPosition([location.lat, location.lng]);
    }
  }, [location]);

  const handleClick = (e) => {
    const latlng = e.latlng;
    if (latlng && latlng.lat !== undefined && latlng.lng !== undefined) {
      setPosition([latlng.lat, latlng.lng]);
    }
  };

  return (
    <div>
      <MapContainer center={position} zoom={13} style={{ height: '400px', width: '100%' }} whenCreated={(map) => map.on('click', handleClick)}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {position && position[0] !== undefined && position[1] !== undefined && (
          <Marker position={position} draggable={true} onDragend={(e) => setPosition(e.target.getLatLng())} />
        )}
        <SearchField onLocationSelect={(loc) => { setPosition([loc.lat, loc.lng]); }} />
      </MapContainer>
      <button onClick={() => onLocationConfirm({ lat: position[0], lng: position[1] })} style={{ marginTop: '10px', display: 'block' }}>Confirm Location</button>
    </div>
  );
};

export default MapComponent;
