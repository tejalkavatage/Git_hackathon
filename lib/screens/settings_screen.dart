// screens/settings_screen.dart
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _voiceActivation = true;
  bool _gestureControl = false;
  bool _backgroundMode = true;
  bool _vibrationFeedback = true;
  double _voiceSensitivity = 0.7;
  String _wakeWord = 'Hey Assistant';

  final List<String> _availableWakeWords = [
    'Hey Assistant',
    'Ok Helper',
    'Voice Command',
    'Listen Up',
    'Start Listening'
  ];

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  void _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _voiceActivation = prefs.getBool('voice_activation') ?? true;
      _gestureControl = prefs.getBool('gesture_control') ?? false;
      _backgroundMode = prefs.getBool('background_mode') ?? true;
      _vibrationFeedback = prefs.getBool('vibration_feedback') ?? true;
      _voiceSensitivity = prefs.getDouble('voice_sensitivity') ?? 0.7;
      _wakeWord = prefs.getString('wake_word') ?? 'Hey Assistant';
    });
  }

  void _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('voice_activation', _voiceActivation);
    await prefs.setBool('gesture_control', _gestureControl);
    await prefs.setBool('background_mode', _backgroundMode);
    await prefs.setBool('vibration_feedback', _vibrationFeedback);
    await prefs.setDouble('voice_sensitivity', _voiceSensitivity);
    await prefs.setString('wake_word', _wakeWord);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF667eea), Color(0xFF764ba2)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                    ),
                    const Text(
                      'Settings',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),

              // Settings List
              Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      _buildSectionTitle('Voice Control'),
                      _buildSwitchTile(
                        'Voice Activation',
                        'Enable voice commands',
                        _voiceActivation,
                            (value) {
                          setState(() => _voiceActivation = value);
                          _saveSettings();
                        },
                      ),

                      _buildSwitchTile(
                        'Background Mode',
                        'Listen for commands in background',
                        _backgroundMode,
                            (value) {
                          setState(() => _backgroundMode = value);
                          _saveSettings();
                        },
                      ),

                      _buildSliderTile(
                        'Voice Sensitivity',
                        'Adjust microphone sensitivity',
                        _voiceSensitivity,
                            (value) {
                          setState(() => _voiceSensitivity = value);
                          _saveSettings();
                        },
                      ),

                      _buildDropdownTile(
                        'Wake Word',
                        'Choose activation phrase',
                        _wakeWord,
                        _availableWakeWords,
                            (value) {
                          setState(() => _wakeWord = value!);
                          _saveSettings();
                        },
                      ),

                      const SizedBox(height: 20),
                      _buildSectionTitle('Gesture Control'),
                      _buildSwitchTile(
                        'Hand Gestures',
                        'Control with hand movements',
                        _gestureControl,
                            (value) {
                          setState(() => _gestureControl = value);
                          _saveSettings();
                        },
                      ),

                      const SizedBox(height: 20),
                      _buildSectionTitle('Feedback'),
                      _buildSwitchTile(
                        'Vibration Feedback',
                        'Vibrate on command recognition',
                        _vibrationFeedback,
                            (value) {
                          setState(() => _vibrationFeedback = value);
                          _saveSettings();
                        },
                      ),

                      const SizedBox(height: 30),
                      _buildCommandsHelp(),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15, top: 10),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
    );
  }

  Widget _buildSwitchTile(String title, String subtitle, bool value, Function(bool) onChanged) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: Colors.green,
          ),
        ],
      ),
    );
  }

  Widget _buildSliderTile(String title, String subtitle, double value, Function(double) onChanged) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.white,
            ),
          ),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 10),
          Slider(
            value: value,
            onChanged: onChanged,
            activeColor: Colors.blue,
            inactiveColor: Colors.white30,
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownTile(String title, String subtitle, String value, List<String> options, Function(String?) onChanged) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.white,
            ),
          ),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            value: value,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.1),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
            ),
            dropdownColor: const Color(0xFF764ba2),
            style: const TextStyle(color: Colors.white),
            items: options.map((option) {
              return DropdownMenuItem(
                value: option,
                child: Text(option, style: const TextStyle(color: Colors.white)),
              );
            }).toList(),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildCommandsHelp() {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Available Voice Commands',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 10),
          ..._buildCommandList(),
        ],
      ),
    );
  }

  List<Widget> _buildCommandList() {
    final commands = [
      '"Open YouTube" - Launch YouTube app',
      '"Take photo" - Open camera',
      '"Search for [query]" - Google search',
      '"Call [contact]" - Make phone call',
      '"Message [contact]" - Send text message',
      '"Navigate to [place]" - Open maps',
      '"Play music" - Open music app',
      '"Emergency help" - Call emergency services',
    ];

    return commands.map((command) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('• ', style: TextStyle(color: Colors.white70)),
            Expanded(
              child: Text(
                command,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.white70,
                ),
              ),
            ),
          ],
        ),
      );
    }).toList();
  }
}