import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  LogOut, 
  Sparkles, 
  Zap, 
  Camera, 
  Image as ImageIcon,
  Upload,
  X,
  Settings,
  Shield,
  RefreshCw,
  Coins,
  Crown,
  Users,
  BarChart3,
  Home
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import ImageGallery from "@/components/ImageGallery";

// Admin email list - you can move this to environment variables or database
const ADMIN_EMAILS = [
  "admin@bursana.ai",
  "admin@example.com",
  "bursana.jeet@gmail.com",
  // Add more admin emails here
];

const Admin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [galleryRefreshTrigger, setGalleryRefreshTrigger] = useState(0);
  
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
    { id: "saree", emoji: "👗", label: "Saree", gradient: "from-purple-500 to-pink-500" },
    { id: "handbag", emoji: "👜", label: "Handbag", gradient: "from-orange-500 to-red-500" },
    { id: "footwear", emoji: "👟", label: "Footwear", gradient: "from-blue-500 to-cyan-500" },
    { id: "jewelry", emoji: "💍", label: "Jewelry", gradient: "from-yellow-500 to-amber-500" },
    { id: "gadget", emoji: "📱", label: "Gadget", gradient: "from-green-500 to-emerald-500" },
  ];

  const moods = [
    { id: "festival", label: "Festival", gradient: "from-purple-500 to-pink-500", icon: "🎉" },
    { id: "minimal", label: "Minimal", gradient: "from-gray-400 to-gray-600", icon: "✨" },
    { id: "professional", label: "Professional", gradient: "from-blue-500 to-indigo-500", icon: "👔" },
    { id: "glamorous", label: "Glamorous", gradient: "from-pink-500 to-rose-500", icon: "💃" },
    { id: "editorial", label: "Editorial", gradient: "from-gray-600 to-black", icon: "📸" },
    { id: "vintage", label: "Vintage", gradient: "from-amber-600 to-orange-600", icon: "📻" },
    { id: "luxury", label: "Luxury", gradient: "from-yellow-500 to-amber-500", icon: "💎" },
    { id: "trendy", label: "Trendy", gradient: "from-purple-500 to-blue-500", icon: "🔥" },
    { id: "ethereal", label: "Ethereal", gradient: "from-blue-300 to-purple-300", icon: "✨" },
  ];

  const backgrounds = [
    { id: "studio", label: "Studio", icon: "🎬" },
    { id: "outdoor", label: "Outdoor", icon: "🌳" },
    { id: "lifestyle", label: "Lifestyle", icon: "🏠" },
    { id: "catalogue", label: "Catalogue", icon: "📖" },
    { id: "festive", label: "Festive", icon: "🎊" },
    { id: "minimal", label: "Minimal", icon: "⬜" },
    { id: "abstract", label: "Abstract", icon: "🎨" },
    { id: "solid", label: "Solid Color", icon: "🎨" },
  ];

  const lightingStyles = [
    "Soft / Diffused",
    "Bright / Natural",
    "Dramatic Shadows",
    "Golden Hour",
    "Studio Spotlight",
    "High Key / Low Key",
    "Flat / Even Lighting",
  ];

  const cameraAngles = [
    { id: "eye-level", label: "Eye-level", icon: "👁️" },
    { id: "high-angle", label: "High angle", icon: "⬇️" },
    { id: "low-angle", label: "Low angle", icon: "⬆️" },
    { id: "close-up", label: "Close-up", icon: "🔍" },
    { id: "mid-shot", label: "Mid-shot", icon: "📷" },
    { id: "full-body", label: "Full body", icon: "👤" },
    { id: "45-perspective", label: "45° perspective", icon: "📐" },
  ];

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkAdminAccess(session.user);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else if (session.user) {
        await checkAdminAccess(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminAccess = async (user: User) => {
    // Check admin status (with fallback)
    const userEmail = user.email?.toLowerCase();
    console.log("Checking admin access for:", userEmail);
    console.log("Admin emails list:", ADMIN_EMAILS);
    
    const hasAdminAccessByEmail = userEmail && ADMIN_EMAILS.some(adminEmail => 
      adminEmail.toLowerCase() === userEmail
    );
    console.log("Has admin access by email:", hasAdminAccessByEmail);
    
    // Try to check is_admin field if it exists
    let hasAdminAccess = hasAdminAccessByEmail;
    try {
      const { data: adminProfile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin, email")
        .eq("id", user.id)
        .single();
      
      if (profileError) {
        console.log("Profile query error (this is OK if is_admin field doesn't exist):", profileError);
      } else {
        console.log("Profile data:", adminProfile);
        const isAdminByField = (adminProfile as any)?.is_admin === true;
        console.log("Is admin by field:", isAdminByField);
        hasAdminAccess = isAdminByField || hasAdminAccessByEmail;
      }
    } catch (error) {
      // is_admin field doesn't exist yet, use email check
      console.log("Error checking is_admin field (using email check):", error);
      hasAdminAccess = hasAdminAccessByEmail;
    }
    
    console.log("Final admin access result:", hasAdminAccess);
    
    if (!hasAdminAccess) {
      console.error("Access denied. User email:", userEmail, "Admin emails:", ADMIN_EMAILS);
      toast.error(`Access denied. Admin privileges required. Your email: ${userEmail || 'unknown'}`);
      navigate("/dashboard");
      return;
    }
    
    setIsAdmin(true);
    toast.success("Welcome, Admin!");
  };

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
      setSession(null);
      setIsAdmin(false);
      
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error("An error occurred while signing out. Please try again.");
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    
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
      toast.success("Image uploaded successfully!");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
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
    if (!uploadedImageUrl || !user) {
      toast.error("Please upload an image first");
      return;
    }

    if (!selectedProductType) {
      toast.error("Please select a product type");
      return;
    }

    // Map functions
    const mapLighting = (lighting: string) => {
      const mapping: Record<string, string> = {
        "soft-/-diffused": "soft",
        "bright-/-natural": "natural",
        "dramatic-shadows": "dramatic",
        "golden-hour": "natural",
        "studio-spotlight": "studio",
        "high-key-/-low-key": "dramatic",
        "flat-/-even-lighting": "soft",
      };
      return mapping[lighting.toLowerCase().replace(/\s+/g, '-')] || lighting.toLowerCase().replace(/\s+/g, '-') || "soft";
    };

    const mapAngle = (angle: string) => {
      const mapping: Record<string, string> = {
        "eye-level": "front",
        "high-angle": "overhead",
        "low-angle": "front",
        "close-up": "closeup",
        "mid-shot": "three-quarter",
        "full-body": "front",
        "45-perspective": "three-quarter",
      };
      return mapping[angle] || angle || "front";
    };

    const mapMood = (mood: string) => {
      const moodMap: Record<string, string> = {
        "festival": "vibrant",
        "minimal": "minimal",
        "professional": "elegant",
        "glamorous": "elegant",
        "editorial": "elegant",
        "vintage": "casual",
        "luxury": "elegant",
        "trendy": "vibrant",
        "ethereal": "minimal",
      };
      return moodMap[mood] || mood || "elegant";
    };

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
        background: sceneSettings.background || "studio",
        lighting: mapLighting(sceneSettings.lighting || "soft"),
        angle: mapAngle(sceneSettings.cameraAngle || "eye-level"),
        mood: mapMood(selectedMood || "professional"),
        productType: selectedProductType,
        backgroundBlur: smartFilters.backgroundBlur[0],
        shadowIntensity: smartFilters.shadowIntensity[0],
        aiEnhancement: smartFilters.aiEnhancement,
        sharpness: smartFilters.sharpness[0],
        colorGrading: smartFilters.colorGrading,
        isAdmin: true, // Flag for admin bypass
      };

      const { data, error } = await supabase.functions.invoke('generate-product-image', {
        body: {
          originalImageUrl: uploadedImageUrl,
          filters,
          userId: user.id,
          isAdmin: true, // Admin bypass for credits
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Image generated successfully! (Admin - No credits deducted)");
      setGalleryRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error?.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">Admin privileges required</p>
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-x-hidden"
      style={{
        background: "linear-gradient(180deg, #8B5CF6 0%, #F97316 50%, #EC4899 100%)",
      }}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="hidden sm:flex"
              title="Home"
            >
              <Home className="w-4 h-4 mr-1" />
              <span className="hidden lg:inline">Home</span>
            </Button>
            <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Admin Panel
              </span>
              <p className="text-xs text-gray-500">Unlimited Access</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-bold">∞ Unlimited</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => navigate("/dashboard")}
              title="Go to Dashboard"
            >
              <Users className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={handleSignOut}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Same as Dashboard but with admin badge */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-xl">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            <p className="text-sm font-semibold text-yellow-800">
              Admin Mode: Unlimited image generation with no credit restrictions
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-xl rounded-2xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-purple-600" />
                  Upload Product Image
                </h2>
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mb-4" />
                    <p className="text-sm text-gray-600">Uploading image...</p>
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
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded-lg text-xs">
                      ✓ Image uploaded
                    </div>
                  </div>
                ) : (
                  <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragActive ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-purple-400"
                  }`}>
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                    <p className="text-sm font-medium mb-2">
                      Drag & drop or click to upload your product image
                    </p>
                    <p className="text-xs text-gray-500 mb-4">PNG, JPG, JPEG, WEBP</p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.capture = "environment";
                          input.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) onDrop([file]);
                          };
                          input.click();
                        }}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        From Camera
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) onDrop([file]);
                          };
                          input.click();
                        }}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        From Gallery / Drive
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Type Selection */}
            <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-xl rounded-2xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                  Choose Product Type
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {productTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedProductType(type.id)}
                      className={`relative h-24 rounded-xl bg-gradient-to-br ${type.gradient} text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl ${
                        selectedProductType === type.id
                          ? "ring-4 ring-white ring-offset-2 ring-offset-purple-200 scale-105"
                          : "hover-lift"
                      }`}
                    >
                      <div className="text-3xl mb-1">{type.emoji}</div>
                      <div className="text-xs font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Model Configuration */}
            {selectedProductType && (
              <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-xl rounded-2xl animate-fadeIn">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Customize Model Appearance</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Model Type</Label>
                        <Select value={modelConfig.modelType} onValueChange={(v) => setModelConfig({...modelConfig, modelType: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select model type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="female">👩 Female</SelectItem>
                            <SelectItem value="male">👨 Male</SelectItem>
                            <SelectItem value="kids">👶 Kids</SelectItem>
                            <SelectItem value="mannequin">🛍️ Mannequin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Body Type</Label>
                        <Select value={modelConfig.bodyType} onValueChange={(v) => setModelConfig({...modelConfig, bodyType: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select body type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slim">Slim</SelectItem>
                            <SelectItem value="athletic">Athletic</SelectItem>
                            <SelectItem value="curvy">Curvy</SelectItem>
                            <SelectItem value="plus-size">Plus-size</SelectItem>
                            <SelectItem value="petite">Petite</SelectItem>
                            <SelectItem value="muscular">Muscular</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Height: {modelConfig.height[0]} cm</Label>
                        <Slider
                          value={modelConfig.height}
                          onValueChange={(v) => setModelConfig({...modelConfig, height: v})}
                          min={140}
                          max={200}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Weight: {modelConfig.weight[0]} kg</Label>
                        <Slider
                          value={modelConfig.weight}
                          onValueChange={(v) => setModelConfig({...modelConfig, weight: v})}
                          min={40}
                          max={120}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Skin Tone</Label>
                        <Select value={modelConfig.skinTone} onValueChange={(v) => setModelConfig({...modelConfig, skinTone: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select skin tone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="olive">Olive</SelectItem>
                            <SelectItem value="tan">Tan</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Hair Type</Label>
                        <Select value={modelConfig.hairType} onValueChange={(v) => setModelConfig({...modelConfig, hairType: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select hair type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="straight">Straight</SelectItem>
                            <SelectItem value="wavy">Wavy</SelectItem>
                            <SelectItem value="curly">Curly</SelectItem>
                            <SelectItem value="coily">Coily</SelectItem>
                            <SelectItem value="bald">Bald</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Hair Color</Label>
                        <div className="flex gap-2 flex-wrap">
                          {["Black", "Brown", "Blonde", "Red", "Grey", "Custom"].map((color) => (
                            <button
                              key={color}
                              onClick={() => setModelConfig({...modelConfig, hairColor: color.toLowerCase()})}
                              className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-all duration-200 hover:scale-105 ${
                                modelConfig.hairColor === color.toLowerCase()
                                  ? "border-purple-600 bg-purple-100 text-purple-700 ring-2 ring-purple-300"
                                  : "border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-8">
                      <div className="text-center w-full">
                        <div className="text-6xl mb-4 transition-transform duration-300 hover:scale-110">
                          {modelConfig.modelType === "male" ? "👨" : 
                           modelConfig.modelType === "kids" ? "👶" : 
                           modelConfig.modelType === "mannequin" ? "🛍️" : "👩"}
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Model Preview</p>
                        <div className="space-y-1 text-xs text-gray-600">
                          {modelConfig.modelType && (
                            <p className="font-medium">Type: {modelConfig.modelType.charAt(0).toUpperCase() + modelConfig.modelType.slice(1)}</p>
                          )}
                          {modelConfig.bodyType && <p>Body: {modelConfig.bodyType}</p>}
                          {modelConfig.skinTone && <p>Skin: {modelConfig.skinTone}</p>}
                          {modelConfig.hairType && (
                            <p>Hair: {modelConfig.hairType} {modelConfig.hairColor && `(${modelConfig.hairColor})`}</p>
                          )}
                          {!modelConfig.modelType && (
                            <p className="text-gray-500 italic">Select model options to see preview</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visual Scene Settings */}
            {selectedProductType && (
              <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-xl rounded-2xl animate-fadeIn">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Model Environment & Visual Style</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Background</Label>
                      <Select value={sceneSettings.background} onValueChange={(v) => setSceneSettings({...sceneSettings, background: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select background" />
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
                      <Label>Lighting Style</Label>
                      <Select value={sceneSettings.lighting} onValueChange={(v) => setSceneSettings({...sceneSettings, lighting: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lighting" />
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
                      <Label>Camera Angle</Label>
                      <Select value={sceneSettings.cameraAngle} onValueChange={(v) => setSceneSettings({...sceneSettings, cameraAngle: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select angle" />
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

            {/* Mood & Aesthetic */}
            {selectedProductType && (
              <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-xl rounded-2xl animate-fadeIn">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Choose Mood or Vibe</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {moods.map((mood) => (
                      <button
                        key={mood.id}
                        onClick={() => setSelectedMood(mood.id)}
                        className={`relative h-20 rounded-xl bg-gradient-to-br ${mood.gradient} text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl ${
                          selectedMood === mood.id
                            ? "ring-4 ring-white ring-offset-2 ring-offset-purple-200 scale-105"
                            : "hover-lift"
                        }`}
                      >
                        <div className="text-2xl mb-1">{mood.icon}</div>
                        <div className="text-xs font-medium">{mood.label}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Smart Filters */}
            {selectedProductType && (
              <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-xl rounded-2xl animate-fadeIn">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Optional Enhancements</h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Background Blur</Label>
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
                        <Label className="font-medium">Shadow Intensity</Label>
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
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <Label className="font-medium">AI Enhancement</Label>
                      <Switch
                        checked={smartFilters.aiEnhancement}
                        onCheckedChange={(checked) => setSmartFilters({...smartFilters, aiEnhancement: checked})}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Sharpness</Label>
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
                      <Label className="font-medium">Color Grading Preset</Label>
                      <Select value={smartFilters.colorGrading} onValueChange={(v) => setSmartFilters({...smartFilters, colorGrading: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="warm">🔥 Warm</SelectItem>
                          <SelectItem value="cool">❄️ Cool</SelectItem>
                          <SelectItem value="balanced">⚖️ Balanced</SelectItem>
                          <SelectItem value="vibrant">🌈 Vibrant</SelectItem>
                          <SelectItem value="monochrome">⚫ Monochrome</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generate Button - Always visible for admin */}
            {selectedProductType && uploadedImageUrl && (
              <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-xl rounded-2xl">
                <CardContent className="p-6">
                  {isGenerating && (
                    <div className="mb-4">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse" style={{ width: '100%' }}></div>
                      </div>
                      <p className="text-sm text-center text-gray-600 mt-2">Generating your image... This may take a few moments.</p>
                    </div>
                  )}
                  <Button
                    className="w-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:opacity-90 text-white text-lg py-6 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                    size="lg"
                    disabled={isGenerating}
                    onClick={handleGenerate}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Crown className="w-5 h-5 mr-2" />
                        ⚡ Generate Image (Admin - Unlimited)
                      </>
                    )}
                  </Button>
                  <div className="mt-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Crown className="w-4 h-4 text-yellow-600" />
                      <p className="text-sm font-medium text-gray-700">
                        Admin Mode: Unlimited Credits
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Preview Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-xl rounded-2xl sticky top-24 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
              <CardContent className="p-6 flex flex-col h-full">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-purple-600" />
                  Preview Gallery
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
      <footer className="bg-white/80 backdrop-blur-md border-t border-white/20 mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-600">
            © 2025 Bursana AI – Admin Panel
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Admin;

