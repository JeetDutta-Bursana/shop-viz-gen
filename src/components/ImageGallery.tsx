import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Trash2, Images, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { downloadImageWithWatermark } from "@/utils/watermark";

interface Generation {
  id: string;
  original_image_url: string;
  generated_image_url: string | null;
  status: string;
  created_at: string;
  is_free_credit?: boolean;
}

interface ImageGalleryProps {
  userId: string;
  onRefresh?: () => void;
  refreshTrigger?: number;
}

const ImageGallery = ({ userId, refreshTrigger }: ImageGalleryProps) => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchGenerations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load gallery");
    } else {
      setGenerations(data || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations, refreshTrigger]);

  // Poll for pending generations every 5 seconds
  useEffect(() => {
    const hasPendingGenerations = generations.some(gen => gen.status === "pending");
    
    if (hasPendingGenerations) {
      pollingIntervalRef.current = setInterval(() => {
        fetchGenerations();
      }, 5000); // Poll every 5 seconds
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [generations, fetchGenerations]);

  const handleDownload = async (imageUrl: string, isFreeCredit: boolean = false) => {
    try {
      await downloadImageWithWatermark(
        imageUrl,
        isFreeCredit,
        `ai-product-${Date.now()}.jpg`
      );
    } catch (error) {
      toast.error("Download failed");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("generations").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Deleted successfully");
      fetchGenerations();
    }
  };

  return (
    <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Images className="w-5 h-5 mr-2 text-purple-600" />
          Your Gallery
        </h3>

        {loading ? (
          <div className="text-center py-8 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-purple-600" />
            <p className="text-gray-600">Loading gallery...</p>
          </div>
        ) : generations.length === 0 ? (
          <div className="text-center py-8">
            <Images className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
            <p className="text-gray-600">No images generated yet</p>
            <p className="text-sm text-gray-500">Upload a product image to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto">
            {generations.map((gen) => {
              const isFreeCredit = gen.is_free_credit === true;
              return (
                <Card key={gen.id} className="relative group overflow-hidden">
                  <div className="relative">
                    <img
                      src={gen.generated_image_url || gen.original_image_url}
                      alt="Generated product"
                      className="w-full h-48 object-cover"
                    />
                    {/* Watermark overlay for free credit images */}
                    {isFreeCredit && gen.generated_image_url && (
                      <div className="absolute bottom-2 right-2 pointer-events-none z-10">
                        <div className="bg-white/90 px-2 py-1 rounded-lg shadow-md">
                          <img
                            src="/bursana-logo.svg"
                            alt="BURSANA"
                            className="h-6 w-auto opacity-90"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    {gen.generated_image_url && (
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleDownload(gen.generated_image_url!, isFreeCredit)}
                        title={isFreeCredit ? "Download with watermark" : "Download"}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(gen.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {gen.status === "pending" && (
                    <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
                      <div className="bg-white px-4 py-2 rounded-lg flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Processing...</span>
                      </div>
                    </div>
                  )}
                  {!gen.generated_image_url && gen.status !== "pending" && (
                    <div className="absolute top-2 right-2 bg-gray-100 px-2 py-1 rounded text-xs">
                      <span className="text-xs font-medium text-gray-700">Original</span>
                    </div>
                  )}
                  {isFreeCredit && gen.generated_image_url && (
                    <div className="absolute top-2 left-2 bg-orange-100 px-2 py-1 rounded text-xs font-medium">
                      <span className="text-xs font-medium text-orange-700">Watermarked</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
    </div>
  );
};

export default ImageGallery;
