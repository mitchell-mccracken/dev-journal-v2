# Capacitor iOS Build Workflow

Steps to update the iOS app after making changes to the Vue frontend.

## After Every Code Change

```bash
cd client

# 1. Build the Vue app
npm run build

# 2. Copy web assets to the iOS project
npx cap copy ios

# 3. Re-run in Xcode (hit ▶️ Run)
```

## After Installing/Removing npm Packages

```bash
cd client

# 1. Build the Vue app
npm run build

# 2. Sync (copies assets AND updates native dependencies)
npx cap sync ios

# 3. Re-run in Xcode
```

## After Updating Capacitor or Adding Capacitor Plugins

```bash
cd client

# 1. Install the plugin (example)
npm install @capacitor/camera

# 2. Build
npm run build

# 3. Sync (required — runs pod install for native deps)
npx cap sync ios

# 4. Re-run in Xcode
```

## Quick Reference

| Scenario | Command |
|---|---|
| Changed Vue/TS code only | `npm run build && npx cap copy ios` |
| Changed npm dependencies | `npm run build && npx cap sync ios` |
| Added a Capacitor plugin | `npm run build && npx cap sync ios` |
| Open Xcode | `npx cap open ios` |

## Notes

- **`cap copy`** = copies your `dist/` into the iOS project. Fast.
- **`cap sync`** = `copy` + updates native plugins + runs `pod install`. Use when dependencies change.
- Always build (`npm run build`) before copy/sync — Capacitor ships whatever is in `dist/`.
- After copy/sync, you still need to **re-run in Xcode** to see changes on device/simulator.

## ⚠️ After Running `npx cap sync` — Restore App Icon

`cap sync` can overwrite the app icon. After syncing, always re-run:

```bash
cp client/assets/icon-only.png client/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
```

Then in Xcode: **Product → Clean Build Folder** (Shift+Cmd+K) before running.
- client/ios/App/App.xcworkspace is the path to file that xcode needs

### Other notes:
- if getting errors when trying to save a processed image ensure that this key/value is on the info tab still
  - <Privacy - Photo Library Additions Usage Description> : "This app saves your processed photos to your photo library."