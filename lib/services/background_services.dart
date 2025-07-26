import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_background_service_android/flutter_background_service_android.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:url_launcher/url_launcher.dart';

class BackgroundVoiceService {
  static Future<void> initializeService() async {
    final service = FlutterBackgroundService();

    await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        autoStart: true,
        isForegroundMode: true,
        notificationChannelId: 'hands_free_controller',
        initialNotificationTitle: 'Hands-Free Controller',
        initialNotificationContent: 'Listening for voice commands...',
        foregroundServiceNotificationId: 888,
      ),
      iosConfiguration: IosConfiguration(
        autoStart: true,
        onForeground: onStart,
        onBackground: onIosBackground,
      ),
    );
  }

  @pragma('vm:entry-point')
  static void onStart(ServiceInstance service) async {
    if (service is AndroidServiceInstance) {
      service.on('setAsForeground').listen((event) {
        service.setAsForegroundService();
      });

      service.on('setAsBackground').listen((event) {
        service.setAsBackgroundService();
      });
    }

    service.on('stopService').listen((event) {
      service.stopSelf();
    });

    // Voice recognition setup
    final speechToText = SpeechToText();
    bool speechEnabled = await speechToText.initialize();

    if (speechEnabled) {
      Timer.periodic(const Duration(seconds: 5), (timer) async {
        if (service is AndroidServiceInstance) {
          if (await service.isForegroundService()) {
            // Listen for voice commands in background
            await speechToText.listen(
              onResult: (result) {
                _processBackgroundCommand(result.recognizedWords);
              },
              listenFor: Duration(seconds: 3),
            );
          }
        }
      });
    }
  }

  @pragma('vm:entry-point')
  static bool onIosBackground(ServiceInstance service) {
    return true;
  }

  static void _processBackgroundCommand(String command) {
    final lowerCommand = command.toLowerCase();

    if (lowerCommand.contains('emergency') || lowerCommand.contains('help')) {
      _handleEmergencyCommand();
    } else if (lowerCommand.contains('call')) {
      _handleCallCommand(command);
    } else if (lowerCommand.contains('message') || lowerCommand.contains('text')) {
      _handleMessageCommand(command);
    } else if (lowerCommand.contains('navigate') || lowerCommand.contains('go to')) {
      _handleNavigationCommand(command);
    }
  }

  static void _handleEmergencyCommand() async {
    // In a real app, this would trigger emergency protocols
    final Uri emergencyUrl = Uri.parse('tel:911');
    if (await canLaunchUrl(emergencyUrl)) {
      await launchUrl(emergencyUrl);
    }
  }

  static void _handleCallCommand(String command) async {
    // Extract contact name/number from command
    // In a real implementation, you'd parse the contact name
    // and lookup the phone number from contacts
    debugPrint('Processing call command: $command');
  }

  static void _handleMessageCommand(String command) async {
    // Extract message details from command
    debugPrint('Processing message command: $command');
  }

  static void _handleNavigationCommand(String command) async {
    // Extract destination from command
    debugPrint('Processing navigation command: $command');
  }
}