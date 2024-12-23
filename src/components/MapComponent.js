import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
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
      autoClose: false,
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
  const [position, setPosition] = useState([51.505, -0.09]); // Default location (London)
  const [map, setMap] = useState(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const setUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setPosition([latitude, longitude]);
            if (map) {
              map.setView([latitude, longitude], 13);
            }
          },
          (error) => {
            console.error('Error fetching location', error);
          }
        );
      }
    };

    setUserLocation();
  }, [map]);

  const handleMapMove = () => {
    if (map) {
      const center = map.getCenter();
      setPosition([center.lat, center.lng]);
    }
  };

  const handleMapMoveStart = () => {
    setAnimating(true);
  };

  const handleMapMoveEnd = () => {
    setAnimating(false);
  };

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

  const confirmLocation = async () => {
    const address = await getAddress(position[0], position[1]);
    onLocationConfirm({ lat: position[0], lng: position[1], address });
  };

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '400px', width: '100%' }}
        whenCreated={(mapInstance) => {
          setMap(mapInstance);
          mapInstance.on('move', handleMapMove);
          mapInstance.on('movestart', handleMapMoveStart);
          mapInstance.on('moveend', handleMapMoveEnd);
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <SearchField onLocationSelect={(loc) => { setPosition([loc.lat, loc.lng]); }} />
      </MapContainer>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -100%)',
          transition: animating ? 'transform 0.3s ease-out' : 'transform 0.1s ease-in',
          zIndex: 1000,
        }}
      >
        <img
          src="https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png"
          alt="Marker"
          style={{ width: '25px', height: '41px' }}
        />
      </div>
      <button onClick={confirmLocation} style={{ marginTop: '10px', display: 'block' }}>Confirm Location</button>
    </div>
  );
};

export default MapComponent;
