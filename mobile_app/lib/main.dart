import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const TejasKPAIApp());
}

class TejasKPAIApp extends StatelessWidget {
  const TejasKPAIApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TejasKP AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFFFFD700),
        scaffoldBackgroundColor: const Color(0xFF050505), // Match website background
      ),
      home: const MainWebView(),
    );
  }
}

class MainWebView extends StatefulWidget {
  const MainWebView({super.key});

  @override
  State<MainWebView> createState() => _MainWebViewState();
}

class _MainWebViewState extends State<MainWebView> {
  late final WebViewController _controller;
  bool _isLoading = true;
  double _progress = 0;
  String? _errorMessage;

  // 🔹 CONFIGURATION: Vercel is cleaner/faster for mobile than localhost
  static const String _appUrl = 'https://tejaskp-ai-software-qjnli60ux-tejas-projects-62ee4952.vercel.app/login';

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF050505))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (mounted) {
              setState(() => _progress = progress / 100);
            }
          },
          onPageStarted: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = true;
                _errorMessage = null; // Clear previous errors
              });
            }
          },
          onPageFinished: (String url) {
            if (mounted) {
              setState(() => _isLoading = false);
            }
          },
          onWebResourceError: (WebResourceError error) {
            print("WebView Error: ${error.description} (${error.errorCode})");
            // Only show error screen for critical failures, not minor resource 404s
            if (error.errorCode == -1009 || error.errorCode == -1004 || error.errorCode == -1001) {
               if (mounted) {
                 setState(() {
                   _errorMessage = "Connection Failed: ${error.description}";
                   _isLoading = false;
                 });
               }
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            if (request.url.contains('whatsapp.com') || request.url.contains('tel:')) {
              launchUrl(Uri.parse(request.url), mode: LaunchMode.externalApplication);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(_appUrl));
  }

  void _reload() {
    _controller.reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050505),
      body: SafeArea(
        child: Stack(
          children: [
            // 1. The WebView Content
            if (_errorMessage == null)
              WebViewWidget(controller: _controller),

            // 2. Loading Indicator (Top Bar)
            if (_isLoading && _errorMessage == null)
              Positioned(
                top: 0, 0: 0, right: 0,
                child: LinearProgressIndicator(
                  value: _progress,
                  backgroundColor: Colors.transparent,
                  color: const Color(0xFFFFD700),
                  minHeight: 4,
                ),
              ),

             // 3. Splash / Overlay while loading (Prevents white flash)
            if (_isLoading && _progress < 0.2)
              Container(
                color: const Color(0xFF050505),
                child: const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                       CircularProgressIndicator(color: Color(0xFFFFD700)),
                       SizedBox(height: 20),
                       Text("LOADING PORTAL...", style: TextStyle(color: Color(0xFFFFD700), letterSpacing: 2)),
                    ],
                  ),
                ),
              ),

            // 4. Error State (Visible if connection fails)
            if (_errorMessage != null)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(30.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.wifi_off, size: 50, color: Colors.red),
                      const SizedBox(height: 20),
                      const Text(
                        "Unable to Connect",
                        style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        _errorMessage!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 30),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.refresh, color: Colors.black),
                        label: const Text("RETRY CONNECTION", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFFD700),
                          padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                        ),
                        onPressed: _reload,
                      )
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
      // Floating Back Button (Hidden on Login Page typically, but good for navigation)
      floatingActionButton: FutureBuilder<bool>(
        future: _controller.canGoBack(),
        builder: (context, snapshot) {
          if (snapshot.data == true) {
            return FloatingActionButton(
              mini: true,
              backgroundColor: const Color(0xFFFFD700).withOpacity(0.8),
              onPressed: () => _controller.goBack(),
              child: const Icon(Icons.arrow_back, color: Colors.black),
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }
}
