package com.aldirest.client.data.models

data class ApiResponse<T>(
    val message: String? = null,
    val error: String? = null,
    val data: T? = null
)
