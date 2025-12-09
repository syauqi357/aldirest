const API_URL = 'http://localhost/aldirest/api.php'; // Change this to your API URL

// Table sorting state
let sortDirections = {};

// Show/Hide sections
function showSection(section) {
    document.getElementById('services-section').style.display = section === 'services' ? 'flex' : 'none';
    document.getElementById('transactions-section').style.display = section === 'transactions' ? 'flex' : 'none';
    
    // Update button styles
    document.getElementById('btn-services').className = section === 'services' 
        ? 'px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
        : 'px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition';
    document.getElementById('btn-transactions').className = section === 'transactions'
        ? 'px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
        : 'px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition';
    
    if (section === 'services') {
        loadServices();
    } else if (section === 'transactions') {
        loadTransactions();
        loadServicesDropdown();
    }
}

// Table sorting function with icon updates
function sortTable(tableId, columnIndex) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    const sortKey = `${tableId}-${columnIndex}`;
    const isAscending = !sortDirections[sortKey];
    sortDirections[sortKey] = isAscending;
    
    rows.sort((a, b) => {
        let aValue = a.cells[columnIndex].textContent.trim();
        let bValue = b.cells[columnIndex].textContent.trim();
        
        // Try to parse as number
        const aNum = parseFloat(aValue.replace(/[^0-9.-]/g, ''));
        const bNum = parseFloat(bValue.replace(/[^0-9.-]/g, ''));
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return isAscending ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison
        return isAscending 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
    });
    
    // Re-append sorted rows
    rows.forEach(row => tbody.appendChild(row));
    
    // Update sort icon
    updateSortIcon(columnIndex, isAscending);
}

// Update sort icon based on direction
function updateSortIcon(columnIndex, isAscending) {
    const iconSpan = document.getElementById(`sort-icon-${columnIndex}`);
    if (!iconSpan) return;
    
    if (isAscending) {
        // Arrow up (ascending)
        iconSpan.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-sort-up" viewBox="0 0 16 16" id="Sort-Up--Streamline-Bootstrap" height="16" width="16">
  <desc>
    Sort Up Streamline Icon: https://streamlinehq.com
  </desc>
  <path d="M3.5 12.5a0.5 0.5 0 0 1 -1 0V3.707L1.354 4.854a0.5 0.5 0 1 1 -0.708 -0.708l2 -1.999 0.007 -0.007a0.5 0.5 0 0 1 0.7 0.006l2 2a0.5 0.5 0 1 1 -0.707 0.708L3.5 3.707zm3.5 -9a0.5 0.5 0 0 1 0.5 -0.5h7a0.5 0.5 0 0 1 0 1h-7a0.5 0.5 0 0 1 -0.5 -0.5M7.5 6a0.5 0.5 0 0 0 0 1h5a0.5 0.5 0 0 0 0 -1zm0 3a0.5 0.5 0 0 0 0 1h3a0.5 0.5 0 0 0 0 -1zm0 3a0.5 0.5 0 0 0 0 1h1a0.5 0.5 0 0 0 0 -1z" stroke-width="1"></path>
</svg>
        `;
    } else {
        // Arrow down (descending)
        iconSpan.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-sort-down" viewBox="0 0 16 16" id="Sort-Down--Streamline-Bootstrap" height="16" width="16">
  <desc>
    Sort Down Streamline Icon: https://streamlinehq.com
  </desc>
  <path d="M3.5 2.5a0.5 0.5 0 0 0 -1 0v8.793l-1.146 -1.147a0.5 0.5 0 0 0 -0.708 0.708l2 1.999 0.007 0.007a0.497 0.497 0 0 0 0.7 -0.006l2 -2a0.5 0.5 0 0 0 -0.707 -0.708L3.5 11.293zm3.5 1a0.5 0.5 0 0 1 0.5 -0.5h7a0.5 0.5 0 0 1 0 1h-7a0.5 0.5 0 0 1 -0.5 -0.5M7.5 6a0.5 0.5 0 0 0 0 1h5a0.5 0.5 0 0 0 0 -1zm0 3a0.5 0.5 0 0 0 0 1h3a0.5 0.5 0 0 0 0 -1zm0 3a0.5 0.5 0 0 0 0 1h1a0.5 0.5 0 0 0 0 -1z" stroke-width="1"></path>
</svg>
        `;
    }
}

// ============ SERVICES ============

