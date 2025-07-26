// main.dart
import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'dart:async';
import 'screens/permission_screen.dart';
import 'utils/app_initializer.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize app (optional: check permissions on startup)
  await AppInitializer.initializeApp();


  runApp(const AccessabledApp());
}

class AccessabledApp extends StatelessWidget {
  const AccessabledApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AccessAbled',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
        fontFamily: 'Roboto',
      ),
      // Set up routes
      initialRoute: '/permissions',
      routes: {
        '/permissions': (context) => const PermissionScreen(),
        '/main': (context) => const AccessabledAppPage(),
      },
    );
  }
}

class AccessabledAppPage extends StatefulWidget {
  const AccessabledAppPage({Key? key}) : super(key: key);

  @override
  State<AccessabledAppPage> createState() => _HandsFreeHomePageState();
}

class _HandsFreeHomePageState extends State<AccessabledAppPage>
    with TickerProviderStateMixin {
  final SpeechToText _speechToText = SpeechToText();
  final FlutterTts _flutterTts = FlutterTts();
  bool _speechEnabled = false;
  bool _isListening = false;
  String _lastWords = '';
  late AnimationController _pulseController;
  late AnimationController _backgroundController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _backgroundAnimation;

  final List<String> _commandHistory = [];
  bool _isActive = false;
  Timer? _listeningTimer;
  String _statusMessage = 'Ready to listen';

  @override
  void initState() {
    super.initState();
    _initSpeech();
    _initTts();
    _setupAnimations();
    _requestPermissions();
  }

  void _setupAnimations() {
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _backgroundController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    );

    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.15,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));

    _backgroundAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _backgroundController,
      curve: Curves.easeInOut,
    ));

    _pulseController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _pulseController.reverse();
      } else if (status == AnimationStatus.dismissed) {
        _pulseController.forward();
      }
    });

    _backgroundController.repeat(reverse: true);
  }

  void _initSpeech() async {
    _speechEnabled = await _speechToText.initialize(
      onStatus: (status) {
        setState(() {
          _statusMessage = 'Status: $status';
        });
      },
      onError: (error) {
        setState(() {
          _statusMessage = 'Error: ${error.errorMsg}';
          _isListening = false;
        });
        _pulseController.stop();
        _pulseController.reset();
      },
    );
    setState(() {});
  }

  void _initTts() async {
    await _flutterTts.setLanguage("en-US");
    await _flutterTts.setSpeechRate(0.5);
    await _flutterTts.setVolume(0.8);
    await _flutterTts.setPitch(1.0);
  }

  void _requestPermissions() async {
    await Permission.microphone.request();
    await Permission.contacts.request();
    await Permission.phone.request();
    await Permission.camera.request();
  }

  void _speak(String text) async {
    await _flutterTts.speak(text);
  }

  void _startListening() async {
    if (!_speechEnabled) {
      _showFeedback('Speech recognition not available');
      return;
    }

    await _speechToText.listen(
      onResult: _onSpeechResult,
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 3),
      partialResults: true,
      localeId: 'en_US',
      listenMode: ListenMode.confirmation,
    );

    setState(() {
      _isListening = true;
      _statusMessage = 'Listening...';
    });
    _pulseController.forward();

    // Auto-stop listening after 30 seconds
    _listeningTimer = Timer(const Duration(seconds: 30), () {
      if (_isListening) {
        _stopListening();
      }
    });
  }

  void _stopListening() async {
    _listeningTimer?.cancel();
    await _speechToText.stop();
    setState(() {
      _isListening = false;
      _statusMessage = 'Processing...';
    });
    _pulseController.stop();
    _pulseController.reset();
  }

  void _onSpeechResult(result) {
    setState(() {
      _lastWords = result.recognizedWords;
    });

    if (result.finalResult) {
      _processVoiceCommand(_lastWords.toLowerCase());
    }
  }

  void _processVoiceCommand(String command) {
    setState(() {
      _commandHistory.insert(0, command);
      if (_commandHistory.length > 10) {
        _commandHistory.removeLast();
      }
      _statusMessage = 'Command: $command';
    });

    // Enhanced command processing with better matching
    if (_containsAny(command, ['open youtube', 'youtube', 'play youtube'])) {
      _openYouTube();
    } else if (_containsAny(command, ['take photo', 'camera', 'open camera', 'take picture'])) {
      _openCamera();
    } else if (_containsAny(command, ['search', 'google', 'look up'])) {
      String searchQuery = _extractSearchQuery(command);
      if (searchQuery.isNotEmpty) {
        _searchGoogle(searchQuery);
      } else {
        _speak('What would you like me to search for?');
      }
    } else if (_containsAny(command, ['call', 'phone', 'dial'])) {
      String contact = _extractContact(command);
      _makeCall(contact);
    } else if (_containsAny(command, ['open maps', 'maps', 'navigation', 'navigate'])) {
      _openMaps();
    } else if (_containsAny(command, ['message', 'text', 'sms', 'send message'])) {
      _openMessages();
    } else if (_containsAny(command, ['emergency', 'help', 'urgent'])) {
      _handleEmergency();
    } else if (_containsAny(command, ['weather', 'forecast'])) {
      _checkWeather();
    } else if (_containsAny(command, ['time', 'what time'])) {
      _tellTime();
    } else {
      _speak('Command not recognized. Please try again.');
      _showFeedback('Command not recognized: $command');
    }
  }

  bool _containsAny(String text, List<String> keywords) {
    return keywords.any((keyword) => text.contains(keyword));
  }

  String _extractSearchQuery(String command) {
    String query = command;
    for (String trigger in ['search for', 'search', 'google', 'look up']) {
      query = query.replaceAll(trigger, '').trim();
    }
    return query;
  }

  String _extractContact(String command) {
    String contact = command;
    for (String trigger in ['call', 'phone', 'dial']) {
      contact = contact.replaceAll(trigger, '').trim();
    }
    return contact;
  }

  void _openYouTube() async {
    final Uri url = Uri.parse('https://www.youtube.com');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
      _speak('Opening YouTube');
      _showFeedback('Opening YouTube...');
    } else {
      _speak('Unable to open YouTube');
      _showFeedback('Unable to open YouTube');
    }
  }

  void _openCamera() async {
    try {
      final Uri url = Uri.parse('android-app://com.android.camera');
      if (await canLaunchUrl(url)) {
        await launchUrl(url);
      } else {
        // Fallback to generic camera intent
        final Uri fallbackUrl = Uri.parse('content://media/external/images/media');
        await launchUrl(fallbackUrl);
      }
      _speak('Opening Camera');
      _showFeedback('Opening Camera...');
    } catch (e) {
      _speak('Unable to open camera');
      _showFeedback('Unable to open camera');
    }
  }

  void _searchGoogle(String query) async {
    final Uri url = Uri.parse('https://www.google.com/search?q=${Uri.encodeComponent(query)}');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
      _speak('Searching for $query');
      _showFeedback('Searching for: $query');
    } else {
      _speak('Unable to search');
      _showFeedback('Unable to perform search');
    }
  }

  void _makeCall(String contact) async {
    if (contact.isEmpty) {
      _speak('Who would you like to call?');
      return;
    }

    try {
      final Uri url = Uri.parse('tel:$contact');
      if (await canLaunchUrl(url)) {
        await launchUrl(url);
        _speak('Calling $contact');
        _showFeedback('Calling: $contact');
      } else {
        _speak('Unable to make call');
        _showFeedback('Unable to make call');
      }
    } catch (e) {
      _speak('Unable to make call');
      _showFeedback('Error making call: $e');
    }
  }

  void _openMaps() async {
    final Uri url = Uri.parse('https://maps.google.com');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
      _speak('Opening Maps');
      _showFeedback('Opening Maps...');
    } else {
      _speak('Unable to open maps');
      _showFeedback('Unable to open Maps');
    }
  }

  void _openMessages() async {
    try {
      final Uri url = Uri.parse('sms:');
      if (await canLaunchUrl(url)) {
        await launchUrl(url);
        _speak('Opening Messages');
        _showFeedback('Opening Messages...');
      } else {
        _speak('Unable to open messages');
        _showFeedback('Unable to open Messages');
      }
    } catch (e) {
      _speak('Unable to open messages');
      _showFeedback('Error opening messages');
    }
  }

  void _handleEmergency() async {
    _speak('Emergency detected. Would you like me to call emergency services?');
    _showFeedback('Emergency mode activated');
    // You can add emergency contact functionality here
  }

  void _checkWeather() async {
    final Uri url = Uri.parse('https://weather.com');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
      _speak('Opening weather information');
      _showFeedback('Opening Weather...');
    }
  }

  void _tellTime() {
    final now = DateTime.now();
    final timeString = '${now.hour}:${now.minute.toString().padLeft(2, '0')}';
    _speak('The current time is $timeString');
    _showFeedback('Current time: $timeString');
  }

  void _showFeedback(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFF667eea),
              const Color(0xFF764ba2),
              Colors.deepPurple.shade800,
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with enhanced styling
                Center(
                  child: Column(
                    children: [
                      AnimatedBuilder(
                        animation: _backgroundAnimation,
                        builder: (context, child) {
                          return Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.1 + _backgroundAnimation.value * 0.1),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.white.withOpacity(0.3)),
                            ),
                            child: Column(
                              children: [
                                const Text(
                                  'Hands-Free Controller',
                                  style: TextStyle(
                                    fontSize: 28,
                                    fontWeight: FontWeight.w300,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _isActive ? 'Voice Control Active' : 'Voice Control Inactive',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: _isActive ? Colors.greenAccent : Colors.white70,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 30),

                // Enhanced Status Card
                Container(
                  padding: const EdgeInsets.all(25),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Status',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 8),
                            decoration: BoxDecoration(
                              color: _isListening
                                  ? Colors.orange
                                  : _isActive
                                  ? Colors.green
                                  : Colors.red,
                              borderRadius: BorderRadius.circular(25),
                              boxShadow: [
                                BoxShadow(
                                  color: (_isListening ? Colors.orange : _isActive ? Colors.green : Colors.red).withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Text(
                              _isListening
                                  ? 'LISTENING'
                                  : _isActive
                                  ? 'ACTIVE'
                                  : 'INACTIVE',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Text(
                        _isListening
                            ? (_lastWords.isEmpty ? 'Listening for commands...' : _lastWords)
                            : _statusMessage,
                        style: const TextStyle(
                          fontSize: 16,
                          color: Colors.white70,
                          height: 1.4,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 30),

                // Enhanced Voice Control Button
                Center(
                  child: GestureDetector(
                    onTap: _speechToText.isNotListening ? _startListening : _stopListening,
                    child: AnimatedBuilder(
                      animation: _pulseAnimation,
                      builder: (context, child) {
                        return Transform.scale(
                          scale: _isListening ? _pulseAnimation.value : 1.0,
                          child: Container(
                            width: 140,
                            height: 140,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: _isListening
                                    ? [Colors.red.shade400, Colors.red.shade600]
                                    : [Colors.blue.shade400, Colors.blue.shade600],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: (_isListening ? Colors.red : Colors.blue).withOpacity(0.4),
                                  blurRadius: 25,
                                  offset: const Offset(0, 12),
                                ),
                              ],
                            ),
                            child: Icon(
                              _isListening ? Icons.mic : Icons.mic_none,
                              size: 60,
                              color: Colors.white,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 30),

                // Enhanced Quick Actions
                const Text(
                  'Quick Actions',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 15),
                Expanded(
                  child: GridView.count(
                    crossAxisCount: 2,
                    crossAxisSpacing: 15,
                    mainAxisSpacing: 15,
                    childAspectRatio: 1.1,
                    children: [
                      _buildQuickAction(
                        'YouTube',
                        Icons.play_circle_filled,
                        Colors.red,
                            () => _openYouTube(),
                      ),
                      _buildQuickAction(
                        'Camera',
                        Icons.camera_alt,
                        Colors.green,
                            () => _openCamera(),
                      ),
                      _buildQuickAction(
                        'Search',
                        Icons.search,
                        Colors.orange,
                            () => _searchGoogle(''),
                      ),
                      _buildQuickAction(
                        'Maps',
                        Icons.map,
                        Colors.blue,
                            () => _openMaps(),
                      ),
                      _buildQuickAction(
                        'Phone',
                        Icons.phone,
                        Colors.purple,
                            () => _makeCall(''),
                      ),
                      _buildQuickAction(
                        'Messages',
                        Icons.message,
                        Colors.teal,
                            () => _openMessages(),
                      ),
                    ],
                  ),
                ),

                // Enhanced Command History
                if (_commandHistory.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  const Text(
                    'Recent Commands',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 100,
                    child: ListView.builder(
                      itemCount: _commandHistory.length > 5 ? 5 : _commandHistory.length,
                      itemBuilder: (context, index) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(25),
                            border: Border.all(color: Colors.white.withOpacity(0.2)),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.history,
                                color: Colors.white60,
                                size: 16,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  _commandHistory[index],
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 14,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          setState(() {
            _isActive = !_isActive;
          });
          String message = _isActive
              ? 'Voice control activated'
              : 'Voice control deactivated';
          _speak(message);
          _showFeedback(message);
        },
        backgroundColor: _isActive ? Colors.red.shade600 : Colors.green.shade600,
        icon: Icon(_isActive ? Icons.stop : Icons.play_arrow),
        label: Text(_isActive ? 'Deactivate' : 'Activate'),
      ),
    );
  }

  Widget _buildQuickAction(String title, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.3)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                shape: BoxShape.circle,
                border: Border.all(color: color.withOpacity(0.3)),
              ),
              child: Icon(
                icon,
                size: 32,
                color: color,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _backgroundController.dispose();
    _listeningTimer?.cancel();
    _flutterTts.stop();
    super.dispose();
  }
}