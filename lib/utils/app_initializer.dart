import '../services/permission_manager.dart';

class AppInitializer {
  /// Initialize app with permission checks
  static Future<void> initializeApp() async {
    // Check if permissions are already granted
    bool allGranted = await PermissionManager.areAllPermissionsGranted();

    if (!allGranted) {
      // You can choose to automatically request permissions here
      // or just check and let the user decide later
      print('Some permissions are not granted. User will be prompted.');
    } else {
      print('All permissions are granted.');
    }
  }

  /// Force request all permissions on app startup
  static Future<void> initializeWithPermissionRequest() async {
    await PermissionManager.requestAllPermissions();
  }
}