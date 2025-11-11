import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, Sparkles, Zap } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import FilterSelector from "@/components/FilterSelector";
import ImageGallery from "@/components/ImageGallery";
import CreditDisplay from "@/components/CreditDisplay";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(5);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    modelType: "",
    background: "",
    lighting: "",
    angle: "",
    mood: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching credits:", error);
    } else {
      setCredits(data?.credits || 0);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleGenerate = async () => {
    if (!uploadedImage || !user) {
      toast.error("Please upload an image first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-image', {
        body: {
          originalImageUrl: uploadedImage,
          filters,
          userId: user.id,
        },
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Lovable AI credits exhausted')) {
          toast.error(data.error, {
            description: "Go to Settings → Workspace → Usage to add credits",
            duration: 8000,
          });
        } else {
          toast.error(data.error);
        }
        return;
      }

      toast.success("Image generated successfully!");
      setCredits(data.remainingCredits);
      
      // Refresh the gallery to show the new image
      window.location.reload();
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Product Studio
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <CreditDisplay credits={credits} />
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Generate Stunning Product Images
          </h1>
          <p className="text-muted-foreground">
            Upload your product photo, select your preferences, and let AI create professional imagery
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <UploadZone
              onImageUploaded={setUploadedImage}
              userId={user.id}
            />
            <FilterSelector
              filters={filters}
              onFiltersChange={setFilters}
            />
            <Button
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-elegant"
              size="lg"
              disabled={!uploadedImage || credits <= 0 || isGenerating}
              onClick={handleGenerate}
            >
              <Zap className="w-5 h-5 mr-2" />
              {isGenerating ? "Generating..." : `Generate Image ${credits <= 0 ? "(No Credits)" : ""}`}
            </Button>
          </div>

          <div>
            <ImageGallery userId={user.id} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
