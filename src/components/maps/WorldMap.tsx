
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [tokenInputVisible, setTokenInputVisible] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState<boolean>(false);
  const { toast } = useToast();

  const loadMapboxToken = async () => {
    try {
      const { data, error: tokenError } = await supabase
        .from('configurations')
        .select('value')
        .eq('key', 'mapbox_token')
        .single();

      if (tokenError) throw tokenError;
      
      if (data?.value) {
        setMapboxToken(data.value);
        mapboxgl.accessToken = data.value;
        return true;
      }
      return false;
    } catch (err) {
      console.error("Erreur lors du chargement du token:", err);
      setError("Erreur lors du chargement du token Mapbox.");
      return false;
    }
  };

  const saveMapboxToken = async (token: string) => {
    try {
      const { error: updateError } = await supabase
        .from('configurations')
        .upsert({ key: 'mapbox_token', value: token });

      if (updateError) throw updateError;
      
      setMapboxToken(token);
      mapboxgl.accessToken = token;
      setTokenInputVisible(false);
      toast({
        title: "Token mis à jour",
        description: "Le token Mapbox a été mis à jour avec succès.",
      });
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      initializeMap();
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du token:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder le token Mapbox.",
      });
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;
    
    // Éviter l'initialisation multiple de la carte
    if (map.current) return;
    
    setError(null);
    setLoading(true);

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [2.3522, 48.8566],
        zoom: 2,
        minZoom: 1.5,
        maxParallelImageRequests: 10, // Optimisation des requêtes d'images
        attributionControl: false, // Désactiver le contrôle d'attribution pour optimiser le chargement
      });

      // Ajouter les contrôles une fois que la carte est chargée
      map.current.once('load', () => {
        if (map.current) {
          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
          map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
          setMapInitialized(true);
          setLoading(false);
          
          // Ajouter les marqueurs après le chargement de la carte
          addMarkersToMap();
        }
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

  // Fonction séparée pour ajouter les marqueurs à la carte
  const addMarkersToMap = () => {
    if (!map.current || !mapInitialized) return;

    // Supprimer les marqueurs qui ne sont plus présents dans les emplacements
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
  };

  // Chargement initial du token
  useEffect(() => {
    loadMapboxToken().then((hasToken) => {
      if (hasToken) {
        initializeMap();
      } else {
        setTokenInputVisible(true);
      }
    });
    
    // Cleanup au démontage
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Mettre à jour les marqueurs quand les locations changent
  useEffect(() => {
    if (map.current && mapInitialized) {
      addMarkersToMap();
    }
  }, [locations, mapInitialized]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapboxToken) {
      saveMapboxToken(mapboxToken);
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
    <div className="space-y-4">
      <div className="relative w-full h-[calc(100vh-12rem)] rounded-lg overflow-hidden border border-border">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-50">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Chargement de la carte en cours...</p>
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
      
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setTokenInputVisible(true)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Configurer le token Mapbox
        </Button>
      </div>
    </div>
  );
};

export default WorldMap;
