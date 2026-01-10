package com.aldirest.client.data.models

data class ServiceTransaction(
    val id: Int,
    val service_id: Int,
    val service_name: String,
    val customer_name: String,
    val device_type: String,
    val device_brand: String,
    val problem: String,
    val image_path: String?,
    val price: Int,
    val status: String,
    val date: String
)
