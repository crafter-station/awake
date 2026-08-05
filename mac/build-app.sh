#!/bin/bash
# Builds mac/dist/Awake.app - a menu bar app bundle around the AwakeBar binary.
set -euo pipefail
cd "$(dirname "$0")"

swift build -c release

APP=dist/Awake.app
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS"

cp .build/release/AwakeBar "$APP/Contents/MacOS/AwakeBar"

cat > "$APP/Contents/Info.plist" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>AwakeBar</string>
  <key>CFBundleIdentifier</key>
  <string>com.crafterstation.awake.menubar</string>
  <key>CFBundleName</key>
  <string>Awake</string>
  <key>CFBundleDisplayName</key>
  <string>Awake</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
  <key>LSUIElement</key>
  <true/>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
EOF

codesign --force -s - "$APP"

echo ""
echo "Built $APP"
echo "  run it:            open $APP"
echo "  start at login:    System Settings > General > Login Items > add Awake.app"
