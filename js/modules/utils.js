/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format number with thousand separators (Indonesian Locale)
 */
export function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format date to readable format
 */
export function formatDate(dateString) {
    if (!dateString) return '-';
    // Go format might include timezone, JS handles ISO 8601 well
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

/**
 * Shows a notification to the user
 */
export function showNotification(message, type = 'info') {
    // For now using alert, but prepared for UI upgrade
    // In the future this can use a Toast component
    alert(message);
}
