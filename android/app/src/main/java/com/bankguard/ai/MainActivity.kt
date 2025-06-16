/**
 * BankGuard AI - Android Main Activity
 * 
 * Main entry point for the Android application. This activity handles
 * the initialization of behavioral biometric collection, ML model loading,
 * and privacy-compliant data processing.
 * 
 * Key Features:
 * - On-device behavioral biometric collection
 * - TensorFlow Lite model inference
 * - Privacy-first data handling (GDPR/DPDP compliant)
 * - Accessibility support for users with disabilities
 * - Real-time fraud detection and security responses
 */

package com.bankguard.ai

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.biometrics.BiometricPrompt
import android.os.Bundle
import android.os.CancellationSignal
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

// Internal imports
import com.bankguard.ai.biometrics.BehavioralBiometricsCollector
import com.bankguard.ai.ml.FraudDetectionModel
import com.bankguard.ai.security.SecurityResponseHandler
import com.bankguard.ai.privacy.PrivacyManager
import com.bankguard.ai.accessibility.AccessibilityHelper
import com.bankguard.ai.ui.theme.BankGuardAITheme
import com.bankguard.ai.ui.components.DashboardScreen
import com.bankguard.ai.data.models.BehavioralMetrics
import com.bankguard.ai.data.models.SecurityResponse

class MainActivity : ComponentActivity() {
    
    companion object {
        private const val TAG = "BankGuardAI"
        private const val PERMISSION_REQUEST_CODE = 1001
    }
    
    // Core components
    private lateinit var biometricsCollector: BehavioralBiometricsCollector
    private lateinit var fraudDetectionModel: FraudDetectionModel
    private lateinit var securityHandler: SecurityResponseHandler
    private lateinit var privacyManager: PrivacyManager
    private lateinit var accessibilityHelper: AccessibilityHelper
    
    // State management
    private var isCollectingBiometrics by mutableStateOf(false)
    private var currentRiskScore by mutableStateOf(0.0f)
    private var securityStatus by mutableStateOf("Secure")
    
    // Permission launcher
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.values.all { it }
        if (allGranted) {
            initializeBankGuardAI()
        } else {
            showPermissionDeniedMessage()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.i(TAG, "BankGuard AI initializing...")
        
        // Initialize privacy manager first (GDPR/DPDP compliance)
        privacyManager = PrivacyManager(this)
        
        // Initialize accessibility helper
        accessibilityHelper = AccessibilityHelper(this)
        
        // Check and request permissions
        checkAndRequestPermissions()
        
        setContent {
            BankGuardAITheme {
                BankGuardAIApp()
            }
        }
    }
    
