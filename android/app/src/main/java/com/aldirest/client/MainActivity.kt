package com.aldirest.client

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.aldirest.client.data.repo.ServiceRepository
import com.aldirest.client.ui.ServiceViewModel
import com.aldirest.client.ui.ServiceVmFactory
import com.aldirest.client.ui.screens.MasterScreen
import com.aldirest.client.ui.screens.TransactionScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                MainApp()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainApp() {
    val repository = remember { ServiceRepository() }
    val viewModel: ServiceViewModel = viewModel(factory = ServiceVmFactory(repository))
    var currentScreen by remember { mutableStateOf(0) } // 0 = Transactions, 1 = Master Services

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (currentScreen == 0) "Transactions" else "Services") },
                colors = TopAppBarDefaults.smallTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    icon = { Icon(Icons.Default.List, contentDescription = "Transactions") },
                    label = { Text("Transactions") },
                    selected = currentScreen == 0,
                    onClick = { currentScreen = 0 }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Home, contentDescription = "Services") },
                    label = { Text("Services") },
                    selected = currentScreen == 1,
                    onClick = { currentScreen = 1 }
                )
            }
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (currentScreen) {
                0 -> TransactionScreen(viewModel)
                1 -> MasterScreen(viewModel)
            }
        }
    }
}
