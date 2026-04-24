#!/usr/bin/env bash
# deploy.sh — build the Android APK locally and ship it to Firebase App Distribution.
#
# Usage:
#   ./deploy.sh                          # bump versionCode, build, distribute
#   ./deploy.sh --version 1.0.1          # also bump versionName
#   ./deploy.sh --notes "fixes X"        # custom release notes (default: last commit)
#   ./deploy.sh --groups qa,field-testers
#   ./deploy.sh --dirty                  # allow uncommitted changes
#   ./deploy.sh --no-commit              # skip committing the version bump
#   ./deploy.sh --skip-build             # reuse existing APK (retry distribution only)
#
# Requires:
#   - JDK 17, Android SDK, ANDROID_HOME set
#   - Node + npm (firebase-tools is pulled via npx)
#   - .env.deploy at repo root (see .env.deploy.example)
#
# Notes:
#   - Source of truth for versions is app.json (expo.version + expo.android.versionCode).
#     The script syncs those into android/app/build.gradle before building.
#   - Current gradle release config is signed with the debug keystore, which Firebase
#     App Distribution accepts. Swap to a real release keystore before shipping to
#     the Play Store — losing it means you can never update the installed app again.
#   - FIREBASE_TOKEN is deprecated by Google; plan to migrate to
#     GOOGLE_APPLICATION_CREDENTIALS (service account JSON) later.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

VERSION_NAME=""
NOTES=""
# Note: don't name this `GROUPS` — bash has a readonly built-in array with that
# name (the user's group IDs, gid 20 = `staff` on macOS) that silently shadows
# the assignment and makes --groups ignored.
TESTER_GROUPS=""
ALLOW_DIRTY=0
DO_COMMIT=1
DO_BUILD=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)    VERSION_NAME="$2"; shift 2 ;;
    --notes)      NOTES="$2"; shift 2 ;;
    --groups)     TESTER_GROUPS="$2"; shift 2 ;;
    --dirty)      ALLOW_DIRTY=1; shift ;;
    --no-commit)  DO_COMMIT=0; shift ;;
    --skip-build) DO_BUILD=0; shift ;;
    -h|--help)    sed -n '2,25p' "$0"; exit 0 ;;
    *)            echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done

if [ -f .env.deploy ]; then
  set -a; . ./.env.deploy; set +a
fi
: "${FIREBASE_APP_ID:?FIREBASE_APP_ID not set (see .env.deploy.example)}"
: "${FIREBASE_TOKEN:?FIREBASE_TOKEN not set — get one with: npx firebase-tools login:ci}"
TESTER_GROUPS="${TESTER_GROUPS:-${FIREBASE_TESTER_GROUPS:-field-testers}}"

if [ ! -d android ]; then
  echo "android/ not found. Run 'npx expo prebuild --platform android' first." >&2
  exit 1
fi

if [ "$ALLOW_DIRTY" = 0 ] && ! git diff --quiet HEAD --; then
  echo "working tree has uncommitted changes. use --dirty to override." >&2
  exit 1
fi

# Bump version in app.json (the tracked source of truth) and read back final values.
NEW_VERSION_CODE=$(VERSION_NAME_IN="$VERSION_NAME" node -e '
  const fs = require("fs");
  const p = JSON.parse(fs.readFileSync("./app.json", "utf8"));
  p.expo.android = p.expo.android || {};
  p.expo.android.versionCode = (p.expo.android.versionCode || 0) + 1;
  if (process.env.VERSION_NAME_IN) p.expo.version = process.env.VERSION_NAME_IN;
  fs.writeFileSync("./app.json", JSON.stringify(p, null, 2) + "\n");
  process.stdout.write(String(p.expo.android.versionCode));
')
VERSION_NAME_FINAL=$(node -e 'process.stdout.write(require("./app.json").expo.version)')
echo "==> versionName=$VERSION_NAME_FINAL versionCode=$NEW_VERSION_CODE"

# Mirror into the (gitignored) gradle file so the APK carries the right numbers.
/usr/bin/sed -i '' -E "s/versionCode[[:space:]]+[0-9]+/versionCode $NEW_VERSION_CODE/" android/app/build.gradle
/usr/bin/sed -i '' -E "s/versionName[[:space:]]+\"[^\"]*\"/versionName \"$VERSION_NAME_FINAL\"/" android/app/build.gradle

APK="android/app/build/outputs/apk/release/app-release.apk"

if [ "$DO_BUILD" = 1 ]; then
  echo "==> building release APK (this takes a few minutes the first time)"
  (cd android && ./gradlew --console=plain :app:assembleRelease)
fi

if [ ! -f "$APK" ]; then
  echo "APK not found at $APK" >&2
  exit 1
fi
echo "==> APK ready ($(du -h "$APK" | cut -f1))"

if [ -z "$NOTES" ]; then
  NOTES="$(git log -1 --pretty=format:'%s%n%n%b')
Commit: $(git rev-parse --short HEAD)"
fi

echo "==> distributing to Firebase (groups: $TESTER_GROUPS)"
npx --yes firebase-tools appdistribution:distribute "$APK" \
  --app "$FIREBASE_APP_ID" \
  --groups "$TESTER_GROUPS" \
  --release-notes "$NOTES"

if [ "$DO_COMMIT" = 1 ]; then
  git add app.json
  if ! git diff --cached --quiet; then
    git commit -m "chore(release): v$VERSION_NAME_FINAL+$NEW_VERSION_CODE"
    echo "==> committed version bump — push when you're ready"
  fi
fi

echo "==> done."
