const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const url = `${API_BASE_URL}${path}`;
    console.log(`API Request: ${init?.method || 'GET'} ${url}`);
    
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });

    console.log(`API Response: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const text = await res.text();
      console.error(`API Error Response:`, text);
      
      // Try to parse as JSON for better error message
      try {
        const errorData = JSON.parse(text);
        const message = errorData.detail || errorData.message || text;
        throw new Error(message);
      } catch (parseError) {
        // If not JSON, use raw text
        throw new Error(text || `Request failed: ${res.status} ${res.statusText}`);
      }
    }

    const data = await res.json();
    console.log(`API Response Data:`, data);
    return data;
  } catch (error) {
    console.error(`API Request failed:`, error);
    throw error;
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
};
