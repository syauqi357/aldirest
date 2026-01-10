package com.aldirest.client.ui

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aldirest.client.data.models.Service
import com.aldirest.client.data.models.ServiceTransaction
import com.aldirest.client.data.repo.ServiceRepository
import kotlinx.coroutines.launch
import java.io.File

data class ServiceUiState(
    val services: List<Service> = emptyList(),
    val transactions: List<ServiceTransaction> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class ServiceViewModel(private val repository: ServiceRepository) : ViewModel() {
    private val _uiState = mutableStateOf(ServiceUiState())
    val uiState: State<ServiceUiState> = _uiState

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val services = repository.getServices()
                val transactions = repository.getTransactions()
                _uiState.value = _uiState.value.copy(
                    services = services,
                    transactions = transactions,
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Unknown error"
                )
            }
        }
    }

    fun createTransaction(
        serviceId: Int,
        customerName: String,
        deviceType: String,
        deviceBrand: String,
        problem: String,
        price: Int,
        imageFile: File?,
        onResult: (Boolean) -> Unit
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val success = repository.createTransaction(
                serviceId, customerName, deviceType, deviceBrand, problem, price, imageFile
            )
            if (success) {
                loadData()
            } else {
                _uiState.value = _uiState.value.copy(isLoading = false, error = "Failed to create transaction")
            }
            onResult(success)
        }
    }

    fun deleteTransaction(id: Int) {
        viewModelScope.launch {
            val success = repository.deleteTransaction(id)
            if (success) loadData()
        }
    }

    fun updateStatus(id: Int, status: String) {
        viewModelScope.launch {
            val success = repository.updateStatus(id, status)
            if (success) loadData()
        }
    }
}
