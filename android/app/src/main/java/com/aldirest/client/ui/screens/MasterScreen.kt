package com.aldirest.client.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.aldirest.client.ui.ServiceViewModel

@Composable
fun MasterScreen(viewModel: ServiceViewModel) {
    val uiState by viewModel.uiState

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(uiState.services) { service ->
            Card(
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = service.name, fontWeight = FontWeight.Bold)
                        Text(text = "Rp ${service.price}", color = MaterialTheme.colorScheme.primary)
                    }
                    if (!service.description.isNullOrEmpty()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(text = service.description, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
    }
}
