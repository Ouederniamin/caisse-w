"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { approveConflict, rejectConflict } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ConflictActionsProps {
  conflictId: string;
  driverName: string;
  quantite: number;
}

export function ConflictActions({ conflictId, driverName, quantite }: ConflictActionsProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const { toast } = useToast();

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const result = await approveConflict(conflictId);
      if (result.success) {
        toast({
          title: "✅ Conflit approuvé",
          description: `Le conflit de ${driverName} a été approuvé.`,
        });
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) {
      toast({
        title: "Note requise",
        description: "Veuillez ajouter une note pour rejeter le conflit.",
        variant: "destructive",
      });
      return;
    }

    setIsRejecting(true);
    try {
      const result = await rejectConflict(conflictId, rejectNotes);
      if (result.success) {
        toast({
          title: "❌ Conflit rejeté",
          description: `Le conflit de ${driverName} a été rejeté.`,
        });
        setShowRejectDialog(false);
        setRejectNotes("");
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
        <Button
          size="sm"
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={handleApprove}
          disabled={isApproving}
        >
          {isApproving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          Approuver
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="flex-1"
          onClick={() => setShowRejectDialog(true)}
          disabled={isRejecting}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Rejeter
        </Button>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le conflit</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du rejet pour {driverName} ({quantite} caisses).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Raison du rejet..."
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectNotes.trim()}
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
