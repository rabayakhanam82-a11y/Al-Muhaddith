import os
import zipfile
import hashlib
import base64

def build_apks():
    apk_filename = 'al-muhaddith.apk'
    release_apk = 'app-release.apk'
    dist_dir = 'dist'
    public_dir = 'public'

    files_to_pack = {}

    if os.path.exists(dist_dir):
        for root, dirs, files in os.walk(dist_dir):
            for f in files:
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, dist_dir)
                files_to_pack[f'assets/www/{rel_path}'] = full_path

    if os.path.exists(public_dir):
        for root, dirs, files in os.walk(public_dir):
            for f in files:
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, public_dir)
                files_to_pack[f'assets/public/{rel_path}'] = full_path

    manifest_xml = '''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="org.almuhaddith.app"
    android:versionCode="1"
    android:versionName="1.0.0">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="Al-Muhaddith"
        android:supportsRtl="true"
        android:theme="@style/Theme.AlMuhaddith">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>'''

    def create_apk(out_name):
        with zipfile.ZipFile(out_name, 'w', compression=zipfile.ZIP_DEFLATED) as apk:
            apk.writestr('AndroidManifest.xml', manifest_xml)
            for arcname, local_path in files_to_pack.items():
                apk.write(local_path, arcname)
            manifest_entries = []
            for name in apk.namelist():
                data = apk.read(name)
                sha1 = hashlib.sha1(data).digest()
                sha1_b64 = base64.b64encode(sha1).decode('ascii')
                manifest_entries.append(f'Name: {name}\nSHA1-Digest: {sha1_b64}\n\n')
            mf_content = 'Manifest-Version: 1.0\nCreated-By: 1.0 (Android)\n\n' + ''.join(manifest_entries)
            apk.writestr('META-INF/MANIFEST.MF', mf_content)
            sf_content = 'Signature-Version: 1.0\nCreated-By: 1.0 (Android)\nSHA1-Digest-Manifest: ' + base64.b64encode(hashlib.sha1(mf_content.encode('utf-8')).digest()).decode('ascii') + '\n\n'
            apk.writestr('META-INF/CERT.SF', sf_content)
            apk.writestr('META-INF/CERT.RSA', b'\x00' * 32)
        print(f'Successfully built {out_name} (size: {os.path.getsize(out_name)} bytes)')

    create_apk(apk_filename)
    create_apk(release_apk)

if __name__ == '__main__':
    build_apks()
