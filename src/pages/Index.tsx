import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap, Image as ImageIcon, Star, CheckCircle } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import example1 from "@/assets/example-1.jpg";
import example2 from "@/assets/example-2.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-gradient-primary text-white px-4 py-2 rounded-full mb-6 shadow-glow">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Product Photography</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Transform Your Products into
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Studio-Quality Images
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              No prompt writing needed. Just upload, select your style, and watch AI create
              professional product photos in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-elegant text-lg px-8"
              >
                <Zap className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                variant="outline"
                className="text-lg px-8"
              >
                View Examples
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              🎁 5 free generations to start • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to professional product imagery
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="shadow-card hover:shadow-elegant transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Upload</h3>
              <p className="text-muted-foreground">
                Upload your product photo from your device or camera
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card hover:shadow-elegant transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Select</h3>
              <p className="text-muted-foreground">
                Choose model type, background, lighting, and mood - no typing!
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card hover:shadow-elegant transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Generate</h3>
              <p className="text-muted-foreground">
                Let AI create stunning professional images in seconds
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Examples Section */}
      <section className="container mx-auto px-4 py-20 bg-card/50 backdrop-blur-sm rounded-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            See the Magic
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real examples of AI-generated product photography
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-card">
            <img src={example1} alt="AI Generated Saree" className="w-full h-80 object-cover" />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-card">
            <img src={example2} alt="AI Generated Handbag" className="w-full h-80 object-cover" />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-center">
            Why Choose AI Product Studio?
          </h2>
          <div className="space-y-4">
            {[
              "No expensive photoshoots or studio rentals",
              "Generate unlimited variations of your product",
              "Professional results in seconds, not days",
              "Perfect for e-commerce, social media, and marketing",
              "Easy-to-use interface - no technical skills needed",
            ].map((benefit, i) => (
              <div key={i} className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                <p className="text-lg">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-primary text-white border-0 shadow-elegant">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Transform Your Products?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of businesses creating stunning product images with AI
            </p>
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              variant="secondary"
              className="text-lg px-8"
            >
              Start Creating for Free
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Index;
