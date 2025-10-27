import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Sparkles, ArrowLeft, Loader2 } from "lucide-react";

const CREDIT_PACKAGES = [
  {
    name: "Starter Pack",
    price: 9.99,
    credits: 10,
    priceId: "price_1SMn4SDAVC28Am2YPKVqotG3",
    description: "Perfect for trying out the platform",
    features: ["10 AI Generations", "All filters included", "HD Quality", "Email support"],
  },
  {
    name: "Pro Pack",
    price: 24.99,
    credits: 30,
    priceId: "price_1SMn4sDAVC28Am2YKSz9WqZM",
    description: "Best value for regular users",
    popular: true,
    features: ["30 AI Generations", "All filters included", "HD Quality", "Priority support", "20% discount"],
  },
  {
    name: "Ultimate Pack",
    price: 49.99,
    credits: 100,
    priceId: "price_1SMn56DAVC28Am2YTnHvBN6j",
    description: "For power users and businesses",
    features: ["100 AI Generations", "All filters included", "HD Quality", "Priority support", "50% discount"],
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null);

  const handlePurchase = async (priceId: string, credits: number) => {
    setLoadingPackage(priceId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to purchase credits");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { priceId, credits },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error("Failed to create payment session");
    } finally {
      setLoadingPackage(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Choose Your Credit Package
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the perfect package for your needs. All packages include full access to AI generation features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.priceId}
              className={`relative ${
                pkg.popular ? "border-primary shadow-elegant scale-105" : ""
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${pkg.price}</span>
                  <span className="text-muted-foreground"> / {pkg.credits} credits</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <Check className="w-5 h-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                  size="lg"
                  onClick={() => handlePurchase(pkg.priceId, pkg.credits)}
                  disabled={loadingPackage === pkg.priceId}
                >
                  {loadingPackage === pkg.priceId ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Purchase Now"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Secure payment processing powered by Stripe</p>
          <p className="mt-2">Credits never expire and can be used anytime</p>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
