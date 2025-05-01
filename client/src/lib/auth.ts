import { apiRequest } from "./queryClient";
import { z } from "zod";

// Login payload schema
export const loginSchema = z.object({
  workId: z.string().min(1, "Work ID is required"),
  email: z.string().email("Invalid email format")
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Help request schema
export const helpRequestSchema = z.object({
  workId: z.string().min(1, "Work ID is required"),
  email: z.string().email("Invalid email format"),
  message: z.string().min(1, "Message is required")
});

export type HelpRequestData = z.infer<typeof helpRequestSchema>;

// Auth service
export const authService = {
  async login(credentials: LoginCredentials) {
    const res = await apiRequest('POST', '/api/auth/login', credentials);
    return res.json();
  },

  async logout() {
    const res = await apiRequest('POST', '/api/auth/logout');
    return res.json();
  },

  async getCurrentUser() {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (!res.ok) {
        if (res.status === 401) {
          return null;
        }
        throw new Error('Failed to get current user');
      }

      const data = await res.json();
      return data.user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  async submitHelpRequest(data: HelpRequestData) {
    const res = await apiRequest('POST', '/api/auth/help-request', data);
    return res.json();
  }
};
