import 'package:permission_handler/permission_handler.dart';

class PermissionManager {
  // List of permissions from your AndroidManifest
  static const List<Permission> _requiredPermissions = [
    Permission.microphone, // RECORD_AUDIO
    Permission.camera, // CAMERA
    Permission.phone, // CALL_PHONE
    Permission.contacts, // READ_CONTACTS & WRITE_CONTACTS
    Permission.sms, // SEND_SMS
    Permission.location, // ACCESS_FINE_LOCATION
    Permission.locationWhenInUse, // ACCESS_COARSE_LOCATION
  ];

  /// Request all required permissions
  static Future<Map<Permission, PermissionStatus>> requestAllPermissions() async {
    Map<Permission, PermissionStatus> statuses = {};

    for (Permission permission in _requiredPermissions) {
      PermissionStatus status = await permission.request();
      statuses[permission] = status;
    }

    return statuses;
  }

  /// Request specific permission
  static Future<bool> requestPermission(Permission permission) async {
    PermissionStatus status = await permission.status;

    if (status.isGranted) {
      return true;
    }

    if (status.isDenied) {
      status = await permission.request();
      return status.isGranted;
    }

    if (status.isPermanentlyDenied) {
      // Open app settings
      await openAppSettings();
      return false;
    }

    return false;
  }

  /// Check if all permissions are granted
  static Future<bool> areAllPermissionsGranted() async {
    for (Permission permission in _requiredPermissions) {
      PermissionStatus status = await permission.status;
      if (!status.isGranted) {
        return false;
      }
    }
    return true;
  }

  /// Get permission status for all permissions
  static Future<Map<Permission, PermissionStatus>> checkAllPermissions() async {
    Map<Permission, PermissionStatus> statuses = {};

    for (Permission permission in _requiredPermissions) {
      PermissionStatus status = await permission.status;
      statuses[permission] = status;
    }

    return statuses;
  }

  /// Get human-readable permission name
  static String getPermissionName(Permission permission) {
    switch (permission) {
      case Permission.microphone:
        return 'Microphone';
      case Permission.camera:
        return 'Camera';
      case Permission.phone:
        return 'Phone';
      case Permission.contacts:
        return 'Contacts';
      case Permission.sms:
        return 'SMS';
      case Permission.location:
        return 'Location (Fine)';
      case Permission.locationWhenInUse:
        return 'Location (Coarse)';
      default:
        return permission.toString();
    }
  }
}