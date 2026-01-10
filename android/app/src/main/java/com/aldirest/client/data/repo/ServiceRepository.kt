package com.aldirest.client.data.repo

import com.aldirest.client.data.models.Service
import com.aldirest.client.data.models.ServiceTransaction
import com.aldirest.client.data.remotes.RetrofitClient
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class ServiceRepository {
    private val api = RetrofitClient.instance

    suspend fun getServices(): List<Service> {
        return try {
            api.getServices()
        } catch (e: Exception) {
            android.util.Log.e("ServiceRepo", "Error fetching services", e)
            emptyList()
        }
    }

    suspend fun getTransactions(): List<ServiceTransaction> {
        return try {
            api.getTransactions()
        } catch (e: Exception) {
            android.util.Log.e("ServiceRepo", "Error fetching transactions", e)
            emptyList()
        }
    }

    suspend fun createTransaction(
        serviceId: Int,
        customerName: String,
        deviceType: String,
        deviceBrand: String,
        problem: String,
        price: Int,
        imageFile: File?
    ): Boolean {
        return try {
            val serviceIdPart = serviceId.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val customerNamePart = customerName.toRequestBody("text/plain".toMediaTypeOrNull())
            val deviceTypePart = deviceType.toRequestBody("text/plain".toMediaTypeOrNull())
            val deviceBrandPart = deviceBrand.toRequestBody("text/plain".toMediaTypeOrNull())
            val problemPart = problem.toRequestBody("text/plain".toMediaTypeOrNull())
            val pricePart = price.toString().toRequestBody("text/plain".toMediaTypeOrNull())

            val imagePart = imageFile?.let {
                val requestFile = it.readBytes().toRequestBody("image/*".toMediaTypeOrNull())
                MultipartBody.Part.createFormData("image", it.name, requestFile)
            }

            val response = api.createTransaction(
                serviceIdPart,
                customerNamePart,
                deviceTypePart,
                deviceBrandPart,
                problemPart,
                pricePart,
                imagePart
            )
            if (!response.isSuccessful) {
                android.util.Log.e("ServiceRepo", "Create failed: ${response.code()} ${response.message()}")
            }
            response.isSuccessful
        } catch (e: Exception) {
            android.util.Log.e("ServiceRepo", "Error creating transaction", e)
            false
        }
    }


    suspend fun deleteTransaction(id: Int): Boolean {
        return try {
            val response = api.deleteTransaction(id)
            response.isSuccessful
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    suspend fun updateStatus(id: Int, status: String): Boolean {
        return try {
            val response = api.updateTransactionStatus(id, mapOf("status" to status))
            response.isSuccessful
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}
