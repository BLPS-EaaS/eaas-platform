import { ENDPOINTS } from "@/lib/constants";
import { apiClient } from "@/lib/api-client";

export async function submitOptimizationToBackend(formData: FormData, userId: number) {
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new Error("No file provided");
  }

  // Determine endpoint based on file extension
  let endpointPath = ENDPOINTS.OPTIMIZATION_AMI;
  if (file.name.endsWith(".html") || file.name.endsWith(".htm")) {
    endpointPath = ENDPOINTS.OPTIMIZATION_DAILY_PATTERN;
  }

  try {
    return await apiClient.post(endpointPath, formData, {
        baseUrl: process.env.PYTHON_API_BASE_URL || "http://localhost:8000",
        headers: {
            "user-id": userId.toString(),
        }
    });
  } catch (error) {
    console.error("Error in submitOptimizationToBackend:", error);
    throw error;
  }
}

export async function getOptimizationHistory(userId: number) {
  const endpointPath = `${ENDPOINTS.OPTIMIZATION_HISTORY}/${userId}`;
  try {
    return await apiClient.get(endpointPath, {
        baseUrl: process.env.PYTHON_API_BASE_URL || "http://localhost:8000",
        headers: {
            "user-id": userId.toString(),
        }
    });
  } catch (error) {
    console.error("Error in getOptimizationHistory:", error);
    throw error;
  }
}

export async function getOptimizationStatus(jobId: string, userId: number) {
  const endpointPath = `${ENDPOINTS.OPTIMIZATION_STATUS}/${jobId}/status`;
  try {
    return await apiClient.get(endpointPath, {
        baseUrl: process.env.PYTHON_API_BASE_URL || "http://localhost:8000",
        headers: {
            "user-id": userId.toString(),
        }
    });
  } catch (error) {
    console.error("Error in getOptimizationStatus:", error);
    throw error;
  }
}
