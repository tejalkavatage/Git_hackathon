// services/command_processor.dart
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_phone_direct_caller/flutter_phone_direct_caller.dart';
import 'package:flutter_contacts/flutter_contacts.dart';
import 'package:permission_handler/permission_handler.dart';

class CommandProcessor {
  static final Map<String, List<String>> _commandPatterns = {
    'youtube': ['open youtube', 'youtube', 'play youtube'],
    'camera': ['take photo', 'camera', 'take picture', 'photo'],
    'search': ['search', 'google', 'look up'],
    'call': ['call', 'phone', 'dial'],
    'message': ['message', 'text', 'send message'],
    'maps': ['navigate', 'maps', 'directions', 'go to'],
    'music': ['play music', 'spotify', 'music'],
    'email': ['email', 'send email', 'mail'],
  };

  static Future<void> processCommand(String command) async {
    final lowerCommand = command.toLowerCase();

    for (final category in _commandPatterns.keys) {
      for (final pattern in _commandPatterns[category]!) {
        if (lowerCommand.contains(pattern)) {
          await _executeCommand(category, command);
          return;
        }
      }
    }
  }

  static Future<void> _executeCommand(String category, String fullCommand) async {
    switch (category) {
      case 'youtube':
        await _openYouTube();
        break;
      case 'camera':
        await _openCamera();
        break;
      case 'search':
        await _performSearch(fullCommand);
        break;
      case 'call':
        await _makeCall(fullCommand);
        break;
      case 'message':
        await _sendMessage(fullCommand);
        break;
      case 'maps':
        await _openMaps(fullCommand);
        break;
      case 'music':
        await _playMusic();
        break;
      case 'email':
        await _openEmail();
        break;
    }
  }

  static Future<void> _openYouTube() async {
    final Uri url = Uri.parse('https://www.youtube.com');
    await launchUrl(url, mode: LaunchMode.externalApplication);
  }

  static Future<void> _openCamera() async {
    // Open the device's camera app using intent
    final Uri cameraUri = Uri.parse('intent://media.action.IMAGE_CAPTURE#Intent;scheme=android;action=android.media.action.IMAGE_CAPTURE;end');

    if (await canLaunchUrl(cameraUri)) {
      await launchUrl(cameraUri);
    } else {
      // Fallback: try to open camera app directly
      final Uri cameraApp = Uri.parse('package:com.android.camera');
      await launchUrl(cameraApp);
    }
  }

  static Future<void> _performSearch(String command) async {
    String query = command
        .replaceAll(RegExp(r'search|google|look up'), '')
        .trim();

    if (query.isEmpty) query = 'flutter development';

    final Uri url = Uri.parse('https://www.google.com/search?q=${Uri.encodeComponent(query)}');
    await launchUrl(url, mode: LaunchMode.externalApplication);
  }

  static Future<void> _makeCall(String command) async {
    // Extract contact name or number from command
    String contact = command
        .replaceAll(RegExp(r'call|phone|dial'), '')
        .trim();

    if (contact.isNotEmpty) {
      // Try to find contact using flutter_contacts
      if (await Permission.contacts.request().isGranted) {
        try {
          List<Contact> contacts = await FlutterContacts.getContacts(
            withProperties: true,
            withPhoto: false,
          );

          Contact? foundContact;
          for (Contact c in contacts) {
            if (c.displayName.toLowerCase().contains(contact.toLowerCase())) {
              foundContact = c;
              break;
            }
          }

          if (foundContact != null && foundContact.phones.isNotEmpty) {
            String phoneNumber = foundContact.phones.first.number;
            await FlutterPhoneDirectCaller.callNumber(phoneNumber);
          } else {
            // If no contact found, try to call the input as a phone number
            if (RegExp(r'^[\d\s\-\+\(\)]+$').hasMatch(contact)) {
              await FlutterPhoneDirectCaller.callNumber(contact);
            }
          }
        } catch (e) {
          print('Error accessing contacts: $e');
        }
      }
    }
  }

  static Future<void> _sendMessage(String command) async {
    // Extract recipient and message from command
    String messageContent = command
        .replaceAll(RegExp(r'message|text|send message'), '')
        .trim();

    final Uri smsUri = Uri.parse('sms:?body=${Uri.encodeComponent(messageContent)}');
    await launchUrl(smsUri);
  }

  static Future<void> _openMaps(String command) async {
    String destination = command
        .replaceAll(RegExp(r'navigate|maps|directions|go to'), '')
        .trim();

    if (destination.isEmpty) destination = 'nearby restaurants';

    final Uri mapsUrl = Uri.parse('https://maps.google.com/search/${Uri.encodeComponent(destination)}');
    await launchUrl(mapsUrl, mode: LaunchMode.externalApplication);
  }

  static Future<void> _playMusic() async {
    final Uri spotifyUrl = Uri.parse('spotify:');
    if (await canLaunchUrl(spotifyUrl)) {
      await launchUrl(spotifyUrl);
    } else {
      final Uri webSpotify = Uri.parse('https://open.spotify.com');
      await launchUrl(webSpotify, mode: LaunchMode.externalApplication);
    }
  }

  static Future<void> _openEmail() async {
    final Uri emailUrl = Uri.parse('mailto:');
    await launchUrl(emailUrl);
  }
}