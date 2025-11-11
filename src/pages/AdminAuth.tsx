import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Crown, Shield, Key } from "lucide-react";

// Admin token - should match exactly (case-insensitive for better UX)
const ADMIN_TOKEN = "Admin";

const AdminAuth = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminToken, setAdminToken] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check if user is admin
        const userEmail = session.user.email?.toLowerCase();
        const ADMIN_EMAILS = [
          "admin@bursana.ai",
          "admin@example.com",
          "bursana.jeet@gmail.com",
        ];
        const isAdmin = userEmail && ADMIN_EMAILS.some(adminEmail => 
          adminEmail.toLowerCase() === userEmail
        );
        
        if (isAdmin) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate admin token during registration
        if (adminToken.trim().toLowerCase() !== ADMIN_TOKEN.toLowerCase()) {
          toast.error("Invalid admin token. Please provide the correct admin token.");
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          toast.error("Passwords don't match");
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}/admin`;
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            // Email already exists - this is expected! Sign in and grant admin access
            toast.info("Email already registered. Signing in with existing account and granting admin access...");
            
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (signInError) {
              toast.error("Password incorrect. Please use the correct password for this email.");
              setLoading(false);
              return;
            }

            // Grant admin access to existing account (this is the key feature - same email, admin access)
            if (signInData.user) {
              setTimeout(async () => {
                const { error: updateError } = await supabase
                  .from("profiles")
                  .update({ is_admin: true })
                  .eq("id", signInData.user.id);

                if (updateError) {
                  console.error("Error updating admin status:", updateError);
                  // Try with email-based admin list as fallback
                  toast.warning("Admin status update failed. Trying alternative method...");
                  // Check if update worked despite error
                  const { data: checkProfile } = await supabase
                    .from("profiles")
                    .select("is_admin")
                    .eq("id", signInData.user.id)
                    .single();
                  
                  if ((checkProfile as any)?.is_admin) {
                    toast.success("Admin access granted! You can now use this email for both regular and admin access.");
                  } else {
                    toast.error("Failed to grant admin access. Please contact support.");
                    navigate("/dashboard");
                    return;
                  }
                } else {
                  toast.success("✅ Admin access granted! You can now use this email for both regular and admin access.");
                  toast.info("You can login on /auth for regular access or /admin-auth for admin access with the same credentials.");
                }
                
                navigate("/admin");
              }, 1000);
            }
          } else {
            toast.error(error.message);
          }
        } else {
          // New account created - set admin flag and navigate immediately
          if (signUpData.user) {
            // If no session was created, sign in immediately to ensure access
            if (!signUpData.session) {
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });

              if (signInError) {
                toast.error("Account created but could not sign in. Please try signing in manually.");
                setLoading(false);
                return;
              }

              // Use the signed-in user for admin status update
              if (signInData.user) {
                setTimeout(async () => {
                  const { error: updateError } = await supabase
                    .from("profiles")
                    .update({ is_admin: true })
                    .eq("id", signInData.user.id);

                  if (updateError) {
                    console.error("Error updating admin status:", updateError);
                    toast.warning("Account created but admin status update failed. Please contact support.");
                  } else {
                    toast.success("Admin account created successfully! Redirecting to admin panel...");
                  }
                  
                  navigate("/admin");
                }, 1000);
              }
            } else {
              // Session exists - update admin status and navigate
              setTimeout(async () => {
                const { error: updateError } = await supabase
                  .from("profiles")
                  .update({ is_admin: true })
                  .eq("id", signUpData.user.id);

                if (updateError) {
                  console.error("Error updating admin status:", updateError);
                  toast.warning("Account created but admin status update failed. Please contact support.");
                } else {
                  toast.success("Admin account created successfully! Redirecting to admin panel...");
                }
                
                navigate("/admin");
              }, 1000);
            }
          } else {
            toast.success("Admin account created successfully! Redirecting to admin panel...");
            navigate("/admin");
          }
        }
      } else {
        // For sign in, allow any user to sign in - if they have admin access, grant it
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error(error.message);
        } else {
          // Check if user is admin (with fallback)
          const userEmail = data.user.email?.toLowerCase();
          console.log("AdminAuth - Checking admin access for:", userEmail);
          const ADMIN_EMAILS = [
            "admin@bursana.ai",
            "admin@example.com",
            "bursana.jeet@gmail.com",
          ];
          const isAdminByEmail = userEmail && ADMIN_EMAILS.some(adminEmail => 
            adminEmail.toLowerCase() === userEmail
          );
          console.log("AdminAuth - Has admin access by email:", isAdminByEmail);
          
          // Try to check is_admin field if it exists
          let isAdmin = isAdminByEmail;
          try {
            const { data: adminProfile, error: profileError } = await supabase
              .from("profiles")
              .select("is_admin, email")
              .eq("id", data.user.id)
              .single();
            
            if (profileError) {
              console.log("AdminAuth - Profile query error (this is OK if is_admin field doesn't exist):", profileError);
            } else {
              console.log("AdminAuth - Profile data:", adminProfile);
              const isAdminByField = (adminProfile as any)?.is_admin === true;
              console.log("AdminAuth - Is admin by field:", isAdminByField);
              isAdmin = isAdminByField || isAdminByEmail;
            }
          } catch (error) {
            // is_admin field doesn't exist yet, use email check
            console.log("AdminAuth - Error checking is_admin field (using email check):", error);
            isAdmin = isAdminByEmail;
          }

          console.log("AdminAuth - Final admin access result:", isAdmin);

          if (isAdmin) {
            toast.success("Welcome back, Admin! You have access to both regular and admin features.");
            toast.info("You can switch between Dashboard and Admin Panel using the navigation.");
            navigate("/admin");
          } else {
            // User signed in but doesn't have admin access - navigate to dashboard
            console.log("AdminAuth - User doesn't have admin access, navigating to dashboard");
            toast.info("You're signed in successfully, but this account doesn't have admin privileges yet.");
            toast.info("If you have the admin token, switch to 'Register' and provide it to grant admin access to this account.");
            navigate("/dashboard");
          }
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-yellow-400">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">
            {isSignUp ? "Admin Registration" : "Admin Login"}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {isSignUp
              ? "Register as admin with admin token. If you already have an account, use the same email and password, then provide the admin token to grant admin access."
              : "Sign in with your email and password. If you're already a regular user, you can use the same credentials here."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-sm sm:text-base"
              />
            </div>
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminToken" className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-yellow-600" />
                    Admin Token *
                  </Label>
                  <Input
                    id="adminToken"
                    type="text"
                    placeholder="Enter admin token"
                    value={adminToken}
                    onChange={(e) => setAdminToken(e.target.value)}
                    required
                    className="text-sm sm:text-base border-yellow-400 focus:border-yellow-500"
                  />
                  <p className="text-xs text-gray-500">
                    💡 <strong>Same Email Feature:</strong> If your email is already registered as a regular user, use the same email and password here, then provide the admin token. This will grant admin access to your existing account, allowing you to use the same credentials for both regular and admin access.
                  </p>
                </div>
              </>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 transition-opacity text-white text-sm sm:text-base py-2.5 sm:py-3"
              disabled={loading}
            >
              {loading ? "Loading..." : isSignUp ? "Register as Admin" : "Sign In as Admin"}
            </Button>
          </form>
          <div className="mt-4 space-y-3">
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAdminToken("");
                }}
                className="text-yellow-600 hover:underline font-medium"
              >
                {isSignUp
                  ? "Already have an admin account? Sign in"
                  : "Don't have an admin account? Register"}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full text-sm sm:text-base py-2.5 sm:py-3"
              onClick={() => navigate("/auth")}
            >
              Regular User Login (Same Email Works)
            </Button>
            <p className="text-xs text-center text-gray-600 mt-2 px-4">
              🔐 You can use the same email and password for both regular user access and admin access. If you have admin privileges, you'll see admin options in the regular login too.
            </p>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm sm:text-base py-2.5 sm:py-3"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;

