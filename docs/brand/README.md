# Brand assets

`logo-supplied.png` is the logo as the team supplied it. Everything else here is redrawn from it as vectors, because the supplied file is too small (348 × 130 px) to scale up to app icon size.

| File | Use |
|---|---|
| `logo.svg` | Full logo: icon, wordmark and tagline. Used in the app header and the README. |
| `logo-on-crimson.svg` | Full logo for a crimson background, as on the sign-in screen. |
| `logo-icon.svg` | Icon with rounded corners, for any place that needs only the icon. |
| `logo-icon-1024.png` | The same icon as an image, for tools that cannot read SVG. |
| `logo-icon-square.svg` | Icon without rounded corners, for iOS and other systems that cut their own shape. |
| `logo-mark-white.svg` | Only the white mark, to place on a crimson background. |
| `favicon.svg` | Simplified icon for browser tabs, because the thin lines disappear at 16 px. |

**Colours:** crimson `#AE2036`, wordmark `#2A3440`, tagline `#5E6873`. The wordmark uses [Inter](https://rsms.me/inter/), converted to outlines, so no font needs to be installed.

## Where the icons are used

- **Web:** `client/public/`, connected in `client/index.html` and `client/public/site.webmanifest`
- **iOS:** `client/ios/App/App/Assets.xcassets/`
- **Android:** `client/android/app/src/main/res/`, in the `mipmap-*` and `drawable*` folders
- **Mockup:** the icon is built into `docs/mockup/index.html`

In text, the product is always written `lastWorche`.
