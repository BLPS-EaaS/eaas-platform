
const DEFAULT_BASE_URL = process.env.PYTHON_API_BASE_URL || "http://localhost:8000";

type RequestOptions = {
  method?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  body?: any;
};

async function fetchWrapper<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", baseUrl, headers = {}, body } = options;
  const config: RequestInit = {
    method,
    headers: {
      ...headers,
    },
  };

  // Auto-detect Content-Type
    if (body) {
        if (body instanceof FormData) {
            // Do not set Content-Type for FormData, let browser/node set it with boundary
            config.body = body;
        } else {
            config.headers = {
                "Content-Type": "application/json",
                ...config.headers,
            };
            config.body = JSON.stringify(body);
        }
    }

  // TODO: Add Auth Header Injection here when auth is implemented
  // const token = ...
  // if (token) config.headers['Authorization'] = `Bearer ${token}`;

  const url = `${baseUrl || DEFAULT_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
             // Try to parse JSON error with 'detail' key (FastAPI standard)
            const errorData = await response.json();
             if (errorData.detail) {
                 errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
             } else if (errorData.error) {
                 errorMessage = errorData.error;
             }
        } catch (e) {
            // Fallback to text
            const text = await response.text();
            if (text) errorMessage += ` - ${text}`;
        }
        throw new Error(errorMessage);
    }

    // Handle empty responses
    if (response.status === 204) {
        return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Call Failed [${method} ${url}]:`, error);
    throw error;
  }
}

export const apiClient = {
    get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) => 
        fetchWrapper<T>(endpoint, { method: "GET", ...options }),
    
    post: <T>(endpoint: string, body: any, options?: Omit<RequestOptions, 'method' | 'body'>) => 
        fetchWrapper<T>(endpoint, { method: "POST", body, ...options }),

    put: <T>(endpoint: string, body: any, options?: Omit<RequestOptions, 'method' | 'body'>) => 
        fetchWrapper<T>(endpoint, { method: "PUT", body, ...options }),

    delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) => 
        fetchWrapper<T>(endpoint, { method: "DELETE", ...options }),
};
