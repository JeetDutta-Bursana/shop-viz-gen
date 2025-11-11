import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Globe, 
  User, 
  Settings, 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  RefreshCw, 
  Download, 
  Share2,
  Home,
  Grid3x3,
  CreditCard,
  Languages,
  Moon,
  Sun,
  Key,
  LogOut
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const BursanaAI = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<string>("");
  const [selectedModelType, setSelectedModelType] = useState<string>("");
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedSetting, setSelectedSetting] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [language, setLanguage] = useState("English");
  const [theme, setTheme] = useState("light");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchCredits(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchCredits(session.user.id);
      } else {
        setUser(null);
        setCredits(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle payment success callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');
    
    if (paymentStatus === 'success' && sessionId && user) {
      toast.success("Payment successful! Credits are being added to your account...");
      // Poll for credits update (webhook may take a moment)
      const pollInterval = setInterval(async () => {
        if (user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", user.id)
            .single();

          if (!error && data) {
            const newCredits = data.credits || 0;
            if (newCredits !== credits) {
              setCredits(newCredits);
              toast.success(`Credits updated! You now have ${newCredits} credits.`);
              clearInterval(pollInterval);
              window.history.replaceState({}, '', '/app');
            }
          }
        }
      }, 2000); // Poll every 2 seconds

      // Stop polling after 30 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        if (user) {
          fetchCredits(user.id); // Final fetch
        }
      }, 30000);
    } else if (paymentStatus === 'canceled') {
      toast.error("Payment canceled.");
      window.history.replaceState({}, '', '/app');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchCredits = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setCredits(data.credits || 0);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    }
  };

  // Product types with colors matching the image
  const productTypes = [
    { id: "saree", emoji: "👗", label: "Saree", color: "bg-orange-500" },
    { id: "handbag", emoji: "👜", label: "Handbag", color: "bg-red-500" },
    { id: "footwear", emoji: "👟", label: "Footwear", color: "bg-blue-500" },
    { id: "jewelry", emoji: "💍", label: "Jewelry", color: "bg-purple-500" },
    { id: "gadget", emoji: "📱", label: "Gadget", color: "bg-blue-500" },
  ];

  const modelTypes = ["Female", "Male", "Kids", "Mannequin"];
  const moods = [
    { id: "festival", label: "Festival", color: "bg-purple-500", icon: "🎉" },
    { id: "minimal", label: "Minimal", color: "bg-purple-500", icon: "✨" },
    { id: "professional", label: "Professional", color: "bg-purple-500", icon: "👔" },
    { id: "glamorous", label: "Glamorous", color: "bg-purple-500", icon: "💃" },
  ];
  const settingsOptions = ["Studio", "Outdoor", "Lifestyle", "Catalogue"];

  const languages = ["English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati"];

  // Auto-scroll to step
  useEffect(() => {
    if (containerRef.current && currentStep > 0) {
      const sections = containerRef.current.children;
      if (sections[currentStep]) {
        sections[currentStep].scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [currentStep]);

  // Handle image upload - works for both authenticated and anonymous users
  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // For anonymous users, use data URL directly
    // For authenticated users, upload to Supabase storage
    if (user) {
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        setUploadedImageUrl(publicUrl);
        setCurrentStep(1);
        toast.success("Image uploaded successfully!");
      } catch (error: any) {
        toast.error("Upload failed: " + error.message);
        setUploadedImage(null);
      } finally {
        setIsUploading(false);
      }
    } else {
      // Anonymous user - use data URL directly
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setUploadedImageUrl(dataUrl);
        setCurrentStep(1);
        toast.success("Image ready!");
      };
      reader.readAsDataURL(file);
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
  });

  // Handle product type selection
  const handleProductTypeSelect = (type: string) => {
    setSelectedProductType(type);
    setTimeout(() => setCurrentStep(2), 300);
  };

  // Handle model/mood/setting selection
  const handleModelMoodSettingSelect = async () => {
    if (!selectedModelType || !selectedMood || !selectedSetting) {
      toast.error("Please select all options");
      return;
    }

    if (!uploadedImageUrl) {
      toast.error("Please upload an image first");
      return;
    }

    // For anonymous users, allow them to proceed to payment
    if (!user) {
      toast.info("Sign in to save credits, or continue as guest to purchase");
      // Allow anonymous users to proceed - they'll pay at the end
    } else if (credits <= 0) {
      toast.error("Insufficient credits. Please purchase credits first.");
      setCurrentStep(5);
      return;
    }

    setCurrentStep(3);
    setIsProcessing(true);
    setGenerationProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      // Map selections to filter format
      const filters = {
        modelType: selectedModelType.toLowerCase(),
        background: selectedSetting.toLowerCase(),
        lighting: "studio",
        angle: "front",
        mood: selectedMood.toLowerCase(),
      };

      // For anonymous users, use a temporary user ID or handle differently
      const userId = user?.id || `anonymous_${Date.now()}`;
      
      const { data, error } = await supabase.functions.invoke('generate-product-image', {
        body: {
          originalImageUrl: uploadedImageUrl,
          filters,
          userId: userId,
          isAnonymous: !user, // Flag for anonymous users
        },
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setIsProcessing(false);
        return;
      }

      // Update credits only if user is authenticated
      if (user) {
        setCredits(data.remainingCredits || credits - 1);
      }

      // Set generated images
      if (data.generatedImageUrl) {
        setGeneratedImages([data.generatedImageUrl]);
        setGenerationId(data.generation?.id || null);
      }

      toast.success("Image generated successfully!");
      setIsProcessing(false);
      setCurrentStep(4);
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("Generation error:", error);
      toast.error("Failed to generate image. Please try again.");
      setIsProcessing(false);
    }
  };

  // Pricing plans - matches Pricing.tsx
  const plans = [
    { name: "Single Image", price: "$0.15", credits: 1, description: "Instant download", priceValue: 0.15 },
    { name: "10-Pack", price: "$1.00", credits: 10, description: "Bulk showcase creation", priceValue: 1.00 },
    { name: "Pro Plan", price: "$6.00", credits: 100, description: "Unlimited uploads", priceValue: 6.00 },
  ];

  // Handle sign out
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        toast.error("Failed to sign out. Please try again.");
        return;
      }
      
      // Clear local state
      setUser(null);
      setCredits(0);
      
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error("An error occurred while signing out. Please try again.");
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen overflow-x-hidden relative"
      style={{
        background: "linear-gradient(180deg, #8B5CF6 0%, #F97316 100%)",
      }}
    >
      {/* Sticky Top Bar - Mobile Optimized */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex"
              onClick={() => navigate("/")}
              title="Home"
            >
              <Home className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Bursana AI
            </span>
            {user ? (
              <span className="text-xs sm:text-sm text-gray-600 ml-2">
                ({credits} credits)
              </span>
            ) : (
              <span className="text-xs sm:text-sm text-gray-600 ml-2">
                (Guest)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-24 sm:w-32 h-8 sm:h-9 border-0 bg-transparent text-xs sm:text-sm">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  onClick={() => navigate("/dashboard")}
                  title="Dashboard"
                >
                  <Grid3x3 className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  onClick={handleSignOut}
                  title="Sign Out"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => navigate("/auth")}
                title="Sign In"
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            )}
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Settings</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Theme</Label>
                    <div className="flex items-center space-x-2">
                      <Sun className="w-4 h-4" />
                      <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
                      <Moon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input placeholder="Enter API key" type="password" />
                    <p className="text-xs text-muted-foreground">For future integration</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile First Design */}
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Upload Section */}
        <section className="mb-8 sm:mb-12">
          <div
            {...getRootProps()}
            className="space-y-4"
          >
            <input {...getInputProps()} />
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-base sm:text-lg py-4 sm:py-6 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3"
              disabled={isUploading}
            >
              <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>{isUploading ? "Uploading..." : "Click / Upload Image"}</span>
            </Button>
            <div className="flex gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white border-purple-600 text-sm sm:text-base py-3 sm:py-4 rounded-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.capture = "environment";
                  input.onchange = (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onDrop([file]);
                    }
                  };
                  input.click();
                }}
              >
                From Camera
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white border-purple-600 text-sm sm:text-base py-3 sm:py-4 rounded-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onDrop([file]);
                    }
                  };
                  input.click();
                }}
              >
                From Gallery / Drive
              </Button>
            </div>
          </div>
        </section>

        {/* Section 1: Choose Product Type - Always visible */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-white text-lg sm:text-xl font-bold mb-4 sm:mb-6">Choose Product Type</h2>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {productTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleProductTypeSelect(type.id)}
                className={`flex-shrink-0 w-20 h-20 sm:w-28 sm:h-28 ${type.color} rounded-xl sm:rounded-2xl transition-all flex flex-col items-center justify-center text-white shadow-lg ${
                  selectedProductType === type.id
                    ? "ring-4 ring-white scale-105"
                    : "hover:scale-105"
                }`}
              >
                <div className="text-2xl sm:text-3xl mb-1">{type.emoji}</div>
                <div className="text-xs sm:text-sm font-medium">{type.label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Section 2: Choose Model / Mood / Setting - Always visible */}
        <section className="mb-8 sm:mb-12">
            <h2 className="text-white text-lg sm:text-xl font-bold mb-4 sm:mb-6">Choose Model / Mood / Setting</h2>
            
            {/* Three buttons for Model Type, Mood, Setting - Always visible */}
            <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Button
                variant="outline"
                className={`flex-1 bg-purple-600 hover:bg-purple-700 text-white border-purple-600 text-sm sm:text-base py-3 sm:py-4 rounded-xl ${
                  selectedModelType ? "ring-2 ring-white" : ""
                }`}
                disabled
              >
                Model Type
              </Button>
              <Button
                variant="outline"
                className={`flex-1 bg-purple-600 hover:bg-purple-700 text-white border-purple-600 text-sm sm:text-base py-3 sm:py-4 rounded-xl ${
                  selectedMood ? "ring-2 ring-white" : ""
                }`}
                disabled
              >
                Mood
              </Button>
              <Button
                variant="outline"
                className={`flex-1 bg-purple-600 hover:bg-purple-700 text-white border-purple-600 text-sm sm:text-base py-3 sm:py-4 rounded-xl ${
                  selectedSetting ? "ring-2 ring-white" : ""
                }`}
                disabled
              >
                Setting
              </Button>
            </div>

            {/* Model Type Selection - Always visible */}
            <div className="mb-4">
              <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {modelTypes.map((type) => (
                  <Button
                    key={type}
                    onClick={() => setSelectedModelType(type)}
                    className={`flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base py-3 sm:py-4 px-4 sm:px-6 rounded-xl ${
                      selectedModelType === type ? "ring-2 ring-white" : ""
                    }`}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Mood Selection - Horizontal scrollable squares with avatars */}
            <div className="mb-4">
              <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => setSelectedMood(mood.id)}
                    className={`flex-shrink-0 w-20 h-20 sm:w-28 sm:h-28 ${mood.color} rounded-xl sm:rounded-2xl transition-all flex flex-col items-center justify-center text-white shadow-lg ${
                      selectedMood === mood.id
                        ? "ring-4 ring-white scale-105"
                        : "hover:scale-105"
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl mb-1">{mood.icon}</div>
                    <div className="text-xs sm:text-sm font-medium">{mood.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Setting Selection - Always visible */}
            <div className="mb-4">
              <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {settingsOptions.map((setting) => (
                  <Button
                    key={setting}
                    onClick={() => setSelectedSetting(setting)}
                    className={`flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base py-3 sm:py-4 px-4 sm:px-6 rounded-xl ${
                      selectedSetting === setting ? "ring-2 ring-white" : ""
                    }`}
                  >
                    {setting}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleModelMoodSettingSelect}
              disabled={!selectedModelType || !selectedMood || !selectedSetting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-base sm:text-lg py-4 sm:py-6 rounded-xl sm:rounded-2xl mt-4 sm:mt-6"
            >
              Continue
            </Button>
          </section>

        {/* Section 3: Generating your AI showcase... */}
        {currentStep >= 3 && isProcessing && (
          <section className="mb-8 sm:mb-12">
            <h2 className="text-white text-lg sm:text-xl font-bold mb-4 sm:mb-6">Generating your AI showcase...</h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 space-y-4">
              <Progress 
              value={generationProgress} 
              className="h-2 sm:h-3 bg-white/20 [&>div]:bg-orange-500" 
            />
              <p className="text-white text-sm sm:text-base text-center">please wait 5 seconds</p>
            </div>
          </section>
        )}

        {/* Section 4: Output Preview */}
        {currentStep >= 4 && generatedImages.length > 0 && (
          <section className="mb-8 sm:mb-12">
            <h2 className="text-white text-lg sm:text-xl font-bold mb-4 sm:mb-6">Output Preview</h2>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {generatedImages.map((img, idx) => (
                <div key={idx} className="flex-shrink-0 w-32 h-32 sm:w-48 sm:h-48 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                  <img src={img} alt={`Generated ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <Button 
                variant="outline" 
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20 text-sm sm:text-base py-3 sm:py-4 rounded-xl"
                onClick={() => {
                  setCurrentStep(2);
                  setSelectedModelType("");
                  setSelectedMood("");
                  setSelectedSetting("");
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20 text-sm sm:text-base py-3 sm:py-4 rounded-xl"
                onClick={async () => {
                  if (generatedImages[0]) {
                    try {
                      const response = await fetch(generatedImages[0]);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `bursana-ai-${Date.now()}.jpg`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      toast.success("Image downloaded!");
                    } catch (error) {
                      toast.error("Download failed");
                    }
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20 text-sm sm:text-base py-3 sm:py-4 rounded-xl"
                onClick={async () => {
                  if (generatedImages[0] && navigator.share) {
                    try {
                      const response = await fetch(generatedImages[0]);
                      const blob = await response.blob();
                      const file = new File([blob], "bursana-ai.jpg", { type: "image/jpeg" });
                      await navigator.share({
                        title: "Check out my AI-generated showcase!",
                        files: [file],
                      });
                      toast.success("Shared successfully!");
                    } catch (error) {
                      navigator.clipboard.writeText(generatedImages[0]);
                      toast.success("Link copied to clipboard!");
                    }
                  } else {
                    navigator.clipboard.writeText(generatedImages[0] || "");
                    toast.success("Link copied to clipboard!");
                  }
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
            <Button
              onClick={() => setCurrentStep(5)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-base sm:text-lg py-4 sm:py-6 rounded-xl sm:rounded-2xl mt-4 sm:mt-6"
            >
              Continue to Pricing
            </Button>
          </section>
        )}

        {/* Step 5 - Pricing */}
        {currentStep >= 5 && (
          <section className="mb-8 sm:mb-12">
            <h2 className="text-white text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center">💰 Pick a Plan to Download Without Watermark</h2>
            <div className="space-y-3 sm:space-y-4">
              {plans.map((plan, idx) => (
                <button
                  key={idx}
                  onClick={async () => {
                    try {
                      const priceValue = plan.priceValue || parseFloat(plan.price.replace('$', '').trim());
                      
                      const { data, error } = await supabase.functions.invoke("create-payment", {
                        body: { 
                          amount: priceValue, 
                          credits: plan.credits, 
                          currency: "USD",
                        },
                      });

                      if (error) throw error;
                      if (data?.error) throw new Error(data.error);

                      if (data?.url) {
                        // Redirect to Stripe Checkout
                        window.location.href = data.url;
                      } else {
                        throw new Error("No checkout URL received from payment service");
                      }
                    } catch (error: any) {
                      console.error("Payment error:", error);
                      toast.error(error?.message || "Failed to create payment session");
                      navigate("/pricing");
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 sm:p-6 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/20 rounded-xl sm:rounded-2xl transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-white text-sm sm:text-base">{plan.name}</div>
                    <div className="text-xs sm:text-sm text-white/80">{plan.description}</div>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-white">{plan.price}</div>
                </button>
              ))}
            </div>
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-base sm:text-lg py-4 sm:py-6 rounded-xl sm:rounded-2xl mt-4 sm:mt-6"
              onClick={() => {
                navigate("/pricing");
              }}
            >
              👉 View All Plans
            </Button>
          </section>
        )}
      </div>

      {/* Sticky Footer - Mobile Optimized Navigation */}
      <div className="sticky bottom-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
        <div className="container mx-auto px-4 py-2 sm:py-3">
          <div className="flex items-center justify-around">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 sm:h-12 sm:w-12"
              onClick={() => navigate("/")}
              title="Home"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 sm:h-12 sm:w-12"
              onClick={() => {
                setCurrentStep(0);
                setUploadedImage(null);
                setUploadedImageUrl(null);
                setSelectedProductType("");
                setSelectedModelType("");
                setSelectedMood("");
                setSelectedSetting("");
                setGeneratedImages([]);
              }}
              title="Reset"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 sm:h-12 sm:w-12"
              onClick={() => navigate("/pricing")}
              title="Pricing"
            >
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            {user ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 sm:h-12 sm:w-12"
                onClick={() => navigate("/dashboard")}
                title="Dashboard"
              >
                <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 sm:h-12 sm:w-12"
                onClick={() => navigate("/auth")}
                title="Sign In"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 sm:h-12 sm:w-12"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BursanaAI;

