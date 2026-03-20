import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Location } from '../types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createCustomIcon(index: number, isSelected: boolean) {
  const color = isSelected ? '#f59e0b' : '#d6d3d1';
  const size = isSelected ? 36 : 28;
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid ${isSelected ? '#fff8e7' : '#1c1917'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      ">
        <span style="
          transform: rotate(45deg);
          color: ${isSelected ? '#1c1917' : '#1c1917'};
          font-size: ${isSelected ? '13px' : '10px'};
          font-weight: 700;
          font-family: system-ui;
          line-height: 1;
        ">${index + 1}</span>
      </div>
    `,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function FitBounds({ locations }: { locations: Location[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;
    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 13);
      return;
    }
    const bounds = L.latLngBounds(locations.map((l) => [l.lat, l.lng]));
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [locations, map]);

  return null;
}

interface Props {
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (loc: Location) => void;
}

export default function MapView({ locations, selectedLocation, onSelectLocation }: Props) {
  const polylinePositions = locations
    .slice()
    .sort((a, b) => (a.startTime?.getTime() ?? 0) - (b.startTime?.getTime() ?? 0))
    .map((l) => [l.lat, l.lng] as [number, number]);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        <FitBounds locations={locations} />

        {polylinePositions.length > 1 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#f59e0b',
              weight: 2,
              opacity: 0.5,
              dashArray: '6 8',
            }}
          />
        )}

        {locations.map((loc, idx) => (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={createCustomIcon(idx, selectedLocation?.id === loc.id)}
            eventHandlers={{ click: () => onSelectLocation(loc) }}
          >
            <Popup className="memory-popup">
              <div className="bg-stone-900 text-stone-100 rounded-lg p-3 min-w-[160px]">
                <p className="font-medium text-sm text-amber-400 mb-1">{loc.name}</p>
                {loc.city && <p className="text-stone-400 text-xs">{loc.city}{loc.country ? `, ${loc.country}` : ''}</p>}
                <p className="text-stone-500 text-xs mt-1">{loc.photos.length} photo{loc.photos.length !== 1 ? 's' : ''}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
