/**
 * BankGuard AI - Behavioral Biometrics Collector
 * 
 * This class handles the collection of behavioral biometric data from user
 * interactions with the mobile device. All data processing is done on-device
 * to ensure privacy compliance with GDPR and DPDP regulations.
 * 
 * Collected Metrics:
 * - Typing rhythm and patterns
 * - Touch dynamics (pressure, area, duration)
 * - Device orientation and movement patterns
 * - Navigation flow and app usage patterns
 * - Accessibility-aware data collection
 * 
 * Privacy Features:
 * - On-device processing only
 * - No raw biometric data storage
 * - Differential privacy techniques
 * - User consent management
 * - Accessibility support
 */

package com.bankguard.ai.biometrics

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.MotionEvent
import android.view.View
import android.view.ViewTreeObserver
import kotlinx.coroutines.*
import java.util.*
import kotlin.collections.ArrayList
import kotlin.math.sqrt

// Internal imports
import com.bankguard.ai.data.models.BehavioralMetrics
import com.bankguard.ai.privacy.PrivacyManager
import com.bankguard.ai.accessibility.AccessibilityHelper

/**
 * Behavioral biometrics collector with privacy-first design
 */
class BehavioralBiometricsCollector(
    private val context: Context,
    private val privacyManager: PrivacyManager,
    private val accessibilityHelper: AccessibilityHelper
) : SensorEventListener {
    
    companion object {
        private const val TAG = "BiometricsCollector"
        private const val COLLECTION_INTERVAL_MS = 5000L // 5 seconds
        private const val MAX_TOUCH_EVENTS = 100
        private const val MAX_TYPING_EVENTS = 50
        private const val SENSOR_SAMPLING_RATE = SensorManager.SENSOR_DELAY_NORMAL
    }
    
    // Sensor management
    private val sensorManager: SensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val accelerometer: Sensor? = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private val gyroscope: Sensor? = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
    
    // Data collection
    private var isCollecting = false
    private val collectionScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private val mainHandler = Handler(Looper.getMainLooper())
    
    // Behavioral data storage (temporary, on-device only)
    private val touchEvents = Collections.synchronizedList(ArrayList<TouchEvent>())
    private val typingEvents = Collections.synchronizedList(ArrayList<TypingEvent>())
    private val sensorData = Collections.synchronizedList(ArrayList<SensorData>())
    private val navigationEvents = Collections.synchronizedList(ArrayList<NavigationEvent>())
    
    // Session management
    private var sessionId: String = UUID.randomUUID().toString()
    private var sessionStartTime: Long = 0
    
    // Callback for processed metrics
    private var dataCallback: ((BehavioralMetrics) -> Unit)? = null
    
    /**
     * Data classes for behavioral events
     */
    data class TouchEvent(
        val timestamp: Long,
        val x: Float,
        val y: Float,
        val pressure: Float,
        val size: Float,
        val duration: Long,
        val action: Int
    )
    
    data class TypingEvent(
        val timestamp: Long,
        val keyCode: Int,
        val dwellTime: Long,
        val flightTime: Long,
        val pressure: Float
    )
    
    data class SensorData(
        val timestamp: Long,
        val sensorType: Int,
        val values: FloatArray,
        val accuracy: Int
    )
    
    data class NavigationEvent(
        val timestamp: Long,
        val screenName: String,
        val action: String,
        val duration: Long
    )
    
    /**
     * Set callback for processed behavioral metrics
     */
    fun setDataCallback(callback: (BehavioralMetrics) -> Unit) {
        this.dataCallback = callback
    }
    
    /**
     * Start behavioral biometric collection
     */
    suspend fun startCollection() {
        if (isCollecting) {
            Log.w(TAG, "Collection already in progress")
            return
        }
        
        // Check user consent
        if (!privacyManager.hasUserConsent()) {
            throw SecurityException("User consent required for biometric collection")
        }
        
        Log.i(TAG, "Starting behavioral biometric collection")
        
        isCollecting = true
        sessionId = UUID.randomUUID().toString()
        sessionStartTime = System.currentTimeMillis()
        
        // Clear previous data
        clearCollectedData()
        
        // Start sensor monitoring
        startSensorCollection()
        
        // Start periodic data processing
        startPeriodicProcessing()
        
        // Accessibility announcement
        if (accessibilityHelper.isAccessibilityEnabled()) {
            accessibilityHelper.announceForAccessibility(
                "Behavioral security monitoring started. Your interaction patterns will be analyzed for fraud detection."
            )
        }
    }
    
    /**
     * Stop behavioral biometric collection
     */
    suspend fun stopCollection() {
        if (!isCollecting) {
            Log.w(TAG, "Collection not in progress")
            return
        }
        
        Log.i(TAG, "Stopping behavioral biometric collection")
        
        isCollecting = false
        
        // Stop sensor monitoring
        stopSensorCollection()
        
        // Process final batch of data
        processCollectedData()
        
        // Clear sensitive data
        clearCollectedData()
        
        // Accessibility announcement
        if (accessibilityHelper.isAccessibilityEnabled()) {
            accessibilityHelper.announceForAccessibility("Security monitoring stopped.")
        }
    }
    
    /**
     * Start sensor data collection
     */
    private fun startSensorCollection() {
        accelerometer?.let { sensor ->
            sensorManager.registerListener(this, sensor, SENSOR_SAMPLING_RATE)
        }
        
        gyroscope?.let { sensor ->
            sensorManager.registerListener(this, sensor, SENSOR_SAMPLING_RATE)
        }
        
        Log.d(TAG, "Sensor collection started")
    }
    
    /**
     * Stop sensor data collection
     */
    private fun stopSensorCollection() {
        sensorManager.unregisterListener(this)
        Log.d(TAG, "Sensor collection stopped")
    }
    
    /**
     * Start periodic data processing
     */
    private fun startPeriodicProcessing() {
        collectionScope.launch {
            while (isCollecting) {
                delay(COLLECTION_INTERVAL_MS)
                
                if (isCollecting) {
                    processCollectedData()
                }
            }
        }
    }
    
    /**
     * Process collected behavioral data into metrics
     */
    private suspend fun processCollectedData() {
        try {
            Log.d(TAG, "Processing collected behavioral data")
            
            // Extract features from collected data
            val typingRhythm = extractTypingRhythm()
            val touchDynamics = extractTouchDynamics()
            val deviceOrientation = extractDeviceOrientation()
            val navigationPattern = extractNavigationPattern()
            
            // Create behavioral metrics (anonymized)
            val metrics = BehavioralMetrics(
                userId = privacyManager.getAnonymizedUserId(),
                sessionId = sessionId,
                timestamp = System.currentTimeMillis(),
                typingRhythm = typingRhythm,
                touchDynamics = touchDynamics,
                deviceOrientation = deviceOrientation,
                navigationPattern = navigationPattern,
                deviceFingerprint = privacyManager.getDeviceFingerprint(),
                timeOfDay = Calendar.getInstance().get(Calendar.HOUR_OF_DAY),
                dayOfWeek = Calendar.getInstance().get(Calendar.DAY_OF_WEEK)
            )
            
            // Invoke callback with processed metrics
            dataCallback?.invoke(metrics)
            
            // Clear processed data to maintain privacy
            clearOldData()
            
        } catch (e: Exception) {
            Log.e(TAG, "Error processing behavioral data", e)
        }
    }
    
    /**
     * Extract typing rhythm features
     */
    private fun extractTypingRhythm(): FloatArray {
        val events = typingEvents.toList()
        if (events.isEmpty()) {
            return FloatArray(10) { 0f } // Return zero vector if no data
        }
        
        // Calculate typing rhythm features
        val dwellTimes = events.map { it.dwellTime.toFloat() }
        val flightTimes = events.map { it.flightTime.toFloat() }
        
        return floatArrayOf(
            dwellTimes.average().toFloat(),
            dwellTimes.standardDeviation(),
            flightTimes.average().toFloat(),
            flightTimes.standardDeviation(),
            events.size.toFloat(),
            calculateTypingSpeed(events),
            calculateTypingConsistency(events),
            calculatePressureVariation(events),
            calculateRhythmEntropy(events),
            calculateTypingAcceleration(events)
        )
    }
    
    /**
     * Extract touch dynamics features
     */
    private fun extractTouchDynamics(): FloatArray {
        val events = touchEvents.toList()
        if (events.isEmpty()) {
            return FloatArray(10) { 0f }
        }
        
        // Calculate touch dynamics features
        val pressures = events.map { it.pressure }
        val sizes = events.map { it.size }
        val durations = events.map { it.duration.toFloat() }
        
        return floatArrayOf(
            pressures.average().toFloat(),
            pressures.standardDeviation(),
            sizes.average().toFloat(),
            sizes.standardDeviation(),
            durations.average().toFloat(),
            durations.standardDeviation(),
            calculateTouchVelocity(events),
            calculateTouchAcceleration(events),
            calculateTouchPattern(events),
            events.size.toFloat()
        )
    }
    
    /**
     * Extract device orientation features
     */
    private fun extractDeviceOrientation(): FloatArray {
        val data = sensorData.filter { it.sensorType == Sensor.TYPE_ACCELEROMETER }
        if (data.isEmpty()) {
            return FloatArray(8) { 0f }
        }
        
        // Calculate orientation features
        val xValues = data.map { it.values[0] }
        val yValues = data.map { it.values[1] }
        val zValues = data.map { it.values[2] }
        
        return floatArrayOf(
            xValues.average().toFloat(),
            xValues.standardDeviation(),
            yValues.average().toFloat(),
            yValues.standardDeviation(),
            zValues.average().toFloat(),
            zValues.standardDeviation(),
            calculateMovementMagnitude(data),
            calculateOrientationStability(data)
        )
    }
    
    /**
     * Extract navigation pattern features
     */
    private fun extractNavigationPattern(): FloatArray {
        val events = navigationEvents.toList()
        if (events.isEmpty()) {
            return FloatArray(6) { 0f }
        }
        
        // Calculate navigation features
        val durations = events.map { it.duration.toFloat() }
        val uniqueScreens = events.map { it.screenName }.distinct().size
        
        return floatArrayOf(
            events.size.toFloat(),
            uniqueScreens.toFloat(),
            durations.average().toFloat(),
            durations.standardDeviation(),
            calculateNavigationEntropy(events),
            calculateNavigationSpeed(events)
        )
    }
    
    /**
     * Handle touch events from the UI
     */
    fun onTouchEvent(event: MotionEvent): Boolean {
        if (!isCollecting || !privacyManager.hasUserConsent()) {
            return false
        }
        
        try {
            val touchEvent = TouchEvent(
                timestamp = System.currentTimeMillis(),
                x = event.x,
                y = event.y,
                pressure = event.pressure,
                size = event.size,
                duration = event.eventTime - event.downTime,
                action = event.action
            )
            
            // Add to collection (with size limit for privacy)
            if (touchEvents.size < MAX_TOUCH_EVENTS) {
                touchEvents.add(touchEvent)
            } else {
                // Remove oldest event to maintain privacy
                touchEvents.removeAt(0)
                touchEvents.add(touchEvent)
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error handling touch event", e)
        }
        
        return false
    }
    
    /**
     * Handle typing events
     */
    fun onTypingEvent(keyCode: Int, dwellTime: Long, flightTime: Long, pressure: Float) {
        if (!isCollecting || !privacyManager.hasUserConsent()) {
            return
        }
        
        try {
            val typingEvent = TypingEvent(
                timestamp = System.currentTimeMillis(),
                keyCode = keyCode,
                dwellTime = dwellTime,
                flightTime = flightTime,
                pressure = pressure
            )
            
            // Add to collection (with size limit)
            if (typingEvents.size < MAX_TYPING_EVENTS) {
                typingEvents.add(typingEvent)
            } else {
                typingEvents.removeAt(0)
                typingEvents.add(typingEvent)
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error handling typing event", e)
        }
    }
    
    /**
     * Handle navigation events
     */
    fun onNavigationEvent(screenName: String, action: String, duration: Long) {
        if (!isCollecting || !privacyManager.hasUserConsent()) {
            return
        }
        
        try {
            val navEvent = NavigationEvent(
                timestamp = System.currentTimeMillis(),
                screenName = screenName,
                action = action,
                duration = duration
            )
            
            navigationEvents.add(navEvent)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error handling navigation event", e)
        }
    }
    
    /**
     * Sensor event callback
     */
    override fun onSensorChanged(event: SensorEvent?) {
        if (!isCollecting || event == null) {
            return
        }
        
        try {
            val sensorData = SensorData(
                timestamp = System.currentTimeMillis(),
                sensorType = event.sensor.type,
                values = event.values.clone(),
                accuracy = event.accuracy
            )
            
            this.sensorData.add(sensorData)
            
            // Limit sensor data size for privacy
            if (this.sensorData.size > 1000) {
                this.sensorData.removeAt(0)
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error handling sensor event", e)
        }
    }
    
    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // Handle accuracy changes if needed
    }
    
    /**
     * Clear all collected data
     */
    private fun clearCollectedData() {
        touchEvents.clear()
        typingEvents.clear()
        sensorData.clear()
        navigationEvents.clear()
    }
    
    /**
     * Clear old data to maintain privacy
     */
    private fun clearOldData() {
        val cutoffTime = System.currentTimeMillis() - (COLLECTION_INTERVAL_MS * 2)
        
        touchEvents.removeAll { it.timestamp < cutoffTime }
        typingEvents.removeAll { it.timestamp < cutoffTime }
        sensorData.removeAll { it.timestamp < cutoffTime }
        navigationEvents.removeAll { it.timestamp < cutoffTime }
    }
    
    /**
     * Cleanup resources
     */
    fun cleanup() {
        collectionScope.cancel()
        stopSensorCollection()
        clearCollectedData()
        Log.i(TAG, "Behavioral biometrics collector cleaned up")
    }
    
    // Helper functions for feature extraction
    private fun List<Float>.standardDeviation(): Float {
        val mean = this.average().toFloat()
        val variance = this.map { (it - mean) * (it - mean) }.average().toFloat()
        return sqrt(variance)
    }
    
    private fun calculateTypingSpeed(events: List<TypingEvent>): Float {
        if (events.size < 2) return 0f
        val totalTime = events.last().timestamp - events.first().timestamp
        return if (totalTime > 0) events.size.toFloat() / (totalTime / 1000f) else 0f
    }
    
    private fun calculateTypingConsistency(events: List<TypingEvent>): Float {
        if (events.isEmpty()) return 0f
        val dwellTimes = events.map { it.dwellTime.toFloat() }
        val mean = dwellTimes.average().toFloat()
        val variance = dwellTimes.map { (it - mean) * (it - mean) }.average().toFloat()
        return if (mean > 0) variance / mean else 0f
    }
    
    private fun calculatePressureVariation(events: List<TypingEvent>): Float {
        if (events.isEmpty()) return 0f
        val pressures = events.map { it.pressure }
        return pressures.standardDeviation()
    }
    
    private fun calculateRhythmEntropy(events: List<TypingEvent>): Float {
        // Simplified entropy calculation for typing rhythm
        if (events.size < 2) return 0f
        val intervals = events.zipWithNext { a, b -> b.timestamp - a.timestamp }
        return calculateEntropy(intervals.map { it.toFloat() })
    }
    
    private fun calculateTypingAcceleration(events: List<TypingEvent>): Float {
        if (events.size < 3) return 0f
        val speeds = events.zipWithNext { a, b -> 
            1000f / (b.timestamp - a.timestamp).toFloat()
        }
        return speeds.zipWithNext { a, b -> b - a }.map { kotlin.math.abs(it) }.average().toFloat()
    }
    
    private fun calculateTouchVelocity(events: List<TouchEvent>): Float {
        if (events.size < 2) return 0f
        val velocities = events.zipWithNext { a, b ->
            val dx = b.x - a.x
            val dy = b.y - a.y
            val dt = (b.timestamp - a.timestamp).toFloat()
            if (dt > 0) sqrt(dx * dx + dy * dy) / dt else 0f
        }
        return velocities.average().toFloat()
    }
    
    private fun calculateTouchAcceleration(events: List<TouchEvent>): Float {
        if (events.size < 3) return 0f
        val velocities = events.zipWithNext { a, b ->
            val dx = b.x - a.x
            val dy = b.y - a.y
            val dt = (b.timestamp - a.timestamp).toFloat()
            if (dt > 0) sqrt(dx * dx + dy * dy) / dt else 0f
        }
        val accelerations = velocities.zipWithNext { a, b -> kotlin.math.abs(b - a) }
        return accelerations.average().toFloat()
    }
    
    private fun calculateTouchPattern(events: List<TouchEvent>): Float {
        // Simplified pattern recognition for touch behavior
        if (events.isEmpty()) return 0f
        val pressures = events.map { it.pressure }
        return pressures.standardDeviation()
    }
    
    private fun calculateMovementMagnitude(data: List<SensorData>): Float {
        if (data.isEmpty()) return 0f
        return data.map { 
            sqrt(it.values[0] * it.values[0] + it.values[1] * it.values[1] + it.values[2] * it.values[2])
        }.average().toFloat()
    }
    
    private fun calculateOrientationStability(data: List<SensorData>): Float {
        if (data.isEmpty()) return 0f
        val magnitudes = data.map { 
            sqrt(it.values[0] * it.values[0] + it.values[1] * it.values[1] + it.values[2] * it.values[2])
        }
        return magnitudes.standardDeviation()
    }
    
    private fun calculateNavigationEntropy(events: List<NavigationEvent>): Float {
        val screens = events.map { it.screenName }
        return calculateEntropy(screens.map { it.hashCode().toFloat() })
    }
    
    private fun calculateNavigationSpeed(events: List<NavigationEvent>): Float {
        if (events.size < 2) return 0f
        val intervals = events.zipWithNext { a, b -> b.timestamp - a.timestamp }
        return intervals.map { 1000f / it.toFloat() }.average().toFloat()
    }
    
    private fun calculateEntropy(values: List<Float>): Float {
        if (values.isEmpty()) return 0f
        
        val histogram = values.groupingBy { (it * 10).toInt() }.eachCount()
        val total = values.size.toFloat()
        
        return histogram.values.map { count ->
            val p = count / total
            if (p > 0) -p * kotlin.math.ln(p) else 0f
        }.sum().toFloat()
    }
}