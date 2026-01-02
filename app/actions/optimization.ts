"use server";

import { submitOptimizationToBackend } from "@/services/optimization";
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
