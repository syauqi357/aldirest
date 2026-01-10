package com.aldirest.client.data.remotes

import com.aldirest.client.data.models.Service
import com.aldirest.client.data.models.ServiceTransaction
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    // Services
    @GET("services")
    suspend fun getServices(): List<Service>

    // Transactions
    @GET("transactions")
    suspend fun getTransactions(): List<ServiceTransaction>

    @DELETE("transactions/{id}")
    suspend fun deleteTransaction(@Path("id") id: Int): Response<Unit>

    @PUT("transactions/{id}")
    suspend fun updateTransactionStatus(
        @Path("id") id: Int,
        @Body statusMap: Map<String, String>
    ): Response<Unit>

    @Multipart
    @POST("transactions")
    suspend fun createTransaction(
        @Part("service_id") serviceId: RequestBody,
        @Part("customer_name") customerName: RequestBody,
        @Part("device_type") deviceType: RequestBody,
        @Part("device_brand") deviceBrand: RequestBody,
        @Part("problem") problem: RequestBody,
        @Part("price") price: RequestBody,
        @Part image: MultipartBody.Part?
    ): Response<Unit>
}
