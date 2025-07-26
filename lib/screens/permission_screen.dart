import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/permission_manager.dart';

class PermissionScreen extends StatefulWidget {
  const PermissionScreen({Key? key}) : super(key: key);

  @override
  State<PermissionScreen> createState() => _PermissionScreenState();
}

class _PermissionScreenState extends State<PermissionScreen> {
  Map<Permission, PermissionStatus> _permissionStatuses = {};
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _checkPermissions();
  }

  Future<void> _checkPermissions() async {
    setState(() => _isLoading = true);

    Map<Permission, PermissionStatus> statuses = await PermissionManager.checkAllPermissions();

    setState(() {
      _permissionStatuses = statuses;
      _isLoading = false;
    });
  }

  Future<void> _requestAllPermissions() async {
    setState(() => _isLoading = true);

    Map<Permission, PermissionStatus> statuses = await PermissionManager.requestAllPermissions();

    setState(() {
      _permissionStatuses = statuses;
      _isLoading = false;
    });

    // Check if all permissions are granted
    bool allGranted = statuses.values.every((status) => status.isGranted);

    if (allGranted) {
      // All permissions granted - go directly to main screen
      _proceedToMainApp();
    } else {
      // Some permissions denied - show result dialog
      _showPermissionResult();
    }
  }

  Future<void> _requestSinglePermission(Permission permission) async {
    bool granted = await PermissionManager.requestPermission(permission);

    setState(() {
      _permissionStatuses[permission] = granted ? PermissionStatus.granted : PermissionStatus.denied;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${PermissionManager.getPermissionName(permission)}: ${granted ? 'Granted' : 'Denied'}'),
          backgroundColor: granted ? Colors.green : Colors.red,
        ),
      );
    }

    // Check if all permissions are now granted
    bool allGranted = _permissionStatuses.values.every((status) => status.isGranted);
    if (allGranted) {
      // Show success message and navigate after short delay
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('All permissions granted! Redirecting...'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 1),
          ),
        );
      }

      // Navigate to main screen after short delay
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) {
          _proceedToMainApp();
        }
      });
    }
  }

  void _showPermissionResult() {
    int granted = _permissionStatuses.values.where((status) => status.isGranted).length;
    int total = _permissionStatuses.length;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(granted == total ? 'All Permissions Granted!' : 'Permission Results'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('$granted out of $total permissions granted'),
            if (granted < total) ...[
              const SizedBox(height: 10),
              const Text(
                'Some features may not work without all permissions.',
                style: TextStyle(color: Colors.orange, fontSize: 12),
              ),
            ],
          ],
        ),
        actions: [
          if (granted < total)
            TextButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog, stay on permission screen
              },
              child: const Text('Grant More'),
            ),
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              _proceedToMainApp();
            },
            child: const Text('Continue'),
          ),
        ],
      ),
    );
  }

  void _proceedToMainApp() {
    // Navigate to AccessabledAppPage and remove permission screen from stack
    Navigator.pushReplacementNamed(context, '/main');
  }

  bool get _allPermissionsGranted {
    return _permissionStatuses.isNotEmpty &&
        _permissionStatuses.values.every((status) => status.isGranted);
  }

  Color _getStatusColor(PermissionStatus status) {
    switch (status) {
      case PermissionStatus.granted:
        return Colors.green;
      case PermissionStatus.denied:
        return Colors.orange;
      case PermissionStatus.permanentlyDenied:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(PermissionStatus status) {
    switch (status) {
      case PermissionStatus.granted:
        return 'Granted';
      case PermissionStatus.denied:
        return 'Denied';
      case PermissionStatus.permanentlyDenied:
        return 'Permanently Denied';
      case PermissionStatus.restricted:
        return 'Restricted';
      default:
        return 'Unknown';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('App Permissions'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    const Icon(Icons.security, size: 48, color: Colors.blue),
                    const SizedBox(height: 16),
                    const Text(
                      'Permission Manager',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Grant permissions to enable all app features',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            // Show different buttons based on permission status
            if (_allPermissionsGranted)
              ElevatedButton.icon(
                onPressed: _proceedToMainApp,
                icon: const Icon(Icons.check_circle),
                label: const Text('Continue to App'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              )
            else
            // Add Continue button (even if not all permissions granted)
              ElevatedButton.icon(
                onPressed: _proceedToMainApp,
                icon: const Icon(Icons.arrow_forward),
                label: const Text('Continue Anyway'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _requestAllPermissions,
                    icon: const Icon(Icons.check_circle),
                    label: const Text('Request All'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _checkPermissions,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Refresh'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[600],
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Text(
              'Permission Status:',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: _permissionStatuses.isEmpty
                  ? const Center(
                child: Text(
                  'No permissions to display',
                  style: TextStyle(color: Colors.grey),
                ),
              )
                  : ListView.builder(
                itemCount: _permissionStatuses.length,
                itemBuilder: (context, index) {
                  Permission permission = _permissionStatuses.keys.elementAt(index);
                  PermissionStatus status = _permissionStatuses[permission]!;

                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: _getStatusColor(status),
                        child: Icon(
                          status.isGranted ? Icons.check : Icons.close,
                          color: Colors.white,
                        ),
                      ),
                      title: Text(PermissionManager.getPermissionName(permission)),
                      subtitle: Text(_getStatusText(status)),
                      trailing: status.isGranted
                          ? null
                          : IconButton(
                        icon: const Icon(Icons.settings),
                        onPressed: () => _requestSinglePermission(permission),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}