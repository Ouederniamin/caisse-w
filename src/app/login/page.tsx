"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDevCredentials, setShowDevCredentials] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard", // Redirect after login
      }, {
        onError: (ctx) => {
             setError(ctx.error.message);
             setLoading(false);
        },
        onSuccess: () => {
            router.push("/dashboard");
        }
      });
    } catch (err) {
      setError("Une erreur est survenue.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-[420px] border-none shadow-2xl dark:shadow-gray-900/50 relative backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl text-center dark:text-white font-bold">Connexion</CardTitle>
          <CardDescription className="text-center dark:text-gray-400">Accès Direction & Administration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email" className="dark:text-gray-200 font-medium">Email</Label>
              <Input 
                id="email" 
                placeholder="admin@exemple.com" 
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 h-11 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password" className="dark:text-gray-200 font-medium">Mot de passe</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pr-10 h-11 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error && (
                <Alert variant="destructive" className="dark:bg-red-900/20 dark:border-red-800 border-red-200 bg-red-50">
                    <AlertDescription className="dark:text-red-200 text-red-800 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                      {process.env.NODE_ENV === 'development' && (
                        <button
                          onClick={() => setShowDevCredentials(!showDevCredentials)}
                          className="ml-auto text-xs underline hover:text-red-600 dark:hover:text-red-300 font-medium"
                        >
                          {showDevCredentials ? "Masquer" : "Voir identifiants dev"}
                        </button>
                      )}
                    </AlertDescription>
                </Alert>
            )}
            {process.env.NODE_ENV === 'development' && showDevCredentials && (
              <Alert className="dark:bg-blue-900/20 dark:border-blue-800 border-blue-200 bg-blue-50">
                <AlertDescription className="dark:text-blue-200 text-blue-800 space-y-2">
                  <p className="font-semibold text-sm mb-2">🔑 Identifiants de test:</p>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                      <div>
                        <span className="font-bold">Admin:</span> admin@caisse.tn / password123
                      </div>
                      <button
                        onClick={() => {
                          setEmail("admin@caisse.tn");
                          setPassword("password123");
                          setShowDevCredentials(false);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                      >
                        Utiliser
                      </button>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                      <div>
                        <span className="font-bold">Direction:</span> direction@caisse.tn / password123
                      </div>
                      <button
                        onClick={() => {
                          setEmail("direction@caisse.tn");
                          setPassword("password123");
                          setShowDevCredentials(false);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                      >
                        Utiliser
                      </button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <Button 
            onClick={handleLogin} 
            disabled={loading} 
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
