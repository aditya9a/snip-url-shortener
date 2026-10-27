import axios from 'axios';

// Create a configured Axios instance
const api = axios.create({
  // Use Vite's environment variables (import.meta.env)
  // In development, this points to our Express server.
  // In production, it will be the real domain.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  
  // CRITICAL: Tells Axios to send cookies (like our HTTP-only JWT) with every request
  withCredentials: true,
  
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor
// This runs automatically on every response BEFORE your code handles it.
api.interceptors.response.use(
  (response) => {
    // If the request succeeds, just return the data
    return response;
  },
  (error) => {
    // If the request fails (e.g., 401 Unauthorized), we can handle it globally here
    if (error.response?.status === 401) {
      // The user's token expired or is invalid.
      // We could trigger a global logout action here, or redirect to /login.
      // We'll wire this up to our AuthContext later.
      console.warn('Authentication failed. User needs to log in.');
    }
    
    // Always reject the promise so the component making the request can handle the error too
    return Promise.reject(error);
  }
);

export default api;
