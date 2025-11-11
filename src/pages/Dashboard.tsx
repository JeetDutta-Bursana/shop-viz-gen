import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  LogOut, 
  Sparkles, 
  Zap, 
  ShoppingCart, 
  Image as ImageIcon,
  Upload,
  X,
  Globe,
  Settings,
  User as UserIcon,
  Download,
  RefreshCw,
  Edit,
  Coins,
  CreditCard,
  Languages,
  Home
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import CreditDisplay from "@/components/CreditDisplay";
import ImageGallery from "@/components/ImageGallery";
import { useLanguage } from "@/contexts/LanguageContext";
import { languages as availableLanguages } from "@/translations";

const Dashboard = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(5);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [galleryRefreshTrigger, setGalleryRefreshTrigger] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Product Configuration State
  const [selectedProductType, setSelectedProductType] = useState<string>("");
  const [modelConfig, setModelConfig] = useState({
    modelType: "",
    bodyType: "",
    height: [170],
    weight: [65],
    skinTone: "",
    hairType: "",
    hairColor: "",
  });
  const [sceneSettings, setSceneSettings] = useState({
    background: "",
    lighting: "",
    cameraAngle: "",
  });
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [smartFilters, setSmartFilters] = useState({
    backgroundBlur: [0],
    shadowIntensity: [50],
    aiEnhancement: true,
    sharpness: [50],
    colorGrading: "balanced",
  });

  // Product types with gradients
  const productTypes = [
    { id: "saree", emoji: "👗", label: t.productTypes.saree, gradient: "from-purple-500 to-pink-500" },
    { id: "handbag", emoji: "👜", label: t.productTypes.handbag, gradient: "from-orange-500 to-red-500" },
    { id: "footwear", emoji: "👟", label: t.productTypes.footwear, gradient: "from-blue-500 to-cyan-500" },
    { id: "jewelry", emoji: "💍", label: t.productTypes.jewelry, gradient: "from-yellow-500 to-amber-500" },
    { id: "gadget", emoji: "📱", label: t.productTypes.gadget, gradient: "from-green-500 to-emerald-500" },
  ];

  const moods = [
    { id: "festival", label: t.mood.festival, gradient: "from-purple-500 to-pink-500", icon: "🎉" },
    { id: "minimal", label: t.mood.minimal, gradient: "from-gray-400 to-gray-600", icon: "✨" },
    { id: "professional", label: t.mood.professional, gradient: "from-blue-500 to-indigo-500", icon: "👔" },
    { id: "glamorous", label: t.mood.glamorous, gradient: "from-pink-500 to-rose-500", icon: "💃" },
    { id: "editorial", label: t.mood.editorial, gradient: "from-gray-600 to-black", icon: "📸" },
    { id: "vintage", label: t.mood.vintage, gradient: "from-amber-600 to-orange-600", icon: "📻" },
    { id: "luxury", label: t.mood.luxury, gradient: "from-yellow-500 to-amber-500", icon: "💎" },
    { id: "trendy", label: t.mood.trendy, gradient: "from-purple-500 to-blue-500", icon: "🔥" },
    { id: "ethereal", label: t.mood.ethereal, gradient: "from-blue-300 to-purple-300", icon: "✨" },
  ];

  const backgrounds = [
    { id: "studio", label: t.backgrounds.studio, icon: "🎬" },
    { id: "outdoor", label: t.backgrounds.outdoor, icon: "🌳" },
    { id: "lifestyle", label: t.backgrounds.lifestyle, icon: "🏠" },
    { id: "catalogue", label: t.backgrounds.catalogue, icon: "📖" },
    { id: "festive", label: t.backgrounds.festive, icon: "🎊" },
    { id: "minimal", label: t.backgrounds.minimal, icon: "⬜" },
    { id: "abstract", label: t.backgrounds.abstract, icon: "🎨" },
    { id: "solid", label: t.backgrounds.solid, icon: "🎨" },
  ];

  const lightingStyles = [
    t.lighting.soft,
    t.lighting.bright,
    t.lighting.dramatic,
    t.lighting.golden,
    t.lighting.studio,
    t.lighting.highKey,
    t.lighting.flat,
  ];

  const cameraAngles = [
    { id: "eye-level", label: t.angles.eyeLevel, icon: "👁️" },
    { id: "high-angle", label: t.angles.highAngle, icon: "⬇️" },
    { id: "low-angle", label: t.angles.lowAngle, icon: "⬆️" },
    { id: "close-up", label: t.angles.closeUp, icon: "🔍" },
    { id: "mid-shot", label: t.angles.midShot, icon: "📷" },
    { id: "full-body", label: t.angles.fullBody, icon: "👤" },
    { id: "45-perspective", label: t.angles.perspective45, icon: "📐" },
  ];

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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      toast.success("Payment successful! Credits are being added to your account...");
      const pollInterval = setInterval(async () => {
        if (user) {
          try {
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("credits")
              .eq("id", user.id)
              .single();

            if (!error && profile) {
              const newCredits = profile.credits ?? 5;
              if (newCredits !== credits) {
                setCredits(newCredits);
                toast.success(`Credits updated! You now have ${newCredits} credits.`);
                clearInterval(pollInterval);
                window.history.replaceState({}, '', '/dashboard');
              }
            }
          } catch (error) {
            console.error("Error polling credits:", error);
          }
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        fetchCredits();
      }, 30000);
    } else if (paymentStatus === 'canceled') {
      toast.error("Payment canceled.");
      window.history.replaceState({}, '', '/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchCredits = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();
      
      if (error) {
        // Profile doesn't exist - create it with 5 free credits
        console.log("Profile not found, creating with 5 free credits");
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            credits: 5
          })
          .select()
          .single();
        
        if (createError) {
          console.error("Error creating profile:", createError);
          // Even if creation fails, set to 5 as default for new users
          setCredits(5);
        } else {
          setCredits(newProfile?.credits || 5);
        }
      } else {
        // Profile exists - use credits from database, default to 5 if null
        const userCredits = profile?.credits;
        if (userCredits === null || userCredits === undefined) {
          // Credits is null - update to 5
          await supabase
            .from("profiles")
            .update({ credits: 5 })
            .eq("id", user.id);
          setCredits(5);
        } else {
          setCredits(userCredits);
        }
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
      // Default to 5 credits for new users
      setCredits(5);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        toast.error(t.messages.signOutFailed);
        return;
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setCredits(5);
      
      toast.success(t.messages.signOutSuccess);
      navigate("/");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(t.messages.signOutFailed);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t.messages.pleaseUploadImage);
      return;
    }

    setIsUploading(true);
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

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
      toast.success(t.messages.uploadSuccess);
    } catch (error: any) {
      toast.error(t.messages.uploadFailed + ": " + error.message);
      setUploadedImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
  });

  const handleGenerate = async () => {
    // Validation
    if (!uploadedImageUrl || !user) {
      toast.error(t.messages.pleaseUploadImage);
      return;
    }

    if (!selectedProductType) {
      toast.error(t.messages.pleaseSelectProductType);
      return;
    }

    if (credits <= 0) {
      toast.error(t.messages.insufficientCredits);
      navigate("/pricing");
      return;
    }

    // Send original filter values - backend now handles all variations
    // No need to map to simplified values anymore

    setIsGenerating(true);
    try {
      const filters = {
        modelType: modelConfig.modelType || "female",
        bodyType: modelConfig.bodyType || "",
        height: modelConfig.height[0],
        weight: modelConfig.weight[0],
        skinTone: modelConfig.skinTone || "",
        hairType: modelConfig.hairType || "",
        hairColor: modelConfig.hairColor || "",
        background: sceneSettings.background || "",
        lighting: sceneSettings.lighting || "",
        angle: sceneSettings.cameraAngle || "",
        mood: selectedMood || "",
        productType: selectedProductType,
        backgroundBlur: smartFilters.backgroundBlur[0],
        shadowIntensity: smartFilters.shadowIntensity[0],
        aiEnhancement: smartFilters.aiEnhancement,
        sharpness: smartFilters.sharpness[0],
        colorGrading: smartFilters.colorGrading,
      };

      // Note: We don't check credits here anymore because:
      // 1. The Edge Function will handle credit initialization for new users
      // 2. The Edge Function has better logic to handle edge cases
      // 3. Frontend credit state might be stale
      // Just log the current state for debugging
      console.log("Current credits in frontend state:", credits);
      console.log("Calling Edge Function - it will handle credit checks and initialization");

      // Call Edge Function and handle response
      let response;
      try {
        response = await supabase.functions.invoke('generate-product-image', {
          body: {
            originalImageUrl: uploadedImageUrl,
            filters,
            userId: user.id,
          },
        });
      } catch (err: any) {
        // If invoke throws, wrap it in the expected format
        response = { data: null, error: err };
      }

      const { data, error } = response;

      // Log full response for debugging
      console.log("Edge Function response:", { data, error });
      
      // Try to extract error message from response body if error exists
      let errorMessageFromBody = null;
      if (error && (error as any).context) {
        try {
          // Try to read the response body if available
          const responseBody = (error as any).context.body;
          if (responseBody) {
            const parsedBody = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
            errorMessageFromBody = parsedBody?.error || parsedBody?.message;
            console.log("Error message from response body:", errorMessageFromBody);
          }
        } catch (e) {
          console.log("Could not parse error body:", e);
        }
      }

      // Handle errors from Edge Function (non-2xx status codes)
      if (error) {
        console.error("Edge Function error:", error);
        console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        
        let errorMessage = t.messages.generationFailed;
        let shouldNavigateToPricing = false;
        
        // Try to extract status code from various possible locations
        const errorStatus = (error as any)?.context?.status 
          || (error as any)?.status 
          || (error as any)?.response?.status
          || (error as any)?.statusCode
          || (error as any)?.code;
        
        console.log("Detected error status:", errorStatus);
        console.log("Current credits in state:", credits);
        
        // Handle specific status codes
        if (errorStatus === 402) {
          // Check if we got an error message from the response body
          if (errorMessageFromBody) {
            errorMessage = errorMessageFromBody;
            console.log("Error message from response body:", errorMessageFromBody);
            
            // Check if this is a Lovable API error (not a credits error)
            if (errorMessageFromBody.includes('Lovable') || 
                errorMessageFromBody.includes('AI service') || 
                errorMessageFromBody.includes('API key') ||
                errorMessageFromBody.includes('lovable_api')) {
              console.error("🚨 This is a Lovable API error, not a credits error!");
              console.error("The Lovable API key may need payment or has reached its limit.");
              shouldNavigateToPricing = false;
              // Don't show "insufficient credits" - show the actual error
              errorMessage = errorMessageFromBody;
            } else {
              // This might be a credits error, check database
              errorMessage = t.messages.insufficientCredits;
            }
          } else {
            // No error message - assume it's a credits issue
            errorMessage = t.messages.insufficientCredits;
          }
          
          // Double-check credits in database to see what's actually stored
          console.log("⚠️ 402 error received, checking credits in database...");
          try {
            const { data: creditCheck, error: creditError } = await supabase
              .from("profiles")
              .select("credits")
              .eq("id", user.id)
              .single();
            
            if (!creditError && creditCheck) {
              console.log("Credits in database when 402 received:", creditCheck);
              const dbCredits = creditCheck.credits ?? 0;
              
              // If database shows credits but Edge Function returned 402, 
              // this is a bug - the Edge Function should have set credits to 5
              if (dbCredits > 0) {
                console.error("🚨 BUG DETECTED: Database has credits but Edge Function returned 402!");
                console.error("This means the Edge Function needs to be redeployed with the latest code.");
                errorMessage = "An error occurred. The Edge Function may need to be updated. Please refresh the page and try again.";
                // Don't navigate to pricing if we have credits
                shouldNavigateToPricing = false;
                
                // Try to refresh credits and retry
                await fetchCredits();
              } else if (dbCredits === 0) {
                // Database confirms 0 credits - try to set them to 5
                console.log("Database has 0 credits. Attempting to set to 5...");
                const { error: updateError } = await supabase
                  .from("profiles")
                  .update({ credits: 5, free_credits_remaining: 5 })
                  .eq("id", user.id);
                
                if (updateError) {
                  console.error("Failed to update credits:", updateError);
                  errorMessage = t.messages.insufficientCredits;
                  shouldNavigateToPricing = true;
                  setCredits(0);
                } else {
                  console.log("Successfully set credits to 5. Please try generating again.");
                  errorMessage = "Credits have been set to 5. Please try generating again.";
                  shouldNavigateToPricing = false;
                  await fetchCredits();
                }
              } else {
                // Database confirms 0 credits
                errorMessage = t.messages.insufficientCredits;
                shouldNavigateToPricing = true;
                setCredits(0);
              }
            } else {
              console.error("Error fetching credits:", creditError);
              errorMessage = t.messages.insufficientCredits;
              shouldNavigateToPricing = true;
            }
          } catch (e) {
            console.error("Error checking credits:", e);
            errorMessage = t.messages.insufficientCredits;
            shouldNavigateToPricing = true;
          }
          
          // Refresh credits display
          await fetchCredits();
        } else if (errorStatus === 400) {
          errorMessage = "Invalid request. Please check your inputs.";
        } else if (errorStatus === 404) {
          errorMessage = "User profile not found. Please ensure you are signed in.";
        } else if (errorStatus === 429) {
          errorMessage = "Rate limit exceeded. Please try again later.";
        } else if (errorStatus === 500) {
          errorMessage = "Server error. Please try again later.";
        } else {
          // For unknown errors, check actual credits in database before assuming 402
          console.log("Unknown error status, checking credits in database...");
          try {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("credits")
              .eq("id", user.id)
              .single();
            
            if (!profileError && profile) {
              const currentCredits = profile?.credits ?? 0;
              console.log("Credits in database:", currentCredits);
              
              // Only show insufficient credits if database shows 0 credits
              if (currentCredits <= 0) {
                errorMessage = t.messages.insufficientCredits;
                shouldNavigateToPricing = true;
                setCredits(0);
              } else {
                // User has credits, so this is a different error
                errorMessage = "An error occurred while generating the image. Please try again.";
                console.error("Error occurred despite having credits:", currentCredits);
              }
            } else {
              console.error("Error fetching profile:", profileError);
              errorMessage = "An error occurred while generating the image. Please try again.";
            }
          } catch (e) {
            console.error("Error checking credits:", e);
            errorMessage = "An error occurred while generating the image. Please try again.";
          }
        }
        
        // Try to extract error message from error object (but don't override status-based messages)
        if (error.message && 
            error.message !== 'Edge Function returned a non-2xx status code' &&
            errorStatus === undefined) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
        
        if (shouldNavigateToPricing) {
          setTimeout(() => {
            navigate("/pricing");
          }, 2000);
        }
        
        setIsGenerating(false);
        return;
      }

      // Check if response data contains an error field (Edge Function returned error in JSON body)
      if (data && typeof data === 'object' && 'error' in data) {
        console.error("Error in response data:", data.error);
        toast.error(data.error);
        setIsGenerating(false);
        return;
      }

      // Check if we didn't get valid response data
      if (!data) {
        console.error("No data in response");
        toast.error(t.messages.generationFailed);
        setIsGenerating(false);
        return;
      }

      // Check if we got the expected generated image URL
      if (!data.generatedImageUrl) {
        console.error("Invalid response data - missing generatedImageUrl:", data);
        toast.error(t.messages.generationFailed);
        setIsGenerating(false);
        return;
      }

      toast.success(t.messages.imageGenerated);
      
      // Update credits
      if (data.remainingCredits !== undefined) {
        setCredits(data.remainingCredits);
      }
      
      // Reset form after successful generation
      setGalleryRefreshTrigger(prev => prev + 1);
      
      // Optional: Clear form or keep settings
      // Uncomment below if you want to reset after generation
      // setSelectedProductType("");
      // setModelConfig({ modelType: "", bodyType: "", height: [170], weight: [65], skinTone: "", hairType: "", hairColor: "" });
      // setSceneSettings({ background: "", lighting: "", cameraAngle: "" });
      // setSelectedMood("");
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error?.message || t.messages.generationFailed);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="hidden sm:flex"
              title={t.header.home}
            >
              <Home className="w-4 h-4 mr-1" />
              <span className="hidden lg:inline">{t.header.home}</span>
            </Button>
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-lg font-bold text-gray-900">
              {t.header.title}
            </span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <CreditDisplay credits={credits} onClick={() => navigate("/pricing")} />
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-28 h-9">
                <Languages className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t.settings.title}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>{t.settings.language}</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLanguages.map((lang) => (
                          <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={handleSignOut}
              title={t.header.signOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section A: Upload Product Image */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-purple-600" />
                  {t.upload.title}
                </h2>
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mb-4" />
                    <p className="text-sm text-gray-600">{t.upload.uploading}</p>
                  </div>
                ) : uploadedImage ? (
                  <div className="relative group">
                    <img
                      src={uploadedImage}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => {
                          setUploadedImage(null);
                          setUploadedImageUrl(null);
                          setSelectedProductType("");
                          setModelConfig({ modelType: "", bodyType: "", height: [170], weight: [65], skinTone: "", hairType: "", hairColor: "" });
                          setSceneSettings({ background: "", lighting: "", cameraAngle: "" });
                          setSelectedMood("");
                        }}
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        title={t.upload.removeImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-gray-900 px-3 py-1 rounded-lg text-xs">
                      {t.upload.uploaded}
                    </div>
                  </div>
                ) : (
                  <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragActive ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-purple-400"
                  }`}>
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                    <p className="text-sm font-medium mb-2 text-gray-900">
                      {t.upload.dragDrop}
                    </p>
                    <p className="text-xs text-gray-500 mb-4">{t.upload.fileTypes}</p>
                    <p className="text-xs text-gray-500 mt-4">
                      {t.upload.hint}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section B: Choose Product Type */}
            {uploadedImage && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                    {t.productTypes.title}
                    {selectedProductType && (
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        ({productTypes.find(type => type.id === selectedProductType)?.label})
                      </span>
                    )}
                  </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {productTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedProductType(type.id);
                        toast.success(`${type.label} ${t.messages.selected}`);
                      }}
                      className={`relative h-24 rounded-xl bg-gradient-to-br ${type.gradient} text-gray-900 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl ${
                        selectedProductType === type.id
                          ? "ring-4 ring-white ring-offset-2 ring-offset-purple-200 scale-105 animate-pulse-glow"
                          : "hover-lift"
                      }`}
                      title={`${t.messages.selected} ${type.label}`}
                    >
                      <div className="text-3xl mb-1 transition-transform duration-300 hover:scale-110">{type.emoji}</div>
                      <div className="text-xs font-medium">{type.label}</div>
                      {selectedProductType === type.id && (
                        <div className="absolute -top-2 -right-2 bg-white rounded-full p-1">
                          <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-gray-900 text-xs">✓</span>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Section C: Model Configuration */}
            {selectedProductType && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">{t.model.title}</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t.model.modelType} *</Label>
                        <Select 
                          value={modelConfig.modelType} 
                          onValueChange={(v) => {
                            setModelConfig({...modelConfig, modelType: v});
                            const modelTypeLabels: Record<string, string> = {
                              female: t.model.female,
                              male: t.model.male,
                              kids: t.model.kids,
                              mannequin: t.model.mannequin,
                            };
                            toast.success(`${t.model.modelType}: ${modelTypeLabels[v] || v}`);
                          }}
                        >
                        <SelectTrigger className={modelConfig.modelType ? "border-purple-400" : ""}>
                          <SelectValue placeholder={t.model.modelType} />
                        </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="female">👩 {t.model.female}</SelectItem>
                            <SelectItem value="male">👨 {t.model.male}</SelectItem>
                            <SelectItem value="kids">👶 {t.model.kids}</SelectItem>
                            <SelectItem value="mannequin">🛍️ {t.model.mannequin}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.model.bodyType}</Label>
                        <Select value={modelConfig.bodyType} onValueChange={(v) => setModelConfig({...modelConfig, bodyType: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder={t.model.bodyType} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slim">{t.bodyTypes.slim}</SelectItem>
                            <SelectItem value="athletic">{t.bodyTypes.athletic}</SelectItem>
                            <SelectItem value="curvy">{t.bodyTypes.curvy}</SelectItem>
                            <SelectItem value="plus-size">{t.bodyTypes["plus-size"]}</SelectItem>
                            <SelectItem value="petite">{t.bodyTypes.petite}</SelectItem>
                            <SelectItem value="muscular">{t.bodyTypes.muscular}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.model.height}: {modelConfig.height[0]} cm</Label>
                        <Slider
                          value={modelConfig.height}
                          onValueChange={(v) => setModelConfig({...modelConfig, height: v})}
                          min={140}
                          max={200}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.model.weight}: {modelConfig.weight[0]} kg</Label>
                        <Slider
                          value={modelConfig.weight}
                          onValueChange={(v) => setModelConfig({...modelConfig, weight: v})}
                          min={40}
                          max={120}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.model.skinTone}</Label>
                        <Select value={modelConfig.skinTone} onValueChange={(v) => setModelConfig({...modelConfig, skinTone: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder={t.model.skinTone} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fair">{t.skinTones.fair}</SelectItem>
                            <SelectItem value="medium">{t.skinTones.medium}</SelectItem>
                            <SelectItem value="olive">{t.skinTones.olive}</SelectItem>
                            <SelectItem value="tan">{t.skinTones.tan}</SelectItem>
                            <SelectItem value="dark">{t.skinTones.dark}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.model.hairType}</Label>
                        <Select value={modelConfig.hairType} onValueChange={(v) => setModelConfig({...modelConfig, hairType: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder={t.model.hairType} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="straight">{t.hairTypes.straight}</SelectItem>
                            <SelectItem value="wavy">{t.hairTypes.wavy}</SelectItem>
                            <SelectItem value="curly">{t.hairTypes.curly}</SelectItem>
                            <SelectItem value="coily">{t.hairTypes.coily}</SelectItem>
                            <SelectItem value="bald">{t.hairTypes.bald}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.model.hairColor}</Label>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { key: "black", label: t.hairColors.black },
                            { key: "brown", label: t.hairColors.brown },
                            { key: "blonde", label: t.hairColors.blonde },
                            { key: "red", label: t.hairColors.red },
                            { key: "grey", label: t.hairColors.grey },
                            { key: "custom", label: t.hairColors.custom },
                          ].map((color) => (
                            <button
                              key={color.key}
                              onClick={() => setModelConfig({...modelConfig, hairColor: color.key})}
                              className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-all ${
                                modelConfig.hairColor === color.key
                                  ? "border-purple-400 bg-purple-100 text-purple-700"
                                  : "border-gray-300 hover:border-purple-400 hover:bg-purple-50 text-gray-700"
                              }`}
                            >
                              {color.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center bg-gray-100 rounded-2xl p-8">
                      <div className="text-center w-full">
                        <div className="text-6xl mb-4">
                          {modelConfig.modelType === "male" ? "👨" : 
                           modelConfig.modelType === "kids" ? "👶" : 
                           modelConfig.modelType === "mannequin" ? "🛍️" : "👩"}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-2">{t.model.preview}</p>
                        <div className="space-y-1 text-xs text-gray-600">
                          {modelConfig.modelType && (
                            <p className="font-medium">{t.model.type}: {modelConfig.modelType === "female" ? t.model.female : modelConfig.modelType === "male" ? t.model.male : modelConfig.modelType === "kids" ? t.model.kids : t.model.mannequin}</p>
                          )}
                          {modelConfig.bodyType && (
                            <p>{t.model.body}: {t.bodyTypes[modelConfig.bodyType as keyof typeof t.bodyTypes] || modelConfig.bodyType}</p>
                          )}
                          {modelConfig.skinTone && (
                            <p>{t.model.skin}: {t.skinTones[modelConfig.skinTone as keyof typeof t.skinTones] || modelConfig.skinTone}</p>
                          )}
                          {modelConfig.hairType && (
                            <p>{t.model.hair}: {t.hairTypes[modelConfig.hairType as keyof typeof t.hairTypes] || modelConfig.hairType} {modelConfig.hairColor && `(${t.hairColors[modelConfig.hairColor as keyof typeof t.hairColors] || modelConfig.hairColor})`}</p>
                          )}
                          {!modelConfig.modelType && (
                            <p className="text-gray-500 italic">{t.model.selectModelOptions}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section D: Visual Scene Settings */}
            {selectedProductType && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">{t.scene.title}</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>{t.scene.background}</Label>
                      <Select 
                        value={sceneSettings.background} 
                        onValueChange={(v) => {
                          setSceneSettings({...sceneSettings, background: v});
                          toast.success(`${t.scene.background}: ${backgrounds.find(b => b.id === v)?.label || v}`);
                        }}
                      >
                        <SelectTrigger className={sceneSettings.background ? "border-purple-400" : ""}>
                          <SelectValue placeholder={t.scene.background} />
                        </SelectTrigger>
                        <SelectContent>
                          {backgrounds.map((bg) => (
                            <SelectItem key={bg.id} value={bg.id}>
                              <span className="flex items-center">
                                <span className="mr-2">{bg.icon}</span>
                                {bg.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700">{t.scene.lighting}</Label>
                      <Select 
                        value={sceneSettings.lighting} 
                        onValueChange={(v) => {
                          setSceneSettings({...sceneSettings, lighting: v});
                          const lightingLabel = lightingStyles.find(l => l.toLowerCase().replace(/\s+/g, '-') === v) || v;
                          toast.success(`${t.scene.lighting}: ${lightingLabel}`);
                        }}
                      >
                        <SelectTrigger className={sceneSettings.lighting ? "border-purple-400" : ""}>
                          <SelectValue placeholder={t.scene.lighting} />
                        </SelectTrigger>
                        <SelectContent>
                          {lightingStyles.map((light) => (
                            <SelectItem key={light} value={light.toLowerCase().replace(/\s+/g, '-')}>
                              {light}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700">{t.scene.cameraAngle}</Label>
                      <Select 
                        value={sceneSettings.cameraAngle} 
                        onValueChange={(v) => {
                          setSceneSettings({...sceneSettings, cameraAngle: v});
                          toast.success(`${t.scene.cameraAngle}: ${cameraAngles.find(a => a.id === v)?.label || v}`);
                        }}
                      >
                        <SelectTrigger className={sceneSettings.cameraAngle ? "border-purple-400" : ""}>
                          <SelectValue placeholder={t.scene.cameraAngle} />
                        </SelectTrigger>
                        <SelectContent>
                          {cameraAngles.map((angle) => (
                            <SelectItem key={angle.id} value={angle.id}>
                              <span className="flex items-center">
                                <span className="mr-2">{angle.icon}</span>
                                {angle.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section E: Mood & Aesthetic */}
            {selectedProductType && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">{t.mood.title}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {moods.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => {
                        setSelectedMood(mood.id);
                        toast.success(`${mood.label} ${t.messages.selected}`);
                      }}
                      className={`relative h-20 rounded-xl bg-gradient-to-br ${mood.gradient} text-gray-900 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl ${
                        selectedMood === mood.id
                          ? "ring-4 ring-white ring-offset-2 ring-offset-purple-200 scale-105 animate-pulse-glow"
                          : "hover-lift"
                      }`}
                      title={`${t.messages.selected} ${mood.label}`}
                    >
                      <div className="text-2xl mb-1 transition-transform duration-300 hover:scale-110">{mood.icon}</div>
                      <div className="text-xs font-medium">{mood.label}</div>
                      {selectedMood === mood.id && (
                        <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                          <div className="w-3 h-3 bg-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-gray-900 text-[8px]">✓</span>
                          </div>
                        </div>
                      )}
                    </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section F: Smart Filters */}
            {selectedProductType && (
              <Card className="   transition-shadow">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">{t.filters.title}</h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium text-gray-700">{t.filters.backgroundBlur}</Label>
                        <span className="text-sm font-semibold text-purple-600">{smartFilters.backgroundBlur[0]}%</span>
                      </div>
                      <Slider
                        value={smartFilters.backgroundBlur}
                        onValueChange={(v) => setSmartFilters({...smartFilters, backgroundBlur: v})}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium text-gray-700">{t.filters.shadowIntensity}</Label>
                        <span className="text-sm font-semibold text-purple-600">{smartFilters.shadowIntensity[0]}%</span>
                      </div>
                      <Slider
                        value={smartFilters.shadowIntensity}
                        onValueChange={(v) => setSmartFilters({...smartFilters, shadowIntensity: v})}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg ">
                      <Label className="font-medium text-gray-700">{t.filters.aiEnhancement}</Label>
                      <Switch
                        checked={smartFilters.aiEnhancement}
                        onCheckedChange={(checked) => {
                          setSmartFilters({...smartFilters, aiEnhancement: checked});
                          toast.success(`${t.filters.aiEnhancement} ${checked ? t.generate.enabled : t.generate.disabled}`);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium text-gray-700">{t.filters.sharpness}</Label>
                        <span className="text-sm font-semibold text-purple-600">{smartFilters.sharpness[0]}%</span>
                      </div>
                      <Slider
                        value={smartFilters.sharpness}
                        onValueChange={(v) => setSmartFilters({...smartFilters, sharpness: v})}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium text-gray-700">{t.filters.colorGrading}</Label>
                      <Select 
                        value={smartFilters.colorGrading} 
                        onValueChange={(v) => {
                          setSmartFilters({...smartFilters, colorGrading: v});
                          const colorLabels: Record<string, string> = {
                            warm: t.filters.warm,
                            cool: t.filters.cool,
                            balanced: t.filters.balanced,
                            vibrant: t.filters.vibrant,
                            monochrome: t.filters.monochrome,
                          };
                          toast.success(`${t.filters.colorGrading}: ${colorLabels[v] || v}`);
                        }}
                      >
                        <SelectTrigger className={smartFilters.colorGrading ? "border-purple-400" : ""}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="warm">🔥 {t.filters.warm}</SelectItem>
                          <SelectItem value="cool">❄️ {t.filters.cool}</SelectItem>
                          <SelectItem value="balanced">⚖️ {t.filters.balanced}</SelectItem>
                          <SelectItem value="vibrant">🌈 {t.filters.vibrant}</SelectItem>
                          <SelectItem value="monochrome">⚫ {t.filters.monochrome}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section H: Generate CTA */}
            {selectedProductType && uploadedImageUrl && (
              <Card>
                <CardContent className="p-6">
                  {isGenerating && (
                    <div className="mb-4">
                      <Progress value={undefined} className="h-2" />
                      <p className="text-sm text-center text-gray-600 mt-2">{t.generate.generatingHint}</p>
                    </div>
                  )}
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 text-white text-lg py-6 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    size="lg"
                    disabled={isGenerating || credits <= 0}
                    onClick={handleGenerate}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        {t.generate.generating}
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        ⚡ {t.generate.title}
                      </>
                    )}
                  </Button>
                    <div className="mt-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Coins className="w-4 h-4 text-yellow-600" />
                      <p className={`text-sm font-medium ${credits > 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        {credits} {credits === 1 ? t.generate.credit : t.generate.credits} {t.generate.creditsAvailable}
                      </p>
                    </div>
                    {credits <= 0 && (
                      <Button
                        variant="outline"
                        onClick={() => navigate("/pricing")}
                        className="mt-2"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {t.generate.buyCredits}
                      </Button>
                    )}
                    <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                      <p className="text-xs font-medium mb-1">{t.generate.generationSettings}:</p>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <p>• {t.generate.product}: {productTypes.find(type => type.id === selectedProductType)?.label}</p>
                        {modelConfig.modelType && <p>• {t.generate.model}: {modelConfig.modelType === "female" ? t.model.female : modelConfig.modelType === "male" ? t.model.male : modelConfig.modelType === "kids" ? t.model.kids : t.model.mannequin}</p>}
                        {sceneSettings.background && <p>• {t.generate.background}: {backgrounds.find(b => b.id === sceneSettings.background)?.label || sceneSettings.background}</p>}
                        {selectedMood && <p>• {t.generate.mood}: {moods.find(m => m.id === selectedMood)?.label || selectedMood}</p>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Preview Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
              <CardContent className="p-6 flex flex-col h-full">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-purple-600" />
                  {t.gallery.title}
                </h3>
                <div className="flex-1 overflow-y-auto">
            <ImageGallery userId={user.id} refreshTrigger={galleryRefreshTrigger} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t bg-white">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-600">
            {t.footer.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
