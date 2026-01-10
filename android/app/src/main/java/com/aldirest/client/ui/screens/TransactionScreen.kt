package com.aldirest.client.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import coil.compose.rememberAsyncImagePainter
import com.aldirest.client.data.models.Service
import com.aldirest.client.data.models.ServiceTransaction
import com.aldirest.client.ui.ServiceViewModel
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionScreen(viewModel: ServiceViewModel) {
    val uiState by viewModel.uiState
    var showAddDialog by remember { mutableStateOf(false) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Add Transaction")
            }
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            if (uiState.isLoading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            }

            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(uiState.transactions) { transaction ->
                    TransactionItem(
                        transaction = transaction,
                        onDelete = { viewModel.deleteTransaction(transaction.id) },
                        onStatusChange = { newStatus -> viewModel.updateStatus(transaction.id, newStatus) }
                    )
                }
            }

            if (showAddDialog) {
                AddTransactionDialog(
                    services = uiState.services,
                    onDismiss = { showAddDialog = false },
                    onSubmit = { serviceId, customer, type, brand, problem, price, file ->
                        viewModel.createTransaction(serviceId, customer, type, brand, problem, price, file) {
                            if (it) showAddDialog = false
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun TransactionItem(
    transaction: ServiceTransaction,
    onDelete: () -> Unit,
    onStatusChange: (String) -> Unit
) {
    Card(
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = transaction.customer_name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Rp ${transaction.price}",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = "${transaction.device_type} - ${transaction.device_brand}")
            Text(text = "Problem: ${transaction.problem}", style = MaterialTheme.typography.bodyMedium)
            Text(text = "Service: ${transaction.service_name}", style = MaterialTheme.typography.bodySmall)
            
            if (transaction.image_path != null) {
                Spacer(modifier = Modifier.height(8.dp))
                // Note: Use coil for image loading. URL needs 10.0.2.2 if on emulator
                val imageUrl = "http://10.0.2.2:8080" + transaction.image_path
                Image(
                    painter = rememberAsyncImagePainter(imageUrl),
                    contentDescription = "Device Image",
                    modifier = Modifier
                        .height(150.dp)
                        .fillMaxWidth()
                        .background(Color.Gray, RoundedCornerShape(8.dp)),
                    contentScale = ContentScale.Crop
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                StatusDropdown(currentStatus = transaction.status, onStatusChange = onStatusChange)
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.Red)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StatusDropdown(currentStatus: String, onStatusChange: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val statuses = listOf("Pending", "In Progress", "Completed", "Cancelled")

    Box {
        OutlinedButton(onClick = { expanded = true }) {
            Text(currentStatus)
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            statuses.forEach { status ->
                DropdownMenuItem(
                    text = { Text(status) },
                    onClick = {
                        onStatusChange(status)
                        expanded = false
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddTransactionDialog(
    services: List<Service>,
    onDismiss: () -> Unit,
    onSubmit: (Int, String, String, String, String, Int, File?) -> Unit
) {
    var selectedService by remember { mutableStateOf<Service?>(null) }
    var customerName by remember { mutableStateOf("") }
    var deviceType by remember { mutableStateOf("") }
    var deviceBrand by remember { mutableStateOf("") }
    var problem by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("") }
    var expandedService by remember { mutableStateOf(false) }
    
    // Simplification: In a real app, you'd implement an ImagePicker here.
    // For this generated code, we'll pass null for the file to assume text-only creation first
    // or you can implement a local file picker if needed.
    val imageFile: File? = null 

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(text = "New Transaction", style = MaterialTheme.typography.headlineSmall)

                // Service Dropdown
                ExposedDropdownMenuBox(
                    expanded = expandedService,
                    onExpandedChange = { expandedService = !expandedService }
                ) {
                    OutlinedTextField(
                        value = selectedService?.name ?: "Select Service",
                        onValueChange = {},
                        readOnly = true,
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedService) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = expandedService,
                        onDismissRequest = { expandedService = false }
                    ) {
                        services.forEach { service ->
                            DropdownMenuItem(
                                text = { Text("${service.name} - Rp ${service.price}") },
                                onClick = {
                                    selectedService = service
                                    price = service.price.toString()
                                    expandedService = false
                                }
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = customerName,
                    onValueChange = { customerName = it },
                    label = { Text("Customer Name") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = deviceType,
                    onValueChange = { deviceType = it },
                    label = { Text("Device Type (e.g. Laptop)") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = deviceBrand,
                    onValueChange = { deviceBrand = it },
                    label = { Text("Device Brand") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = problem,
                    onValueChange = { problem = it },
                    label = { Text("Problem") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )

                OutlinedTextField(
                    value = price,
                    onValueChange = { price = it },
                    label = { Text("Price") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )
                
                Text(text = "Image Upload not implemented in generated code (requires ActivityResultLauncher)", style = MaterialTheme.typography.bodySmall, color = Color.Gray)

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onDismiss) { Text("Cancel") }
                    Button(
                        onClick = {
                            selectedService?.let { service ->
                                onSubmit(
                                    service.id,
                                    customerName,
                                    deviceType,
                                    deviceBrand,
                                    problem,
                                    price.toIntOrNull() ?: 0,
                                    imageFile
                                )
                            }
                        },
                        enabled = selectedService != null && customerName.isNotEmpty()
                    ) {
                        Text("Save")
                    }
                }
            }
        }
    }
}
