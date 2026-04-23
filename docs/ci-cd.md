# CI/CD — internal Android releases

Short reference for how MendLog ships to technicians. Designed for small
fleets; migrate to Play Internal Testing when the group outgrows Firebase
App Distribution.

## Pipeline at a glance

```
PR opened ──► ci.yml ──────────── lint · typecheck · test
                                    (blocks merge on failure)

ready to ship ─► ./deploy.sh ───► bump versionCode in app.json
                                  └► gradle :app:assembleRelease
                                      └► firebase appdistribution:distribute
                                          └► emails "field-testers"
```

Builds run on the developer's machine, not in GitHub Actions. The EAS +
Firebase auto-release workflow was removed on 2026-04-23 — local builds
are ~6× faster (≈2.5 min vs ≈15 min on the EAS free tier) and don't
queue behind paid projects at peak times.

## Required local setup

- JDK 17, Android SDK, `ANDROID_HOME` exported
- Node + npm (`firebase-tools` is pulled via `npx` on demand)
- `.env.deploy` at the repo root — copy `.env.deploy.example` and fill:
  | Var                      | Source                                                                 |
  | ------------------------ | ---------------------------------------------------------------------- |
  | `FIREBASE_APP_ID`        | Firebase console → project settings → your apps → `1:...:android:...`  |
  | `FIREBASE_TOKEN`         | `npx firebase-tools login:ci` (local one-off)                          |
  | `FIREBASE_TESTER_GROUPS` | optional; defaults to `field-testers`                                  |

`.env.deploy` is gitignored. `FIREBASE_TOKEN` is deprecated by Google;
plan to migrate to `GOOGLE_APPLICATION_CREDENTIALS` (service account
JSON) later.

## Shipping a build

```
./deploy.sh                          # bump versionCode, build, distribute
./deploy.sh --version 1.0.1          # also bump versionName
./deploy.sh --notes "fixes X"        # custom release notes (default: last commit)
./deploy.sh --groups qa,field-testers
./deploy.sh --dirty                  # allow uncommitted changes
./deploy.sh --no-commit              # skip committing the version bump
./deploy.sh --skip-build             # reuse existing APK (retry distribution only)
```

`app.json` (`expo.version` + `expo.android.versionCode`) is the source
of truth; the script syncs those into `android/app/build.gradle` before
gradle runs.

## Firebase setup (one-time)

Inside the Firebase console for project `mendlog`:

1. **Release & Monitor → App Distribution** → accept terms.
2. **Testers & groups** → create group `field-testers` (name must match
   the default `--groups` flag in `deploy.sh`, or set
   `FIREBASE_TESTER_GROUPS` in `.env.deploy`).
3. Add tester emails. Testers get an invite once their first build
   lands; subsequent builds email them automatically.

## Signing

Current gradle release config is signed with the debug keystore, which
Firebase App Distribution accepts. Swap to a real release keystore
before shipping to the Play Store — losing it means you can never
update the installed app again.

## Troubleshooting

- **Gradle fails with `SDK not found`** — export `ANDROID_HOME` (usually
  `~/Library/Android/sdk` on macOS) and ensure JDK 17 is on `$PATH`.
- **`android/` doesn't exist** — run `npx expo prebuild --platform android`
  once to generate it.
- **Firebase distribute rejects the APK** — check `FIREBASE_APP_ID`
  matches the one in `app.json`'s `android.package`
  (`com.theetaz.mendlog`).
- **Testers don't receive the email** — check the group name and that
  the email address is in **Testers & groups**, not just invited to the
  Firebase project.
- **Working tree dirty** — commit or pass `--dirty` to override.
