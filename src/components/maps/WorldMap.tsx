
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from "lucide-react";

// Token public Mapbox (à remplacer par le vôtre)
mapboxgl.accessToken = 'pk.eyJ1IjoibGV2aXdlYmVydCIsImEiOiJjbHQ2ZTgwbXYwbDVwMm1xaDVvbml6M3B3In0.mSn0V7yLD8lKZqd2nHZtCw';

interface Location {
  id: string;
  type: 'equipment' | 'team';
  name: string;
  latitude: number;
  longitude: number;
  details: string;
}

interface WorldMapProps {
  locations: Location[];
}

const WorldMap = ({ locations }: WorldMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [2.3522, 48.8566], // Paris
      zoom: 5
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setLoading(false);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Mettre à jour les marqueurs quand les locations changent
  useEffect(() => {
    if (!map.current || loading) return;

    // Supprimer les anciens marqueurs qui ne sont plus présents
    Object.entries(markers.current).forEach(([id, marker]) => {
      if (!locations.find(loc => loc.id === id)) {
        marker.remove();
        delete markers.current[id];
      }
    });

    // Ajouter ou mettre à jour les marqueurs
    locations.forEach(location => {
      const el = document.createElement('div');
      el.className = `marker ${location.type === 'equipment' ? 'bg-blue-500' : 'bg-green-500'} w-4 h-4 rounded-full`;

      if (markers.current[location.id]) {
        markers.current[location.id].setLngLat([location.longitude, location.latitude]);
      } else {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-2">
              <h3 class="font-bold">${location.name}</h3>
              <p class="text-sm">${location.details}</p>
            </div>
          `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([location.longitude, location.latitude])
          .setPopup(popup)
          .addTo(map.current);

        markers.current[location.id] = marker;
      }
    });
  }, [locations, loading]);

  return (
    <div className="relative w-full h-[calc(100vh-8rem)] rounded-lg overflow-hidden border border-border">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default WorldMap;
