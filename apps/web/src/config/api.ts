// API Configuration
export const API_BASE_URL = 'http://localhost:8081/api/v1'

// Helper function to build API URLs
export const apiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`