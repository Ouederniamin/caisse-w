"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveConflict(conflictId: string, notes?: string) {
  try {
    await prisma.conflict.update({
      where: { id: conflictId },
      data: {
        statut: "PAYEE",
        notes_direction: notes || "Approuvé",
        date_approbation_direction: new Date(),
      },
    });

    revalidatePath("/dashboard/conflits");
    revalidatePath("/dashboard/direction");
    return { success: true };
  } catch (error) {
    console.error("Error approving conflict:", error);
    return { success: false, error: "Erreur lors de l'approbation" };
  }
}

export async function rejectConflict(conflictId: string, notes: string) {
  try {
    if (!notes || notes.trim() === "") {
      return { success: false, error: "Une note est requise pour rejeter un conflit" };
    }

    await prisma.conflict.update({
      where: { id: conflictId },
      data: {
        statut: "ANNULE",
        notes_direction: notes,
        date_approbation_direction: new Date(),
      },
    });

    revalidatePath("/dashboard/conflits");
    revalidatePath("/dashboard/direction");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting conflict:", error);
    return { success: false, error: "Erreur lors du rejet" };
  }
}
