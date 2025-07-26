// services/gesture_service.dart - Simplified for voice-only
class GestureDetectionService {
  static bool _isEnabled = false;

  static Future<void> initialize() async {
    // Gesture detection disabled - voice commands only
    _isEnabled = false;
  }

  static void startGestureDetection() {
    // No-op - using voice commands only
  }

  static void stopGestureDetection() {
    // No-op
  }
}