
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, PlusCircle } from "lucide-react";
import { baseService } from "@/services/supabaseService/baseService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface BaseAutocompleteInputProps {
  value: { id: string | null; label: string };
  onChange: (val: { id: string | null; label: string }) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const BaseAutocompleteInput: React.FC<BaseAutocompleteInputProps> = ({
  value,
  onChange,
  disabled,
  placeholder = "Nom de la base de stockage"
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState(value.label || "");
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [creating, setCreating] = useState(false);

  const { userType } = useAuth();
  const canCreate = userType === "admin";

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInputValue(value.label || "");
  }, [value]);

  // Recherche des bases existantes à chaque frappe
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange({ id: null, label: val });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!val || val.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const allBases = await baseService.getAll();
        setSuggestions(
          allBases.filter((b: any) =>
            b.nom.toLowerCase().includes(val.toLowerCase())
          )
        );
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSuggestionSelect = (base: any) => {
    onChange({ id: base.id, label: base.nom });
    setInputValue(base.nom);
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleNewBase = async () => {
    if (!inputValue.trim()) {
      toast({ title: "Saisir un nom de base", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const newBase = await baseService.create(inputValue.trim());
      onChange({ id: newBase.id, label: newBase.nom });
      toast({ title: "Base ajoutée", description: "Nouvelle base créée !" });
      setShowDropdown(false);
      setSuggestions([]);
    } catch (err: any) {
      toast({ title: "Erreur création base", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative">
      <Input
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled || creating}
        onFocus={() => { if (suggestions.length) setShowDropdown(true); }}
        autoComplete="off"
        className="pr-12"
      />
      {loading && (
        <Loader2 className="animate-spin absolute right-10 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      )}
      {canCreate && inputValue.length >= 2 && !loading && !suggestions.find(b => b.nom.toLowerCase() === inputValue.toLowerCase()) && (
        <button type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm text-blue-700 hover:underline z-20 bg-white px-1 py-0.5 rounded"
          onClick={handleNewBase}
          disabled={creating}
        >
          <PlusCircle className="w-4 h-4" />
          {creating ? "Création..." : "Créer"}
        </button>
      )}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-20 left-0 right-0 bg-white border rounded shadow mt-1 max-h-56 overflow-y-auto">
          {suggestions.map((base) => (
            <div
              key={base.id}
              className="px-4 py-2 hover:bg-blue-100 cursor-pointer flex items-center"
              onClick={() => handleSuggestionSelect(base)}
            >
              <MapPin className="mr-2 w-4 h-4 text-blue-400" />
              <span className="text-sm">{base.nom}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
