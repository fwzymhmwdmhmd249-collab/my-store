package com.example.mf_foods

import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity()
WebSettings webSettings = webView.getSettings();
webSettings.setJavaScriptEnabled(true);
webSettings.setDomStorageEnabled(true);
webSettings.setDatabaseEnabled(true);