#!/bin/bash
set -e

ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
WORK_DIR="/tmp/apk_build"
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR/src/org/almuhaddith/app"
mkdir -p "$WORK_DIR/res/values"
mkdir -p "$WORK_DIR/res/drawable"
mkdir -p "$WORK_DIR/assets/www"
mkdir -p "$WORK_DIR/obj"
mkdir -p "$WORK_DIR/bin"

# 1. Copy web assets to assets/www
if [ -d "dist" ]; then
  cp -r dist/* "$WORK_DIR/assets/www/"
fi
if [ -d "public" ]; then
  cp -r public/* "$WORK_DIR/assets/www/"
fi

# 2. Resources: colors, strings, styles
cat << 'XML' > "$WORK_DIR/res/values/colors.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="bg_color">#ff051414</color>
</resources>
XML

cat << 'XML' > "$WORK_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Al-Muhaddith</string>
</resources>
XML

cat << 'XML' > "$WORK_DIR/res/values/styles.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.NoTitleBar.Fullscreen">
        <item name="android:windowBackground">@color/bg_color</item>
    </style>
</resources>
XML

# Launcher icon PNG
python3 -c "
import struct, zlib

def make_png(filename, width=48, height=48, color=(5, 20, 20, 255)):
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    raw_scanlines = b''.join(b'\x00' + bytes(color) * width for _ in range(height))
    idat = chunk(b'IDAT', zlib.compress(raw_scanlines))
    iend = chunk(b'IEND', b'')
    with open(filename, 'wb') as f:
        f.write(header + ihdr + idat + iend)

make_png('$WORK_DIR/res/drawable/ic_launcher.png')
"

# 3. AndroidManifest.xml
cat << 'XML' > "$WORK_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="org.almuhaddith.app"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme"
        android:hardwareAccelerated="true">
        <activity
            android:name="org.almuhaddith.app.MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|layoutDirection|fontScale|screenLayout|uiMode"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
XML

# 4. MainActivity.java
cat << 'JAVA' > "$WORK_DIR/src/org/almuhaddith/app/MainActivity.java"
package org.almuhaddith.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.view.Window;
import android.view.WindowManager;
import android.graphics.Color;

public class MainActivity extends Activity {
    private WebView mWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        
        mWebView = new WebView(this);
        mWebView.setBackgroundColor(Color.parseColor("#051414"));
        
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        
        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("file://") || url.startsWith("http://") || url.startsWith("https://")) {
                    view.loadUrl(url);
                    return true;
                }
                return false;
            }
        });
        
        mWebView.setWebChromeClient(new WebChromeClient());
        setContentView(mWebView);
        
        mWebView.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
JAVA

# 5. Compile binary XML & resources
aapt package -f -m \
    -J "$WORK_DIR/src" \
    -M "$WORK_DIR/AndroidManifest.xml" \
    -S "$WORK_DIR/res" \
    -I "$ANDROID_JAR"

# 6. Compile Java sources
javac -source 1.8 -target 1.8 \
    -bootclasspath "$ANDROID_JAR" \
    -cp "$ANDROID_JAR" \
    -d "$WORK_DIR/obj" \
    $(find "$WORK_DIR/src" -name "*.java")

# 7. Convert bytecode to Dalvik DEX
dalvik-exchange --dex --output="$WORK_DIR/bin/classes.dex" "$WORK_DIR/obj"

# 8. Create base APK package
aapt package -f \
    -M "$WORK_DIR/AndroidManifest.xml" \
    -S "$WORK_DIR/res" \
    -A "$WORK_DIR/assets" \
    -I "$ANDROID_JAR" \
    -F "$WORK_DIR/bin/unaligned-unsigned.apk"

# Add classes.dex to APK
cd "$WORK_DIR/bin"
aapt add unaligned-unsigned.apk classes.dex

# 9. Zipalign aligned package
zipalign -f -v -p 4 unaligned-unsigned.apk aligned-unsigned.apk

# 10. Generate Keystore and Sign APK with apksigner (v1, v2, v3 signature)
if [ ! -f "/tmp/release.jks" ]; then
    keytool -genkey -v -keystore /tmp/release.jks \
        -alias almuhaddith -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass android -keypass android \
        -dname "CN=AlMuhaddith, OU=App, O=AlMuhaddith, L=City, S=State, C=US"
fi

apksigner sign --ks /tmp/release.jks \
    --ks-key-alias almuhaddith \
    --ks-pass pass:android \
    --key-pass pass:android \
    --out "/al-muhaddith.apk" \
    aligned-unsigned.apk

cp "/al-muhaddith.apk" "/app-release.apk"

apksigner verify --verbose "/al-muhaddith.apk"
echo "Successfully built verified binary signed APKs!"
