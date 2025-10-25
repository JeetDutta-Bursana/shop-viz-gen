import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Images } from "lucide-react";
import { toast } from "sonner";

interface Generation {
  id: string;
  original_image_url: string;
  generated_image_url: string | null;
  status: string;
  created_at: string;
}

interface ImageGalleryProps {
  userId: string;
}

const ImageGallery = ({ userId }: ImageGalleryProps) => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenerations();
  }, [userId]);

  const fetchGenerations = async () => {
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
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-product-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
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
    <Card className="shadow-card">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Images className="w-5 h-5 mr-2 text-primary" />
          Your Gallery
        </h3>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : generations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Images className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No images generated yet</p>
            <p className="text-sm">Upload a product image to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto">
            {generations.map((gen) => (
              <div key={gen.id} className="relative group">
                <img
                  src={gen.generated_image_url || gen.original_image_url}
                  alt="Generated product"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                  {gen.generated_image_url && (
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleDownload(gen.generated_image_url!)}
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
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                    Processing...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageGallery;
