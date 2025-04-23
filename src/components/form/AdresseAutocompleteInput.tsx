
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdresseAutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const AdresseAutocompleteInput: React.FC<AdresseAutocompleteInputProps> = ({
  value,
  onChange,
  placeholder = "123 rue de la Mer, 13000 Marseille",
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Récupère le token Mapbox depuis Supabase
    const fetchToken = async () => {
      setTokenLoading(true);
      setTokenError(null);
      try {
        const { data, error } = await supabase
          .from("configurations")
          .select("value")
          .eq("key", "mapbox_token")
          .maybeSingle();
        if (error) throw error;
        if (data && data.value) {
          setMapboxToken(data.value);
        } else {
          setMapboxToken(null);
          setTokenError("Aucun token Mapbox configuré.");
        }
      } catch (err) {
        setMapboxToken(null);
        setTokenError("Erreur lors du chargement du token Mapbox.");
      } finally {
        setTokenLoading(false);
      }
    };

    fetchToken();
  }, []);

  // Handle user typing with debounce
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!val || val.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    if (!mapboxToken) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    timeoutRef.current = setTimeout(() => {
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${mapboxToken}&autocomplete=true&limit=5&language=fr`)
        .then(resp => resp.json())
        .then(json => {
          setSuggestions(json.features || []);
          setShowDropdown(true);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 350);
  };

  const handleSuggestionSelect = (suggestion: any) => {
    onChange(suggestion.place_name);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled || tokenLoading}
        onFocus={() => { if (suggestions.length) setShowDropdown(true); }}
        autoComplete="off"
        className="pr-10"
      />
      {tokenLoading && (
        <Loader2 className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      )}
      {loading && !tokenLoading && (
        <Loader2 className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      )}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-20 left-0 right-0 bg-white border rounded shadow mt-1 max-h-56 overflow-y-auto">
          {suggestions.map((opt: any) => (
            <div
              key={opt.id}
              className="px-4 py-2 hover:bg-blue-100 cursor-pointer flex items-center"
              onClick={() => handleSuggestionSelect(opt)}
            >
              <MapPin className="mr-2 w-4 h-4 text-blue-400" />
              <span className="text-sm">{opt.place_name}</span>
            </div>
          ))}
        </div>
      )}
      {!tokenLoading && tokenError && (
        <div className="absolute left-0 right-0 mt-2 text-xs text-red-500 bg-red-50 px-2 py-1 rounded z-30">
          {tokenError}
        </div>
      )}
    </div>
  );
};
