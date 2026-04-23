# CI/CD — internal Android releases

Short reference for how MendLog ships to technicians. Designed for small
fleets; migrate to Play Internal Testing when the group outgrows Firebase
App Distribution.

## Pipeline at a glance

```
PR opened ──► ci.yml ──────────── lint · typecheck · test
                                    (blocks merge on failure)

push to main ─► release.yml ────► verify (same checks)
                                  └► EAS build (Android, profile: preview)
                                      └► curl APK artifact
                                          └► Firebase App Distribution
                                              └► emails "field-testers"
```

One release at a time — `concurrency.group: release-main` cancels the
older run if a newer commit lands mid-release.

## Required GitHub secrets

Set under **Settings → Secrets and variables → Actions**. The pipeline
fails fast if any are missing.

| Secret                            | Source                                                           | Sensitive? |
| --------------------------------- | ---------------------------------------------------------------- | ---------- |
| `EXPO_TOKEN`                      | expo.dev → Access tokens                                         | yes        |
| `FIREBASE_TOKEN`                  | `firebase login:ci` (local one-off)                              | yes        |
| `FIREBASE_ANDROID_APP_ID`         | Firebase console → project settings → your apps → `1:...:android:...` | no     |
| `EXPO_PUBLIC_SUPABASE_URL`        | Supabase project settings → API                                  | no         |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`   | Supabase project settings → API                                  | no (public by design) |

To rotate a token: revoke at source, regenerate, paste the new value into
the same secret. Rotation triggers no pipeline changes.

## EAS profiles (`eas.json`)

| Profile      | Distribution | Artifact    | Channel      | Used by         |
| ------------ | ------------ | ----------- | ------------ | --------------- |
| `preview`    | internal     | APK         | `preview`    | this pipeline   |
| `production` | store        | AAB         | `production` | future Play release |

`appVersionSource: "remote"` means EAS manages `versionCode` — every
build is monotonic without touching `app.json`.

## Firebase setup (one-time)

Inside the Firebase console for project `mendlog`:

1. **Release & Monitor → App Distribution** → accept terms.
2. **Testers & groups** → create group `field-testers` (name must match
   the `--groups` flag in `release.yml`).
3. Add tester emails. Testers get an invite once their first build
   lands; subsequent builds email them automatically.

## Manual / out-of-band release

Actions tab → **Release to internal testers** → Run workflow → optionally
paste custom release notes. Same pipeline, same gate.

## Troubleshooting

- **"No artifact URL returned from EAS"** — the build failed upstream.
  Open expo.dev → Builds to see the error. The verify job still passes;
  this is purely an EAS issue.
- **Firebase distribute step rejects the APK** — check
  `FIREBASE_ANDROID_APP_ID` matches the one in `app.json`'s
  `android.package` (`com.theetaz.mendlog`).
- **Testers don't receive the email** — check the group name and that
  the email address is in **Testers & groups**, not just invited to the
  Firebase project.
- **Build takes >20 min** — EAS free tier queues behind paid projects at
  peak times. Not a pipeline bug.
