const API_URL = 'http://localhost/aldirest/api.php'; // Change this to your API URL
        
        // Show/Hide sections
        function showSection(section) {
            document.getElementById('services-section').style.display = section === 'services' ? 'block' : 'none';
            document.getElementById('transactions-section').style.display = section === 'transactions' ? 'block' : 'none';
            
            if (section === 'services') {
                loadServices();
            } else if (section === 'transactions') {
                loadTransactions();
                loadServicesDropdown();
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
                        <td>${service.id}</td>
                        <td>${service.name}</td>
                        <td>Rp ${service.price}</td>
                        <td>${service.description || '-'}</td>
                        <td>
                            <button onclick="editService(${service.id}, '${service.name}', ${service.price}, '${service.description || ''}')">Edit</button>
                            <button onclick="deleteService(${service.id})">Delete</button>
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
                    option.textContent = `${service.name} - Rp ${service.price}`;
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
                    const row = tbody.insertRow();
                    row.innerHTML = `
                        <td>${transaction.id}</td>
                        <td>${transaction.service_name}</td>
                        <td>${transaction.customer_name}</td>
                        <td>${transaction.device_type} - ${transaction.device_brand}</td>
                        <td>${transaction.problem}</td>
                        <td>Rp ${transaction.price}</td>
                        <td>${transaction.date}</td>
                        <td>
                            <select onchange="updateStatus(${transaction.id}, this.value)">
                                <option value="Pending" ${transaction.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="In Progress" ${transaction.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                <option value="Done" ${transaction.status === 'Done' ? 'selected' : ''}>Done</option>
                            </select>
                        </td>
                        <td>
                            <button onclick="deleteTransaction(${transaction.id})">Delete</button>
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
            
            console.log('Sending data:', data); // DEBUG
            
            try {
                const response = await fetch(`${API_URL}?endpoint=transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const responseText = await response.text(); // Get raw response
                console.log('Raw response:', responseText); // DEBUG
                
                // Show first 500 chars of error in alert if not JSON
                if (!responseText.startsWith('{')) {
                    alert('PHP Error (check console for full error):\n' + responseText.substring(0, 500));
                    return;
                }
                
                const result = JSON.parse(responseText); // Try to parse
                
                if (response.ok) {
                    alert(result.message);
                    document.getElementById('add-transaction-form').reset();
                    loadTransactions();
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                alert('Error adding transaction: ' + error.message);
                console.error('Full error:', error); // DEBUG
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