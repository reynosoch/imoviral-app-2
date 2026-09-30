import React from 'react';

export default function PropertyMap({ lat, lng, ubicacion }) {
  const query = lat && lng ? `${lat},${lng}` : ubicacion;
  return (
    <iframe
      src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
      width="100%"
      height="100%"
      style={{ border: 0, backgroundColor: '#161614' }}
      allowFullScreen=""
      loading="lazy"
    />
  );
}
