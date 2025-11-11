import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Sparkles, Zap, ArrowRight, Star, CheckCircle2, Wand2, TrendingUp, Users, ShoppingBag, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import example1 from "@/assets/example-1.jpg";
import example2 from "@/assets/example-2.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    // Trigger animations on mount
    setIsVisible(true);

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
          }
        });
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) observer.observe(heroRef.current);
    if (featuresRef.current) observer.observe(featuresRef.current);

    return () => {
      subscription.unsubscribe();
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="w-full px-4 sm:px-6 py-4 border-b border-gray-200/50 backdrop-blur-sm bg-white/80 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => navigate("/")}>
              <div className="relative">
                <Sparkles className="w-6 h-6 text-purple-600 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                <div className="absolute inset-0 bg-purple-400 rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Bursana</span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-2 sm:space-x-4">
              <button 
                onClick={() => navigate("/dashboard")}
                className="text-gray-600 text-sm font-medium hover:text-purple-600 transition-all duration-300 hidden sm:block relative group"
              >
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={() => navigate("/pricing")}
                className="text-gray-600 text-sm font-medium hover:text-purple-600 transition-all duration-300 hidden sm:block relative group"
              >
                Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
              </button>
              {isLoggedIn ? (
                <>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    variant="ghost"
                    className="hidden sm:flex"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const { error } = await supabase.auth.signOut();
                        if (error) {
                          console.error("Sign out error:", error);
                          toast.error("Failed to sign out. Please try again.");
                          return;
                        }
                        setIsLoggedIn(false);
                        toast.success("Signed out successfully");
                        navigate("/");
                      } catch (error: any) {
                        console.error("Sign out error:", error);
                        toast.error("An error occurred while signing out. Please try again.");
                      }
                    }}
                    variant="ghost"
                  >
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => navigate("/auth")}
                    variant="ghost"
                    className="hidden sm:flex hover:bg-purple-50 transition-all duration-300"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate("/auth")}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <span className="hidden sm:inline">Sign Up</span>
                    <span className="sm:hidden">Sign In</span>
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-28 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-7xl mx-auto">
          {/* Left Content */}
          <div 
            ref={heroRef}
            className={`text-center lg:text-left space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 animate-fade-in">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-purple-700">AI-Powered • No Studio Needed</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-[1.1] tracking-tight">
                <span className="block text-gray-900 animate-fade-in-up animation-delay-200">
                  From Product
                </span>
                <span className="block text-gray-900 animate-fade-in-up animation-delay-200">
                  to profits
                </span>
                <span className="block text-gray-900 animate-fade-in-up animation-delay-400">
                  in Minutes
                </span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-fade-in-up animation-delay-500">
                Create stunning <span className="text-purple-600 font-semibold">AI model showcases</span> that boost sales by up to <span className="text-pink-600 font-bold">50%</span>
              </p>
            </div>

            {/* Description */}
            <p className="text-base sm:text-lg text-gray-500 leading-relaxed max-w-xl mx-auto lg:mx-0 animate-fade-in-up animation-delay-600">
              Upload your product images and watch AI transform them into professional model photography. Perfect for sarees, salwar, and ready-made apparel.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2 animate-fade-in-up animation-delay-700">
              <Button
                onClick={() => navigate("/dashboard")}
                size="lg"
                className="text-base sm:text-lg px-8 py-6 h-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group font-semibold rounded-xl"
              >
                Start Creating Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button
                onClick={() => navigate("/pricing")}
                variant="outline"
                size="lg"
                className="text-base sm:text-lg px-8 py-6 h-auto border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-purple-400 hover:text-purple-700 transition-all duration-300 hover:scale-105 font-semibold rounded-xl"
              >
                See Pricing
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start pt-4 animate-fade-in-up animation-delay-800">
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">5 Free Credits</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">No Credit Card</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Instant Results</span>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div 
            className={`relative transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
          >
            <div className="relative group">
              {/* Decorative Gradient Background */}
              <div className="absolute -inset-6 bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-blue-400/20 rounded-[2.5rem] blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
              
              {/* Image Container with Border */}
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white transform transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-3xl bg-white">
                <div className="aspect-[3/4] overflow-hidden">
                  <img 
                    src={example1}
                    alt="AI-generated model showcasing traditional Indian saree" 
                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = example2;
                    }}
                  />
                </div>
                
                {/* Subtle Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
              
              {/* Floating Stats Badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-5 py-3 shadow-2xl border-2 border-purple-100 animate-fade-in-up animation-delay-900 hidden lg:flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Sales Boost</div>
                  <div className="text-lg font-bold text-gray-900">+50%</div>
                </div>
              </div>

              {/* AI Badge */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-4 shadow-2xl animate-bounce-slow hidden lg:block">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef}
        className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10"
      >
        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 sm:p-12 shadow-xl border border-white/20">
          <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
            Multiple Pose Variations
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload an image of your product and AI will generate professional model showcases with the product in different poses.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative group">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl overflow-hidden shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:z-10 relative group/item">
                <img 
                  src={example1}
                  alt="Pose variation 1" 
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover/item:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:z-10 relative group/item animation-delay-200">
                <img 
                  src={example2}
                  alt="Pose variation 2" 
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover/item:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:z-10 relative group/item animation-delay-400">
                <img 
                  src={example1}
                  alt="Pose variation 3" 
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover/item:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:z-10 relative group/item animation-delay-600">
                <img 
                  src={example2}
                  alt="Pose variation 4" 
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover/item:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
            {/* Decorative Element */}
            <div className="absolute -z-10 -inset-4 bg-gradient-to-r from-purple-200/50 to-pink-200/50 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          <div className="space-y-6 animate-fade-in-up animation-delay-400">
            <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Create Stunning Visuals in Minutes
            </h3>
            <p className="text-lg text-gray-600 leading-relaxed">
              Our AI-powered platform transforms your product images into professional model showcases. No photography studio needed, no model hiring required.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <span>No photography studio required</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <span>Multiple poses and styles</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <span>Professional quality results</span>
              </div>
            </div>
            <Button
              onClick={() => navigate("/dashboard")}
              size="lg"
              className="text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group mt-4"
            >
              Start Creating
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10">
        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl border border-purple-100/50 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-200 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            {/* Main Headline */}
            <div className="text-center mb-12 animate-fade-in-up">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 mb-6 shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-6 bg-[length:200%_auto] animate-gradient">
                Research-Backed Results
              </h2>
              <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-medium">
                Visual merchandising research shows that showcasing garments on human models can increase sales by up to{" "}
                <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">50%</span>, 
                especially in fashion categories like sarees, salwar, and ready-made apparel.
              </p>
            </div>

            {/* Statistics Grid */}
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
              {/* Stat 1 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in-up animation-delay-200 group">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  50%
                </div>
                <div className="text-gray-600 font-medium">
                  Sales Increase
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  With human model showcases
                </div>
                {/* Progress Bar */}
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-full animate-gradient" style={{ width: '50%' }}></div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in-up animation-delay-400 group">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  3x
                </div>
                <div className="text-gray-600 font-medium">
                  Engagement Rate
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Higher customer interaction
                </div>
                {/* Progress Bar */}
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-gradient" style={{ width: '75%' }}></div>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in-up animation-delay-600 group">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <ShoppingBag className="w-7 h-7 text-white" />
                </div>
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  2.5x
                </div>
                <div className="text-gray-600 font-medium">
                  Conversion Rate
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  More purchases per visitor
                </div>
                {/* Progress Bar */}
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-gradient" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>

            {/* Fashion Categories Highlight */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-purple-200/50 shadow-lg animate-fade-in-up animation-delay-800">
              <div className="flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-600 mr-2" />
                <h3 className="text-xl font-bold text-gray-800">Most Impactful Categories</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200 hover:shadow-md transition-all duration-300">
                  <div className="text-2xl mb-2">👗</div>
                  <div className="font-semibold text-gray-800">Sarees</div>
                  <div className="text-sm text-gray-600 mt-1">Highest impact</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-pink-100 to-pink-50 border border-pink-200 hover:shadow-md transition-all duration-300">
                  <div className="text-2xl mb-2">👘</div>
                  <div className="font-semibold text-gray-800">Salwar</div>
                  <div className="text-sm text-gray-600 mt-1">Strong growth</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 hover:shadow-md transition-all duration-300">
                  <div className="text-2xl mb-2">👔</div>
                  <div className="font-semibold text-gray-800">Ready-Made</div>
                  <div className="text-sm text-gray-600 mt-1">Increasing demand</div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-10 animate-fade-in-up animation-delay-1000">
              <Button
                onClick={() => navigate("/dashboard")}
                size="lg"
                className="text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group font-semibold"
              >
                Start Increasing Your Sales
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10">
        <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 rounded-3xl p-8 sm:p-12 lg:p-16 text-center text-white overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
          
          <div className="relative z-10 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-6 animate-bounce-slow">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Transform Your Products?
            </h2>
            <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Join thousands of businesses using AI to create stunning product showcases that drive sales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/dashboard")}
                size="lg"
                className="text-lg bg-white text-purple-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group font-semibold"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button
                onClick={() => navigate("/pricing")}
                size="lg"
                variant="outline"
                className="text-lg bg-transparent border-2 border-white text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 font-semibold"
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 py-8 border-t border-gray-200/50 backdrop-blur-sm bg-white/50 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0 group cursor-pointer" onClick={() => navigate("/")}>
            <Sparkles className="w-5 h-5 text-purple-600 transition-transform duration-300 group-hover:rotate-12" />
            <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Bursana AI</span>
          </div>
          <p className="text-gray-600 text-sm text-center sm:text-right">
            © 2025 Bursana AI – Empowering Product Visualization with AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
