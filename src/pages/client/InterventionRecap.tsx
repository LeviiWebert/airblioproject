
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, ArrowLeft, Calendar, MapPin, Users, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InterventionStatusBadge } from "@/components/interventions/InterventionStatusBadge";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast as sonnerToast } from "sonner";

const InterventionRecap = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [intervention, setIntervention] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [equipe, setEquipe] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchIntervention = async () => {
      try {
        // Récupérer les détails de la demande d'intervention
        const { data: demandeData, error: demandeError } = await supabase
          .from('demande_interventions')
          .select(`
            id,
            date_demande,
            description,
            urgence,
            statut,
            intervention_id,
            client_id
          `)
          .eq('id', id)
          .single();

        if (demandeError) throw demandeError;

        if (!demandeData) {
          toast({
            title: "Intervention non trouvée",
            description: "Impossible de trouver les détails de cette intervention.",
            variant: "destructive"
          });
          navigate("/client-dashboard");
          return;
        }

        // Si une intervention est associée, récupérer ses détails
        let interventionDetails = null;
        let equipeDetails = null;

        if (demandeData.intervention_id) {
          const { data: interventionData, error: interventionError } = await supabase
            .from('interventions')
            .select(`
              id,
              date_debut,
              date_fin,
              statut,
              rapport,
              localisation
            `)
            .eq('id', demandeData.intervention_id)
            .single();

          if (!interventionError && interventionData) {
            interventionDetails = interventionData;

            // Récupérer les détails de l'équipe affectée
            const { data: equipeData } = await supabase
              .from('intervention_equipes')
              .select(`
                equipes (
                  id,
                  nom,
                  specialisation
                )
              `)
              .eq('intervention_id', interventionData.id);

            if (equipeData && equipeData.length > 0) {
              equipeDetails = equipeData.map(item => item.equipes);
            }
          }
        }

        // Combiner toutes les données
        setIntervention({
          ...demandeData,
          interventionDetails,
        });
        
        setEquipe(equipeDetails);
      } catch (error: any) {
        console.error("Erreur lors de la récupération des données:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement des détails de l'intervention.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchIntervention();
    }
  }, [id, navigate, toast]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    
    setIsGeneratingPDF(true);
    sonnerToast("Génération du PDF en cours...");
    
    try {
      const content = contentRef.current;
      const canvas = await html2canvas(content, {
        scale: 2, // Using the correct scale property for better quality
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Récapitulatif_intervention_${id}.pdf`);
      
      sonnerToast.success("Le récapitulatif de l'intervention a été téléchargé.");
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      sonnerToast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8 print:py-4 print:px-2">
        {/* Header avec boutons non imprimables */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Imprimer
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              <Download className="mr-2 h-4 w-4" /> 
              {isGeneratingPDF ? "Génération..." : "Télécharger PDF"}
            </Button>
          </div>
        </div>

        {/* En-tête du document imprimable */}
        <div className="print:block hidden mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Airblio</h1>
              <p className="text-sm text-gray-500">123 Avenue de la Mer, 13000 Marseille</p>
            </div>
            <div className="text-right">
              <p className="text-sm">Date d'impression: {format(new Date(), "dd/MM/yyyy", { locale: fr })}</p>
            </div>
          </div>
        </div>

        {intervention ? (
          <Card className="shadow-md print:shadow-none print:border-none" ref={contentRef}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl">Récapitulatif d'intervention</CardTitle>
                  <CardDescription>
                    Numéro d'intervention: {intervention.id.substring(0, 8).toUpperCase()}
                  </CardDescription>
                </div>
                <div className="print:block hidden">
                  <p className="text-sm text-gray-500">
                    Date de création: {format(new Date(intervention.date_demande), "dd/MM/yyyy", { locale: fr })}
                  </p>
                </div>
                <div>
                  <InterventionStatusBadge status={intervention.statut} />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Informations générales */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <ClipboardList className="mr-2 h-5 w-5 text-primary" /> 
                  Détails de la demande
                </h3>
                <div className="bg-slate-50 p-4 rounded-md space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Statut actuel</p>
                      <div className="mt-1">
                        <InterventionStatusBadge status={intervention.statut} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Niveau d'urgence</p>
                      <div className="mt-1">
                        <PriorityBadge priority={intervention.urgence} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="mt-1 text-sm">{intervention.description}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Date de la demande</p>
                    <p className="mt-1">
                      {format(new Date(intervention.date_demande), "dd MMMM yyyy à HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations de l'intervention planifiée */}
              {intervention.interventionDetails && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-primary" /> 
                    Détails de l'intervention
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-md space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Date de début</p>
                        <p className="mt-1">
                          {intervention.interventionDetails.date_debut ? 
                            format(new Date(intervention.interventionDetails.date_debut), "dd MMMM yyyy à HH:mm", { locale: fr }) :
                            "Non définie"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Date de fin estimée</p>
                        <p className="mt-1">
                          {intervention.interventionDetails.date_fin ? 
                            format(new Date(intervention.interventionDetails.date_fin), "dd MMMM yyyy à HH:mm", { locale: fr }) :
                            "Non définie"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 flex items-center">
                        <MapPin className="mr-1 h-4 w-4" /> Lieu d'intervention
                      </p>
                      <p className="mt-1">{intervention.interventionDetails.localisation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Équipe technique affectée */}
              {equipe && equipe.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Users className="mr-2 h-5 w-5 text-primary" /> 
                    Équipe technique affectée
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-md">
                    <div className="space-y-2">
                      {equipe.map((team: any, index: number) => (
                        <div key={index} className="p-2 border rounded-md">
                          <p className="font-medium">{team.nom}</p>
                          {team.specialisation && (
                            <Badge variant="outline" className="mt-1">{team.specialisation}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-4 border-t print:hidden">
              <div className="text-sm text-gray-500 w-full">
                <p>Pour toute question concernant cette intervention, veuillez contacter notre service client.</p>
              </div>
              <div className="flex justify-between w-full">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Retour
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimer
                  </Button>
                  <Button 
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                  >
                    <Download className="mr-2 h-4 w-4" /> 
                    {isGeneratingPDF ? "Génération..." : "Télécharger PDF"}
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <p>Aucune intervention trouvée avec cet identifiant.</p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/client-dashboard")}
                  className="mt-4"
                >
                  Retourner au tableau de bord
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientLayout>
  );
};

export default InterventionRecap;
