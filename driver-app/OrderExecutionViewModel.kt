package com.delivery.driver.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.MediaType.Companion.toMediaType

enum class DeliveryStep {
    OFFER_RECEIVED,
    ACCEPTED_HEADED_TO_RESTAURANT,
    ARRIVED_AT_RESTAURANT,
    PACKAGE_CHECKLIST_VERIFIED,
    PICKED_UP_HEADED_TO_CLIENT,
    ARRIVED_AT_CLIENT,
    DELIVERED
}

data class ActiveOrderState(
    val orderId: String = "",
    val restaurantName: String = "",
    val restaurantAddress: String = "",
    val restaurantLat: Double = 0.0,
    val restaurantLng: Double = 0.0,
    val clientName: String = "",
    val clientAddress: String = "",
    val clientLat: Double = 0.0,
    val clientLng: Double = 0.0,
    val items: List<String> = emptyList(),
    val currentStep: DeliveryStep = DeliveryStep.OFFER_RECEIVED,
    val checklistItemsChecked: Map<String, Boolean> = emptyMap()
)

class OrderExecutionViewModel : ViewModel() {

    private val _orderState = MutableStateFlow(ActiveOrderState())
    val orderState: StateFlow<ActiveOrderState> = _orderState.asStateFlow()

    private val httpClient = OkHttpClient()

    /**
     * Lanzar navegación externa nativa a Waze o Google Maps (Costo cero de API SDK)
     */
    fun launchExternalNavigation(context: Context, destinationLat: Double, destinationLng: Double) {
        val wazeUri = Uri.parse("waze://?ll=$destinationLat,$destinationLng&navigate=yes")
        val wazeIntent = Intent(Intent.ACTION_VIEW, wazeUri).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }

        if (wazeIntent.resolveActivity(context.packageManager) != null) {
            context.startActivity(wazeIntent)
        } else {
            // Fallback a Google Maps Navigation nativo (sin costo de API web)
            val gmapsUri = Uri.parse("google.navigation:q=$destinationLat,$destinationLng&mode=d")
            val gmapsIntent = Intent(Intent.ACTION_VIEW, gmapsUri).apply {
                setPackage("com.google.android.apps.maps")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(gmapsIntent)
        }
    }

    fun onArrivedAtRestaurant() {
        _orderState.value = _orderState.value.copy(currentStep = DeliveryStep.ARRIVED_AT_RESTAURANT)
        syncStatusWithBackend("ARRIVED_AT_RESTAURANT")
    }

    fun toggleChecklistItem(item: String) {
        val current = _orderState.value.checklistItemsChecked.toMutableMap()
        current[item] = !(current[item] ?: false)
        _orderState.value = _orderState.value.copy(checklistItemsChecked = current)
    }

    fun onConfirmPackagePickedUp() {
        _orderState.value = _orderState.value.copy(currentStep = DeliveryStep.PICKED_UP_HEADED_TO_CLIENT)
        syncStatusWithBackend("PICKED_UP")
    }

    fun onOrderDelivered() {
        _orderState.value = _orderState.value.copy(currentStep = DeliveryStep.DELIVERED)
        syncStatusWithBackend("DELIVERED")
    }

    private fun syncStatusWithBackend(status: String) {
        viewModelScope.launch {
            val orderId = _orderState.value.orderId
            val json = """{"status": "$status"}"""
            val request = Request.Builder()
                .url("https://api.tudelivery.com/v1/orders/$orderId/status")
                .patch(json.toRequestBody("application/json".toMediaType()))
                .build()

            try {
                httpClient.newCall(request).execute().close()
            } catch (e: Exception) {
                // Registro local en Room DB para reintentos si no hay señal
            }
        }
    }
}
