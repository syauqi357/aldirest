import { getServices, createService, updateService, deleteService, getService } from './modules/services.js';
import { getTransactions, createTransaction, updateTransactionStatus, deleteTransaction } from './modules/transactions.js';
import { formatNumber, formatDate, escapeHtml, showNotification } from './modules/utils.js';
import { API_BASE_URL } from './modules/api.js';

// State
let currentSection = 'services';
const services = []; // Cache if needed, but for now we reload

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    document.querySelectorAll('[data-section]').forEach(button => {
        button.addEventListener('click', (e) => {
            const section = e.target.closest('[data-section]').dataset.section;
            showSection(section);
            // Close sidebar on mobile
            if (window.innerWidth < 768) {
                const sb = document.getElementById('sidebar');
                if (sb) {
                    sb.classList.add('-translate-x-full');
                }
            }
        });
    });

    // Mobile Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
        });
    }

    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
        });
    }

    // Forms
    initServiceForms();
    initTransactionForms();
    initDropZone();

    // Initial Load
    showSection('services');
});

// ============ NAVIGATION ============

function showSection(section) {
    currentSection = section;
    
    // Update UI (Hide/Show Sections)
    document.querySelectorAll('.section-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`${section}-section`).classList.remove('hidden');

    // Update Active State on Nav
    document.querySelectorAll('[data-section]').forEach(el => {
        if (el.dataset.section === section) {
            el.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
            el.classList.remove('text-indigo-100', 'hover:bg-slate-800');
        } else {
            el.classList.remove('bg-indigo-600', 'text-white', 'shadow-md');
            el.classList.add('text-indigo-100', 'hover:bg-slate-800');
        }
    });

    // Load Data
    if (section === 'services') {
        loadServicesTable();
    } else if (section === 'transactions') {
        loadTransactionsTable();
        loadServicesDropdown();
    }
}

// ============ SERVICES UI ============

async function loadServicesTable() {
    const tbody = document.getElementById('services-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">Loading...</td></tr>';

    try {
        const data = await getServices();
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No services found.</td></tr>';
            return;
        }

        data.forEach((service, index) => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 border-b border-gray-100 last:border-0 animate-fade-in-up opacity-0';
            tr.style.animationDelay = `${index * 0.05}s`;
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#${service.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${escapeHtml(service.name)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Rp ${formatNumber(service.price)}</td>
                <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">${escapeHtml(service.description || '-')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3 edit-service-btn" data-id="${service.id}">Edit</button>
                    <button class="text-red-600 hover:text-red-900 delete-service-btn" data-id="${service.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Attach Event Listeners to dynamic buttons
        document.querySelectorAll('.edit-service-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditServiceModal(btn.dataset.id));
        });
        document.querySelectorAll('.delete-service-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if(await deleteService(btn.dataset.id)) loadServicesTable();
            });
        });

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Error: ${error.message}</td></tr>`;
    }
}

function initServiceForms() {
    // Add Service
    document.getElementById('add-service-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('service-name').value,
            price: parseFloat(document.getElementById('service-price').value),
            description: document.getElementById('service-description').value
        };
        
        try {
            await createService(data);
            showNotification('Service added!', 'success');
            e.target.reset();
            loadServicesTable();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // Edit Service Modal & Form
    document.getElementById('close-modal-btn').addEventListener('click', closeEditServiceModal);
    document.getElementById('cancel-edit-btn').addEventListener('click', closeEditServiceModal);

    document.getElementById('edit-service-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-service-id').value;
        const data = {
            name: document.getElementById('edit-service-name').value,
            price: parseFloat(document.getElementById('edit-service-price').value),
            description: document.getElementById('edit-service-description').value
        };

        try {
            await updateService(id, data);
            showNotification('Service updated!', 'success');
            closeEditServiceModal();
            loadServicesTable();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
}

async function openEditServiceModal(id) {
    try {
        const service = await getService(id);
        document.getElementById('edit-service-id').value = service.id;
        document.getElementById('edit-service-name').value = service.name;
        document.getElementById('edit-service-price').value = service.price;
        document.getElementById('edit-service-description').value = service.description || '';
        document.getElementById('edit-service-modal').classList.remove('hidden');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function closeEditServiceModal() {
    document.getElementById('edit-service-modal').classList.add('hidden');
}


// ============ TRANSACTIONS UI ============

async function loadTransactionsTable() {
    const tbody = document.getElementById('transactions-table-body');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">Loading...</td></tr>';

    try {
        const data = await getTransactions();
        
        // Update Stats
        updateDashboardStats(data);

        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-500 italic">No transactions found. Start by creating one!</td></tr>';
            return;
        }

        data.forEach((t, index) => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 border-b border-gray-100 last:border-0 animate-fade-in-up opacity-0';
            tr.style.animationDelay = `${index * 0.05}s`;
            
            // Image handling
            let imageHtml = '<span class="text-gray-400 text-xs">No img</span>';
            if (t.image_path) {
                const fullUrl = `${API_BASE_URL.replace('/api/v1', '')}${t.image_path}`;
                imageHtml = `
                    <a href="${fullUrl}" target="_blank" class="block w-10 h-10 rounded overflow-hidden border border-gray-200 hover:opacity-75 relative group">
                        <img src="${fullUrl}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
                    </a>
                `;
            }

            // Status Badge Color
            let statusColor = 'bg-gray-100 text-gray-800';
            if (t.status === 'Completed') statusColor = 'bg-green-100 text-green-800';
            else if (t.status === 'In Progress') statusColor = 'bg-blue-100 text-blue-800';
            else if (t.status === 'Cancelled') statusColor = 'bg-red-100 text-red-800';
            else if (t.status === 'Pending') statusColor = 'bg-yellow-100 text-yellow-800';

            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#${t.id}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(t.customer_name)}</div>
                    <div class="text-xs text-gray-500">${escapeHtml(t.service_name)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${escapeHtml(t.device_type)}</div>
                    <div class="text-xs text-gray-500">${escapeHtml(t.device_brand)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escapeHtml(t.problem)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center">${imageHtml}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">Rp ${formatNumber(t.price)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <select class="status-select text-xs font-semibold rounded-md px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500 ${statusColor}" data-id="${t.id}">
                        <option value="Pending" ${t.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Completed" ${t.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Cancelled" ${t.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-red-600 hover:text-red-900 delete-transaction-btn" data-id="${t.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Event Listeners
        document.querySelectorAll('.status-select').forEach(sel => {
            sel.addEventListener('change', async (e) => {
                const id = e.target.dataset.id;
                const status = e.target.value;
                try {
                    await updateTransactionStatus(id, status);
                    showNotification('Status updated', 'success');
                    // Update color class dynamically
                    e.target.className = `status-select text-xs font-semibold rounded-md px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500 ${getStatusColor(status)}`;
                } catch (error) {
                    showNotification(error.message, 'error');
                    loadTransactionsTable(); // Revert on error
                }
            });
        });

        document.querySelectorAll('.delete-transaction-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if(await deleteTransaction(btn.dataset.id)) loadTransactionsTable();
            });
        });

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-red-500">Error: ${error.message}</td></tr>`;
    }
}

