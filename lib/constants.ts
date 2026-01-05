export const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

export const ENDPOINTS = {
  OPTIMIZATION_AMI: "/v1/optimizations/ami",
  OPTIMIZATION_DAILY_PATTERN: "/v1/optimizations/daily_pattern",
  OPTIMIZATION_HISTORY: "/v1/optimizations", // Appended with /{user_id} in service
  OPTIMIZATION_STATUS: "/v1/optimizations", // Appended with /{job_id}/status in service
};
