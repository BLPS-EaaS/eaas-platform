"use server";

import { submitOptimizationToBackend, getOptimizationHistory, getOptimizationStatus } from "@/services/optimization";
import { getSession } from "@/lib/auth/session";

export type OptimizationActionState = {
  success?: boolean;
  data?: any;
  error?: string;
} | null;

export async function submitOptimizationAction(
  prevState: OptimizationActionState,
  formData: FormData
): Promise<OptimizationActionState> {
  const session = await getSession();

  if (!session || !session.user) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    const data = await submitOptimizationToBackend(formData, session.user.id);
    return { success: true, data };
  } catch (error: any) {
    console.error("Server Action Error:", error);
    return {
      success: false,
      error: error.message || "Something went wrong during optimization.",
    };
  }
}

export async function getOptimizationHistoryAction() {
  const session = await getSession();

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  try {
    return await getOptimizationHistory(session.user.id);
  } catch (error: any) {
    console.error("History Fetch Error:", error);
    return []; // Return empty array on error or throw
  }
}

export async function getOptimizationStatusAction(jobId: string) {
  const session = await getSession();

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  try {
    return await getOptimizationStatus(jobId, session.user.id);
  } catch (error: any) {
    console.error("Status Fetch Error:", error);
    return null;
  }
}