function getStatusColor(status) {
    if (status === 'Completed') return 'bg-green-100 text-green-800';
    if (status === 'In Progress') return 'bg-blue-100 text-blue-800';
    if (status === 'Cancelled') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
}

async function loadServicesDropdown() {
    const select = document.getElementById('transaction-service');
    // Keep the default option
    select.innerHTML = '<option value="">Select Service</option>';
    
    try {
        const services = await getServices();
        services.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = `${s.name} - Rp ${formatNumber(s.price)}`;
            opt.dataset.price = s.price;
            select.appendChild(opt);
        });
    } catch (error) {
        console.error('Failed to load services for dropdown', error);
    }
}

function initTransactionForms() {
    // Price Auto-fill
    document.getElementById('transaction-service').addEventListener('change', (e) => {
        const option = e.target.options[e.target.selectedIndex];
        if (option.dataset.price) {
            document.getElementById('transaction-price').value = option.dataset.price;
        }
    });

    // Add Transaction
    document.getElementById('add-transaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('service_id', document.getElementById('transaction-service').value);
        formData.append('customer_name', document.getElementById('transaction-customer').value);
        formData.append('device_type', document.getElementById('transaction-device-type').value);
        formData.append('device_brand', document.getElementById('transaction-device-brand').value);
        formData.append('problem', document.getElementById('transaction-problem').value);
        formData.append('price', document.getElementById('transaction-price').value);
        
        const imageFile = document.getElementById('transaction-image').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            await createTransaction(formData);
            showNotification('Transaction created!', 'success');
            e.target.reset();
            resetDropZone();
            loadTransactionsTable();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
}

function initDropZone() {
    const dropZone = document.getElementById('transaction-drop-zone');
    const fileInput = document.getElementById('transaction-image');
    const preview = document.getElementById('transaction-image-preview');
    const prompt = dropZone.querySelector('.prompt');

    dropZone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) updatePreview(fileInput.files[0], preview, prompt);
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-indigo-500', 'bg-indigo-50');
    });

    ['dragleave', 'dragend', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-indigo-500', 'bg-indigo-50');
            if (evt === 'drop' && e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                updatePreview(fileInput.files[0], preview, prompt);
            }
        });
    });
}

function updatePreview(file, preview, prompt) {
    preview.innerHTML = '';
    prompt.classList.add('hidden');
    preview.classList.remove('hidden');

    const reader = new FileReader();
    reader.onload = () => {
        const img = document.createElement('img');
        img.src = reader.result;
        img.className = 'max-h-32 rounded mx-auto';
        preview.appendChild(img);
    };
    reader.readAsDataURL(file);
}

function resetDropZone() {
    const fileInput = document.getElementById('transaction-image');
    const preview = document.getElementById('transaction-image-preview');
    const prompt = document.querySelector('#transaction-drop-zone .prompt');
    
    fileInput.value = '';
    preview.innerHTML = '';
    preview.classList.add('hidden');
    prompt.classList.remove('hidden');
}

function updateDashboardStats(transactions) {
    if (!document.getElementById('stat-revenue')) return;

    const totalRevenue = transactions.reduce((sum, t) => sum + (t.status !== 'Cancelled' ? t.price : 0), 0);
    const activeJobs = transactions.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
    const completedJobs = transactions.filter(t => t.status === 'Completed').length;

    document.getElementById('stat-revenue').textContent = `Rp ${formatNumber(totalRevenue)}`;
    document.getElementById('stat-active').textContent = activeJobs;
    document.getElementById('stat-completed').textContent = completedJobs;
}
