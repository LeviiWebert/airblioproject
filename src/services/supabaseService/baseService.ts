
import { supabase } from "@/integrations/supabase/client";

// Liste toutes les bases existantes
const getAll = async () => {
  const { data, error } = await supabase
    .from("bases")
    .select("*")
    .order("nom", { ascending: true });
  if (error) throw error;
  return data;
};

// Crée une nouvelle base (réservé admin et interne)
const create = async (nom: string, description?: string) => {
  const { data, error } = await supabase
    .from("bases")
    .insert([{ nom, description }])
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const baseService = {
  getAll,
  create,
};
