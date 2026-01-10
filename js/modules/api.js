// API Configuration
export const API_BASE_URL = 'http://localhost:8080/api/v1';

/**
 * Makes an API request with proper error handling
 */
export async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        // Handle 204 No Content separately as it has no JSON
        if (response.status === 204) {
            return null;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}
