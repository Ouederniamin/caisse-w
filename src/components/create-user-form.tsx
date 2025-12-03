"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateUserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("AGENT_CONTROLE");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Using BetterAuth client to sign up a new user
      // Note: In a real admin panel, you might want a specific "adminCreateUser" endpoint 
      // to avoid logging in as the new user immediately, but signUpEmail works for creation.
      // However, signUpEmail usually logs the current user out and the new one in.
      // BETTER APPROACH: Call a custom API route that uses the server-side auth.api.signUpEmail
      
      const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create user");

      setMessage({ type: 'success', text: `Utilisateur ${email} créé avec succès !` });
      setName("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-lg dark:bg-gray-800/50 dark:backdrop-blur-sm dark:border dark:border-gray-700 sticky top-24">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          </div>
          <CardTitle className="text-xl dark:text-white">Ajouter un Utilisateur</CardTitle>
        </div>
        <CardDescription className="dark:text-gray-400">Créez un compte pour un agent ou un membre de la direction</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="dark:text-gray-200 font-medium">Nom Complet</Label>
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Ex: Ahmed Ben Salah" 
            className="dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" 
          />
        </div>
        
        <div className="space-y-2">
          <Label className="dark:text-gray-200 font-medium">Email (Identifiant)</Label>
          <Input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="agent@caisse.com" 
            type="email"
            className="dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" 
          />
        </div>

        <div className="space-y-2">
          <Label className="dark:text-gray-200 font-medium">Mot de passe</Label>
          <Input 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            type="password" 
            placeholder="Minimum 8 caractères" 
            className="dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" 
          />
        </div>

        <div className="space-y-2">
          <Label className="dark:text-gray-200 font-medium">Rôle</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="dark:bg-gray-700/50 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              <SelectItem value="admin" className="dark:text-white dark:focus:bg-gray-700">Admin</SelectItem>
              <SelectItem value="direction" className="dark:text-white dark:focus:bg-gray-700">Direction</SelectItem>
              <SelectItem value="AGENT_CONTROLE" className="dark:text-white dark:focus:bg-gray-700">Agent de Contrôle</SelectItem>
              <SelectItem value="SECURITE" className="dark:text-white dark:focus:bg-gray-700">Sécurité</SelectItem>
              <SelectItem value="AGENT_HYGIENE" className="dark:text-white dark:focus:bg-gray-700">Agent d'Hygiène</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {message && (
          <Alert 
            variant={message.type === 'error' ? 'destructive' : 'default'} 
            className={message.type === 'success' 
              ? 'bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800' 
              : 'dark:bg-red-900/20 dark:border-red-800'
            }
          >
            <AlertDescription className={message.type === 'success' ? 'dark:text-green-200' : 'dark:text-red-200'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleCreateUser} 
          disabled={loading} 
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Création en cours...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              Créer l'utilisateur
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
