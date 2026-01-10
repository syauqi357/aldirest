import { apiRequest } from './api.js';
import { showNotification } from './utils.js';

export async function getTransactions() {
    return await apiRequest('/transactions');
}

export async function createTransaction(formData) {
    // Note: Do not set Content-Type header for FormData, browser sets it with boundary
    return await apiRequest('/transactions', {
        method: 'POST',
        body: formData
    });
}

export async function updateTransactionStatus(id, status) {
    return await apiRequest(`/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status })
    });
}

export async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return false;
    
    try {
        await apiRequest(`/transactions/${id}`, { method: 'DELETE' });
        showNotification('Transaction deleted successfully!', 'success');
        return true;
    } catch (error) {
        showNotification('Error deleting transaction: ' + error.message, 'error');
        return false;
    }
}
