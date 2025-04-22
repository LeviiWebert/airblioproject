
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
  const isTokenLoading = useRef(false);
  const isMapInitializing = useRef(false);
  const { toast } = useToast();

  // Chargement du token depuis Supabase
  const loadMapboxToken = async () => {
    // Éviter les appels multiples
    if (isTokenLoading.current) {
      console.log("Chargement du token déjà en cours, requête ignorée");
      return false;
    }

    try {
      isTokenLoading.current = true;
      console.log("Chargement du token Mapbox depuis Supabase");
      const { data, error: tokenError } = await supabase
        .from('configurations')
        .select('value')
        .eq('key', 'mapbox_token')
        .maybeSingle();

      if (tokenError) {
        console.error("Erreur lors du chargement du token:", tokenError);
        throw tokenError;
      }
      
      if (data?.value) {
        console.log("Token Mapbox trouvé");
        setMapboxToken(data.value);
        return true;
      }
      console.log("Aucun token Mapbox trouvé");
      return false;
    } catch (err) {
      console.error("Erreur lors du chargement du token:", err);
      setError("Erreur lors du chargement du token Mapbox. Veuillez vérifier votre connexion.");
      return false;
    } finally {
      isTokenLoading.current = false;
    }
  };

  // Sauvegarde du token dans Supabase
  const saveMapboxToken = async (token: string) => {
    if (!token.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le token Mapbox ne peut pas être vide.",
      });
      return;
    }

    try {
      console.log("Sauvegarde du token Mapbox");
      const { error: updateError } = await supabase
        .from('configurations')
        .upsert({ key: 'mapbox_token', value: token });

      if (updateError) throw updateError;
      
      setMapboxToken(token);
      setTokenInputVisible(false);
      toast({
        title: "Token mis à jour",
        description: "Le token Mapbox a été mis à jour avec succès.",
      });
      
      // Réinitialisation de la carte avec le nouveau token
      cleanupMap();
      setTimeout(() => initializeMap(token), 100);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du token:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder le token Mapbox.",
      });
    }
  };

  // Nettoyage de la carte
  const cleanupMap = () => {
    if (map.current) {
      console.log("Nettoyage de la carte existante");
      map.current.remove();
      map.current = null;
      markers.current = {};
      setMapInitialized(false);
    }
  };

  // Initialisation de la carte Mapbox
  const initializeMap = (token: string) => {
    if (!mapContainer.current || !token || token.trim() === '') {
      console.log("Impossible d'initialiser la carte: conteneur ou token manquant");
      return;
    }
    
    // Éviter l'initialisation multiple
    if (map.current || isMapInitializing.current) {
      console.log("Carte déjà initialisée ou en cours d'initialisation");
      return;
    }
    
    setError(null);
    setLoading(true);
    isMapInitializing.current = true;
    console.log("Initialisation de la carte Mapbox");

    try {
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [2.3522, 48.8566],
        zoom: 2,
        minZoom: 1.5,
      });

      // Ajouter les contrôles une fois que la carte est chargée
      map.current.on('load', () => {
        if (map.current) {
          console.log("Carte chargée avec succès");
          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
          map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
          setMapInitialized(true);
          setLoading(false);
          isMapInitializing.current = false;
          
          // Ajouter les marqueurs après le chargement
          addMarkersToMap();
        }
      });

      map.current.on('error', (e) => {
        console.error("Erreur de carte Mapbox:", e);
        setError("Erreur lors du chargement de la carte. Veuillez vérifier votre token Mapbox.");
        setLoading(false);
        setTokenInputVisible(true);
        isMapInitializing.current = false;
      });
    } catch (err) {
      console.error("Erreur d'initialisation de la carte:", err);
      setError("Erreur lors de l'initialisation de la carte. Veuillez vérifier votre token Mapbox.");
      setLoading(false);
      setTokenInputVisible(true);
      isMapInitializing.current = false;
    }
  };

  // Ajout des marqueurs sur la carte
  const addMarkersToMap = () => {
    if (!map.current || !mapInitialized) {
      console.log("Impossible d'ajouter les marqueurs: carte non initialisée");
      return;
    }

    console.log(`Ajout de ${locations.length} marqueurs à la carte`);

    // Supprimer les marqueurs qui ne sont plus présents
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
    console.log("Effet de montage du composant WorldMap");
    const setupMap = async () => {
      const hasToken = await loadMapboxToken();
      console.log("Token Mapbox mis à jour", { hasToken });
      
      if (hasToken && mapboxToken) {
        console.log("Token trouvé, initialisation de la carte");
        initializeMap(mapboxToken);
      } else {
        console.log("Aucun token trouvé, affichage du formulaire");
        setTokenInputVisible(true);
        setLoading(false);
      }
    };
    
    setupMap();
    
    // Cleanup au démontage
    return () => {
      console.log("Nettoyage du composant WorldMap");
      cleanupMap();
    };
  }, []);

  // Effet pour initialiser la carte quand le token change
  useEffect(() => {
    console.log("Effet de mise à jour du token Mapbox", { hasToken: !!mapboxToken });
    if (mapboxToken && !map.current && !isMapInitializing.current) {
      initializeMap(mapboxToken);
    }
  }, [mapboxToken]);

  // Mettre à jour les marqueurs quand les locations changent
  useEffect(() => {
    console.log("Mise à jour des marqueurs", { locationsCount: locations.length });
    if (map.current && mapInitialized) {
      addMarkersToMap();
    }
  }, [locations, mapInitialized]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Soumission du token");
    if (mapboxToken.trim()) {
      saveMapboxToken(mapboxToken);
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer un token Mapbox valide.",
      });
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
