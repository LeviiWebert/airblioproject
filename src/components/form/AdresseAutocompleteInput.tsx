
import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";

interface AdresseAutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MAPBOX_TOKEN = "pk.eyJ1IjoiYWlyYmxpbyIsImEiOiJjanFjYXJuaTYwMnFjM3BvZXdheGVham0zIn0.w9fouWiIW1B7dVet6y44zw";

export const AdresseAutocompleteInput: React.FC<AdresseAutocompleteInputProps> = ({
  value,
  onChange,
  placeholder = "123 rue de la Mer, 13000 Marseille",
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    setLoading(true);
    timeoutRef.current = setTimeout(() => {
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&language=fr`)
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
        disabled={disabled}
        onFocus={() => { if (suggestions.length) setShowDropdown(true); }}
        autoComplete="off"
        className="pr-10"
      />
      {loading && (
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
    </div>
  );
};
