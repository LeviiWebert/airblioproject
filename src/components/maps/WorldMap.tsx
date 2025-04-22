
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Token Mapbox temporaire à remplacer (nous utiliserons une input pour permettre à l'utilisateur de saisir son propre token)
mapboxgl.accessToken = '';

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
  const [mapboxToken, setMapboxToken] = useState<string>(mapboxgl.accessToken);
  const [tokenInputVisible, setTokenInputVisible] = useState<boolean>(!mapboxgl.accessToken);
  const [error, setError] = useState<string | null>(null);

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;
    
    setError(null);
    setLoading(true);

    try {
      // Appliquer le token d'accès
      mapboxgl.accessToken = mapboxToken;
      
      // Initialiser la carte
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [2.3522, 48.8566], // Paris
        zoom: 2, // Niveau de zoom plus bas pour voir plus de territoire
        minZoom: 1.5, // Limiter le zoom minimum pour une meilleure expérience
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setLoading(false);
      });

      map.current.on('error', (e) => {
        console.error("Erreur de carte Mapbox:", e);
        setError("Erreur lors du chargement de la carte. Veuillez vérifier votre token Mapbox.");
        setLoading(false);
        setTokenInputVisible(true);
      });
    } catch (err) {
      console.error("Erreur d'initialisation de la carte:", err);
      setError("Erreur lors de l'initialisation de la carte. Veuillez vérifier votre token Mapbox.");
      setLoading(false);
      setTokenInputVisible(true);
    }
  };

  // Initialiser la carte au chargement du composant
  useEffect(() => {
    if (!tokenInputVisible) {
      initializeMap();
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [tokenInputVisible]);

  // Mettre à jour les marqueurs quand les locations changent
  useEffect(() => {
    if (!map.current || loading || !mapboxToken) return;

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
  }, [locations, loading, mapboxToken]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapboxToken) {
      setTokenInputVisible(false);
      // La carte sera initialisée grâce à l'effet useEffect
    }
  };

  if (tokenInputVisible) {
    return (
      <div className="w-full h-[calc(100vh-8rem)] bg-background border border-border rounded-lg p-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full space-y-4">
          <h2 className="text-xl font-bold text-center">Configuration de la carte</h2>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <p className="text-sm text-muted-foreground text-center">
            Pour utiliser la carte, veuillez entrer votre token d'accès Mapbox.<br />
            Vous pouvez l'obtenir en vous inscrivant sur <a href="https://www.mapbox.com/" target="_blank" rel="noreferrer" className="text-primary underline">mapbox.com</a>
          </p>
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <Input
              type="text"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              placeholder="Entrez votre token d'accès Mapbox"
              className="w-full"
            />
            <Button type="submit" className="w-full">Appliquer</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-8rem)] rounded-lg overflow-hidden border border-border">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-destructive/10 border border-destructive text-destructive p-3 rounded-md z-40">
          <p>{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setTokenInputVisible(true)} 
            className="mt-2"
          >
            Configurer le token
          </Button>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default WorldMap;