// Load all services
async function loadServices() {
    try {
        const response = await fetch(`${API_URL}?endpoint=services`);
        const services = await response.json();
        
        const tbody = document.querySelector('#services-table tbody');
        tbody.innerHTML = '';
        
        services.forEach(service => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${service.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${service.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp ${parseInt(service.price).toLocaleString('id-ID')}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${service.description || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick='editService(${service.id}, \`${service.name}\`, ${service.price}, \`${service.description || ''}\`)' class="text-blue-600 hover:text-blue-900">Edit</button>
                    <button onclick="deleteService(${service.id})" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            `;
        });
    } catch (error) {
        alert('Error loading services: ' + error.message);
    }
}

// Add service
document.getElementById('add-service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('service-name').value,
        price: parseInt(document.getElementById('service-price').value),
        description: document.getElementById('service-description').value
    };
    
    try {
        const response = await fetch(`${API_URL}?endpoint=services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            document.getElementById('add-service-form').reset();
            loadServices();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error adding service: ' + error.message);
    }
});

// Edit service
function editService(id, name, price, description) {
    document.getElementById('edit-service-id').value = id;
    document.getElementById('edit-service-name').value = name;
    document.getElementById('edit-service-price').value = price;
    document.getElementById('edit-service-description').value = description;
    document.getElementById('edit-service-modal').style.display = 'block';
}

function closeEditServiceModal() {
    document.getElementById('edit-service-modal').style.display = 'none';
}

document.getElementById('edit-service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('edit-service-id').value;
    const data = {
        name: document.getElementById('edit-service-name').value,
        price: parseInt(document.getElementById('edit-service-price').value),
        description: document.getElementById('edit-service-description').value
    };
    
    try {
        const response = await fetch(`${API_URL}?endpoint=services&id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            closeEditServiceModal();
            loadServices();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error updating service: ' + error.message);
    }
});

// Delete service
async function deleteService(id) {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
        const response = await fetch(`${API_URL}?endpoint=services&id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            loadServices();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error deleting service: ' + error.message);
    }
}

// ============ TRANSACTIONS ============

// Load services for dropdown
async function loadServicesDropdown() {
    try {
        const response = await fetch(`${API_URL}?endpoint=services`);
        const services = await response.json();
        
        const select = document.getElementById('transaction-service');
        select.innerHTML = '<option value="">Select Service</option>';
        
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = `${service.name} - Rp ${parseInt(service.price).toLocaleString('id-ID')}`;
            option.dataset.price = service.price;
            select.appendChild(option);
        });
    } catch (error) {
        alert('Error loading services: ' + error.message);
    }
}

// Auto-fill price when service is selected
document.getElementById('transaction-service').addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    if (selectedOption.dataset.price) {
        document.getElementById('transaction-price').value = selectedOption.dataset.price;
    }
});

// Load all transactions
async function loadTransactions() {
    try {
        const response = await fetch(`${API_URL}?endpoint=transactions`);
        const transactions = await response.json();
        
        const tbody = document.querySelector('#transactions-table tbody');
        tbody.innerHTML = '';
        
        transactions.forEach(transaction => {
            const statusColors = {
                'Pending': 'bg-yellow-100 text-yellow-800',
                'In Progress': 'bg-blue-100 text-blue-800',
                'Done': 'bg-green-100 text-green-800'
            };
            
            const row = tbody.insertRow();
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${transaction.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${transaction.service_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${transaction.customer_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${transaction.device_type} - ${transaction.device_brand}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${transaction.problem}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp ${parseInt(transaction.price).toLocaleString('id-ID')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.date}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <select onchange="updateStatus(${transaction.id}, this.value)" class="px-3 py-1 rounded-full text-sm font-semibold ${statusColors[transaction.status]}">
                        <option value="Pending" ${transaction.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="In Progress" ${transaction.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Done" ${transaction.status === 'Done' ? 'selected' : ''}>Done</option>
                    </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="deleteTransaction(${transaction.id})" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            `;
        });
    } catch (error) {
        alert('Error loading transactions: ' + error.message);
    }
}

// Add transaction
document.getElementById('add-transaction-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        service_id: parseInt(document.getElementById('transaction-service').value),
        customer_name: document.getElementById('transaction-customer').value,
        device_type: document.getElementById('transaction-device-type').value,
        device_brand: document.getElementById('transaction-device-brand').value,
        problem: document.getElementById('transaction-problem').value,
        price: parseInt(document.getElementById('transaction-price').value)
    };
    
    try {
        const response = await fetch(`${API_URL}?endpoint=transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            document.getElementById('add-transaction-form').reset();
            loadTransactions();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error adding transaction: ' + error.message);
    }
});

// Update transaction status
async function updateStatus(id, status) {
    try {
        const response = await fetch(`${API_URL}?endpoint=transactions&id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Status updated!');
            loadTransactions();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error updating status: ' + error.message);
    }
}

// Delete transaction
async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
        const response = await fetch(`${API_URL}?endpoint=transactions&id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            loadTransactions();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error deleting transaction: ' + error.message);
    }
}

// Initial load
showSection('services');