    /**
     * Main UI composition function
     */
    @Composable
    private fun BankGuardAIApp() {
        val context = LocalContext.current
        
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Security Status Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Security Status",
                            style = MaterialTheme.typography.headlineSmall
                        )
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Text(
                            text = securityStatus,
                            style = MaterialTheme.typography.bodyLarge,
                            color = when (securityStatus) {
                                "Secure" -> MaterialTheme.colorScheme.primary
                                "Warning" -> MaterialTheme.colorScheme.error
                                else -> MaterialTheme.colorScheme.onSurface
                            }
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // Risk Score Indicator
                        LinearProgressIndicator(
                            progress = currentRiskScore,
                            modifier = Modifier.fillMaxWidth(),
                            color = when {
                                currentRiskScore < 0.3f -> MaterialTheme.colorScheme.primary
                                currentRiskScore < 0.7f -> MaterialTheme.colorScheme.tertiary
                                else -> MaterialTheme.colorScheme.error
                            }
                        )
                        
                        Text(
                            text = "Risk Score: ${(currentRiskScore * 100).toInt()}%",
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
                
                // Biometric Collection Status
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Behavioral Analysis",
                            style = MaterialTheme.typography.headlineSmall
                        )
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        if (isCollectingBiometrics) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp)
                            )
                            Text(
                                text = "Analyzing behavior patterns...",
                                style = MaterialTheme.typography.bodyMedium,
                                modifier = Modifier.padding(top = 8.dp)
                            )
                        } else {
                            Text(
                                text = "Monitoring inactive",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
                
                // Control Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Button(
                        onClick = { toggleBiometricCollection() },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = if (isCollectingBiometrics) "Stop Monitoring" else "Start Monitoring"
                        )
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    OutlinedButton(
                        onClick = { showPrivacySettings() },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Privacy Settings")
                    }
                }
                
                // Accessibility Information
                if (accessibilityHelper.isAccessibilityEnabled()) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    ) {
                        Text(
                            text = "Accessibility features are active. Voice guidance and enhanced navigation are available.",
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                }
            }
        }
    }
    
    /**
     * Check and request necessary permissions
     */
    private fun checkAndRequestPermissions() {
        val permissions = arrayOf(
            Manifest.permission.USE_BIOMETRIC,
            Manifest.permission.USE_FINGERPRINT,
            Manifest.permission.INTERNET,
            Manifest.permission.ACCESS_NETWORK_STATE,
            Manifest.permission.VIBRATE
        )
        
        val permissionsToRequest = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        
        if (permissionsToRequest.isNotEmpty()) {
            permissionLauncher.launch(permissionsToRequest.toTypedArray())
        } else {
            initializeBankGuardAI()
        }
    }
    
    /**
     * Initialize BankGuard AI components
     */
    private fun initializeBankGuardAI() {
        lifecycleScope.launch {
            try {
                Log.i(TAG, "Initializing BankGuard AI components...")
                
                // Initialize ML model (TensorFlow Lite)
                fraudDetectionModel = FraudDetectionModel(this@MainActivity)
                fraudDetectionModel.initialize()
                
                // Initialize behavioral biometrics collector
                biometricsCollector = BehavioralBiometricsCollector(
                    context = this@MainActivity,
                    privacyManager = privacyManager,
                    accessibilityHelper = accessibilityHelper
                )
                
                // Initialize security response handler
                securityHandler = SecurityResponseHandler(
                    context = this@MainActivity,
                    biometricCallback = ::handleBiometricAuthentication
                )
                
                // Set up biometric data callback
                biometricsCollector.setDataCallback { metrics ->
                    processBehavioralMetrics(metrics)
                }
                
                Log.i(TAG, "BankGuard AI initialized successfully")
                
                // Start automatic monitoring if user has consented
                if (privacyManager.hasUserConsent()) {
                    startBiometricCollection()
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error initializing BankGuard AI", e)
                showErrorMessage("Failed to initialize security system")
            }
        }
    }
    
    /**
     * Process behavioral metrics using on-device ML
     */
    private fun processBehavioralMetrics(metrics: BehavioralMetrics) {
        lifecycleScope.launch {
            try {
                // Run fraud detection model on-device (privacy-preserving)
                val riskScore = fraudDetectionModel.predict(metrics)
                
                // Update UI state
                currentRiskScore = riskScore
                
                // Determine security response based on risk score
                val response = determineSecurityResponse(riskScore, metrics)
                
                // Execute security response if needed
                if (response != null) {
                    securityHandler.executeResponse(response)
                    updateSecurityStatus(response)
                }
                
                // Send anonymized data to backend (only risk score and metadata)
                sendAnonymizedMetrics(metrics, riskScore)
                
            } catch (e: Exception) {
                Log.e(TAG, "Error processing behavioral metrics", e)
            }
        }
    }
    
    /**
     * Determine appropriate security response based on risk assessment
     */
    private fun determineSecurityResponse(
        riskScore: Float, 
        metrics: BehavioralMetrics
    ): SecurityResponse? {
        return when {
            riskScore >= 0.95f -> SecurityResponse(
                type = SecurityResponse.Type.ACCOUNT_LOCK,
                severity = SecurityResponse.Severity.CRITICAL,
                message = "Critical security threat detected. Account locked.",
                requiresUserAction = true
            )
            
            riskScore >= 0.8f -> SecurityResponse(
                type = SecurityResponse.Type.SESSION_TERMINATION,
                severity = SecurityResponse.Severity.HIGH,
                message = "High risk activity detected. Session terminated.",
                requiresUserAction = true
            )
            
            riskScore >= 0.6f -> SecurityResponse(
                type = SecurityResponse.Type.OTP_CHALLENGE,
                severity = SecurityResponse.Severity.MEDIUM,
                message = "Additional verification required.",
                requiresUserAction = true
            )
            
            riskScore >= 0.3f -> SecurityResponse(
                type = SecurityResponse.Type.SILENT_FACEID,
                severity = SecurityResponse.Severity.LOW,
                message = "Background security check.",
                requiresUserAction = false
            )
            
            else -> null // No action needed
        }
    }
    
    /**
     * Send anonymized metrics to backend
     */
    private fun sendAnonymizedMetrics(metrics: BehavioralMetrics, riskScore: Float) {
        lifecycleScope.launch {
            try {
                // Only send anonymized, aggregated data (GDPR/DPDP compliant)
                val anonymizedData = privacyManager.anonymizeMetrics(metrics, riskScore)
                
                // Send to backend API
                // Implementation would use Retrofit or similar HTTP client
                Log.d(TAG, "Sending anonymized metrics to backend")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error sending anonymized metrics", e)
            }
        }
    }
    
    /**
     * Handle biometric authentication callback
     */
    private fun handleBiometricAuthentication(result: BiometricPrompt.AuthenticationResult) {
        when (result.authenticationType) {
            BiometricPrompt.AUTHENTICATION_RESULT_TYPE_BIOMETRIC -> {
                Log.i(TAG, "Biometric authentication successful")
                securityStatus = "Secure"
            }
            else -> {
                Log.w(TAG, "Biometric authentication failed")
                securityStatus = "Warning"
            }
        }
    }
    
    /**
     * Toggle biometric collection on/off
     */
    private fun toggleBiometricCollection() {
        if (isCollectingBiometrics) {
            stopBiometricCollection()
        } else {
            startBiometricCollection()
        }
    }
    
    /**
     * Start behavioral biometric collection
     */
    private fun startBiometricCollection() {
        if (!privacyManager.hasUserConsent()) {
            showPrivacyConsentDialog()
            return
        }
        
        lifecycleScope.launch {
            try {
                biometricsCollector.startCollection()
                isCollectingBiometrics = true
                securityStatus = "Monitoring"
                
                Log.i(TAG, "Behavioral biometric collection started")
                
                // Accessibility announcement
                if (accessibilityHelper.isAccessibilityEnabled()) {
                    accessibilityHelper.announceForAccessibility(
                        "Security monitoring started. Your behavioral patterns are being analyzed for fraud detection."
                    )
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error starting biometric collection", e)
                showErrorMessage("Failed to start security monitoring")
            }
        }
    }
    
    /**
     * Stop behavioral biometric collection
     */
    private fun stopBiometricCollection() {
        lifecycleScope.launch {
            try {
                biometricsCollector.stopCollection()
                isCollectingBiometrics = false
                securityStatus = "Inactive"
                currentRiskScore = 0.0f
                
                Log.i(TAG, "Behavioral biometric collection stopped")
                
                // Accessibility announcement
                if (accessibilityHelper.isAccessibilityEnabled()) {
                    accessibilityHelper.announceForAccessibility("Security monitoring stopped.")
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error stopping biometric collection", e)
            }
        }
    }
    
    /**
     * Show privacy consent dialog
     */
    private fun showPrivacyConsentDialog() {
        // Implementation would show a comprehensive privacy consent dialog
        // explaining data collection, processing, and user rights under GDPR/DPDP
        Log.i(TAG, "Showing privacy consent dialog")
    }
    
    /**
     * Show privacy settings
     */
    private fun showPrivacySettings() {
        // Implementation would show privacy settings screen
        // allowing users to control data collection and processing
        Log.i(TAG, "Showing privacy settings")
    }
    
    /**
     * Update security status based on response
     */
    private fun updateSecurityStatus(response: SecurityResponse) {
        securityStatus = when (response.severity) {
            SecurityResponse.Severity.CRITICAL -> "Critical Alert"
            SecurityResponse.Severity.HIGH -> "High Risk"
            SecurityResponse.Severity.MEDIUM -> "Medium Risk"
            SecurityResponse.Severity.LOW -> "Low Risk"
        }
    }
    
    /**
     * Show permission denied message
     */
    private fun showPermissionDeniedMessage() {
        Toast.makeText(
            this,
            "BankGuard AI requires permissions to function properly. Please grant permissions in settings.",
            Toast.LENGTH_LONG
        ).show()
    }
    
    /**
     * Show error message
     */
    private fun showErrorMessage(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        
        // Clean up resources
        if (::biometricsCollector.isInitialized) {
            biometricsCollector.cleanup()
        }
        
        if (::fraudDetectionModel.isInitialized) {
            fraudDetectionModel.cleanup()
        }
        
        Log.i(TAG, "BankGuard AI cleaned up")
    }
}