
import { toast } from "sonner";

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in ms
 * @returns Result of the function or throws an error
 */
export async function withRetry<T>(
  fn: () => Promise<T>, 
  maxRetries = 3, 
  initialDelay = 1000
): Promise<T> {
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries <= maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (retries >= maxRetries) break;
      
      const backoffDelay = initialDelay * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      retries++;
    }
  }
  
  throw lastError || new Error("All retry attempts failed");
}

/**
 * Handle common Supabase errors
 * @param error Error object
 * @param customMessage Optional custom message
 * @returns Formatted error message
 */
export function handleSupabaseError(error: any, customMessage = "An error occurred"): string {
  if (!error) return customMessage;
  
  // Check if it's a network error
  if (error.message?.includes("Failed to fetch") || error.name === "TypeError") {
    return "Network connection error. Please check your internet connection and try again.";
  }
  
  // Check if it's an auth error
  if (error.status === 401 || error.code === "PGRST301") {
    return "Authentication error. Please sign in again.";
  }
  
  // Return the error message or a fallback
  return error.message || error.error_description || customMessage;
}

/**
 * Show an error toast with retry option
 * @param message Error message
 * @param retryFn Function to retry
 */
export function showErrorToast(message: string, retryFn?: () => void): void {
  if (retryFn) {
    toast.error(message, {
      action: {
        label: "Retry",
        onClick: retryFn
      }
    });
  } else {
    toast.error(message);
  }
}
