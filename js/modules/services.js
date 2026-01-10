import { apiRequest } from './api.js';
import { showNotification } from './utils.js';

export async function getServices() {
    return await apiRequest('/services');
}

export async function getService(id) {
    return await apiRequest(`/services/${id}`);
}

export async function createService(data) {
    return await apiRequest('/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

export async function updateService(id, data) {
    return await apiRequest(`/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

export async function deleteService(id) {
    if (!confirm('Are you sure you want to delete this service?')) return false;
    
    try {
        await apiRequest(`/services/${id}`, { method: 'DELETE' });
        showNotification('Service deleted successfully!', 'success');
        return true;
    } catch (error) {
        showNotification('Error deleting service: ' + error.message, 'error');
        return false;
    }
}
