# Progress log

_Reverse-chronological notes after meaningful merges or milestones._

## Template

```markdown
### YYYY-MM-DD — [LINEAR-ID] short title

- What shipped:
- Gates run:
- Follow-ups:
```

## Entries

### 2026-07-24 — [SIL-325] Export mobile icon/splash assets

- What shipped (uncommitted): Expo masters `icon.png` (1024), `adaptive-icon.png` + background, `splash.png` (1284×2778); Android density exports under `assets/android/`; iOS AppIcon + SplashScreenLogo + black splash background; `app.json` wired to new paths.
- Gates run: dimension checks via `sips` / visual inspect (no app build per ticket).
- Follow-ups: commit + PR when requested; optional `expo prebuild` later to sync a generated `android/` tree.
