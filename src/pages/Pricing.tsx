import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Check, LogOut } from "lucide-react";

const CREDIT_PACKAGES = [
  {
    name: "Single Image",
    price: 10,
    credits: 1,
    features: ["1 credit", "Instant download", "High quality"],
    currency: "INR",
    description: "Instant download",
  },
  {
    name: "10-Pack",
    price: 79,
    credits: 10,
    features: ["10 credits", "Bulk showcase creation", "High quality"],
    currency: "INR",
    description: "Bulk showcase creation",
  },
  {
    name: "Pro Plan",
    price: 499,
    credits: 1000, // Large credit amount to represent "unlimited" for monthly plan
    features: ["Unlimited uploads", "Priority support", "Bulk showcase creation"],
    currency: "INR",
    isMonthly: true, // Mark as monthly subscription
    description: "Unlimited uploads",
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check authentication and fetch credits on mount
  useEffect(() => {
    const fetchUserCredits = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", user.id)
            .single();

          if (error) {
            // Profile doesn't exist - create it with 5 free credits
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
              setUserCredits(5); // Default to 5 for new users
            } else {
              setUserCredits(newProfile?.credits || 5);
            }
          } else {
            // Profile exists - use credits, default to 5 if null
            const userCreditsValue = profile?.credits;
            if (userCreditsValue === null || userCreditsValue === undefined) {
              // Credits is null - update to 5
              await supabase
                .from("profiles")
                .update({ credits: 5 })
                .eq("id", user.id);
              setUserCredits(5);
            } else {
              setUserCredits(userCreditsValue);
            }
          }
        } catch (error) {
          console.error("Error fetching credits:", error);
          setUserCredits(null);
        }
      } else {
        setUserCredits(null);
      }
    };

    fetchUserCredits();
  }, [isLoggedIn]);

  const handlePurchase = async (price: number, credits: number, currency: string = "INR") => {
    const packageKey = `${price}-${credits}`;
    setLoadingPackage(packageKey);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to purchase credits");
        navigate("/auth");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            amount: price,
            credits: credits,
            currency: currency,
          }),
        }
      );

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to create payment session");
        setLoadingPackage(null);
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("An error occurred during purchase");
      setLoadingPackage(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full px-4 sm:px-6 py-4 border-b">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-bold text-gray-900">Bursana AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </Button>
              {isLoggedIn ? (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.signOut();
                      if (error) {
                        console.error("Sign out error:", error);
                        toast.error("Failed to sign out. Please try again.");
                        return;
                      }
                      
                      // Clear local state
                      setIsLoggedIn(false);
                      setUserCredits(null);
                      
                      toast.success("Signed out successfully");
                      navigate("/");
                    } catch (error: any) {
                      console.error("Sign out error:", error);
                      toast.error("An error occurred while signing out. Please try again.");
                    }
                  }} 
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center space-x-2 mb-4 bg-purple-100 px-4 py-2 rounded-full">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            <span className="font-medium text-gray-900">AI-Powered Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
            Choose Your Credit Package
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Select the perfect package for your needs. All packages include full access to AI generation features.
          </p>
          {userCredits !== null && (
            <div className="mt-4 inline-flex items-center space-x-2 bg-purple-100 px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              <span className="text-base sm:text-lg font-semibold text-gray-900">
                Your Credits: {userCredits}
              </span>
            </div>
          )}
          {userCredits === null && (
            <div className="mt-4 inline-flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full">
              <span className="text-sm sm:text-base text-gray-600">
                Sign in to track your credits, or continue as guest
              </span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.name}
              className="relative hover:shadow-lg transition-all"
            >
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold mb-2">{pkg.name}</CardTitle>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-purple-600">
                      ₹{pkg.price}
                    </span>
                    {pkg.isMonthly && (
                      <span className="text-gray-600 text-sm">/mo</span>
                    )}
                  </div>
                  {pkg.description && (
                    <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() => handlePurchase(pkg.price, pkg.credits, pkg.currency)}
                  disabled={loadingPackage === `${pkg.price}-${pkg.credits}`}
                >
                  {loadingPackage === `${pkg.price}-${pkg.credits}` ? "Processing..." : pkg.isMonthly ? "Subscribe" : "Purchase"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center bg-gray-50 rounded-lg p-6">
          <p className="text-sm text-gray-700 font-medium">
            Secure payment processing powered by Stripe
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Credits never expire and can be used anytime. Pro Plan is a monthly subscription with recurring billing.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
