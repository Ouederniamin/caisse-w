"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Copy, Check, UserPlus } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  password: string | null;
}

interface UsersTableProps {
  users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, userId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(userId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800/50">
            <TableHead className="font-semibold dark:text-gray-300">Nom</TableHead>
            <TableHead className="font-semibold dark:text-gray-300">Email</TableHead>
            <TableHead className="font-semibold dark:text-gray-300">Mot de passe</TableHead>
            <TableHead className="font-semibold dark:text-gray-300">Rôle</TableHead>
            <TableHead className="font-semibold dark:text-gray-300">Date création</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <UserPlus className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">Aucun utilisateur pour le moment</p>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <TableCell className="font-medium dark:text-white">{user.name || 'N/A'}</TableCell>
                <TableCell className="dark:text-gray-300">{user.email}</TableCell>
                <TableCell>
                  {user.password ? (
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono dark:text-gray-300 max-w-[150px] overflow-hidden text-ellipsis">
                        {visiblePasswords.has(user.id) ? user.password : '••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePasswordVisibility(user.id)}
                        className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                        title={visiblePasswords.has(user.id) ? "Masquer" : "Afficher"}
                      >
                        {visiblePasswords.has(user.id) ? (
                          <EyeOff className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(user.password!, user.id)}
                        className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Copier"
                      >
                        {copiedId === user.id ? (
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600 text-sm italic">Mot de passe hashé</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={user.role === 'admin' ? 'default' : 'secondary'}
                    className={user.role === 'admin' 
                      ? 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500' 
                      : user.role === 'AGENT_CONTROLE'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : user.role === 'AGENT_HYGIENE'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : user.role === 'SECURITE'
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                    }
                  >
                    {user.role === 'AGENT_CONTROLE' ? 'Agent de Contrôle' :
                     user.role === 'AGENT_HYGIENE' ? 'Agent d\'Hygiène' :
                     user.role === 'SECURITE' ? 'Sécurité' :
                     user.role === 'direction' ? 'Direction' :
                     user.role}
                  </Badge>
                </TableCell>
                <TableCell className="dark:text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
