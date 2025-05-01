import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Process API response error and throw a user-friendly error message
 */
async function processResponseError(res: Response): Promise<never> {
  try {
    // Try to parse the error as JSON
    const errorData = await res.json();
    const errorMessage = errorData.message || errorData.error || res.statusText;
    throw new Error(errorMessage);
  } catch (e) {
    // If JSON parsing fails, use text content or status text
    if (e instanceof Error && e.message !== res.statusText) {
      throw e;
    }
    // Fallback to plain text or status text
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Throws an error if the response is not OK (status not in the 200-299 range)
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    await processResponseError(res);
  }
}

/**
 * Makes a request to the API with proper error handling
 * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param url API endpoint URL
 * @param data Request payload (for POST, PUT, etc.)
 * @returns Response object
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Re-throw the error to be handled by the caller
    throw error instanceof Error ? error : new Error(String(error));
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Creates a query function for React Query
 * @param options Configuration options
 * @returns Query function for React Query
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const url = queryKey[0] as string;
      const res = await fetch(url, {
        credentials: "include",
      });

      // Handle unauthorized responses based on provided behavior
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Re-throw the error to be handled by React Query
      throw error instanceof Error ? error : new Error(String(error));
    }
  };

/**
 * Centralized React Query client with default configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
