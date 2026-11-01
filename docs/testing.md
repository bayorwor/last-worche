# Testing guide

How to test lastWorche on every platform. It has three steps:

1. [Get the right version](#1-get-the-right-version) and [run the automated tests](#2-run-the-automated-tests).
2. [Start the product](#3-start-the-product-on-your-platform) on the platform you are testing.
3. Go through [the same checklist](#4-the-checklist-for-every-platform) on every platform.

## Which platforms are tested

| Platform | How to test it | Status |
|---|---|---|
| macOS, Chrome | [Computer browser](#computer-browser) | **Tested** |
| macOS, Safari or Firefox | [Computer browser](#computer-browser) | Not tested yet |
| Windows, Edge or Chrome | [Computer browser](#computer-browser), with the [Windows commands](#windows-and-linux-commands) | Not tested yet |
| Linux, Chrome or Firefox | [Computer browser](#computer-browser), with the [Linux commands](#windows-and-linux-commands) | Not tested yet |
| iPhone or Android, phone browser | [Phone browser](#phone-browser) | Tested only in Chrome's mobile mode on a computer |
| iOS simulator, app | [iOS simulator app](#ios-simulator-app) | Opens and loads data from the backend. Signing in by hand is not confirmed yet |
| iPhone, app | [iPhone app](#iphone-app) | The build tested in the simulator, not yet on an iPhone |
| Android emulator, app | [Android app](#android-app) | **Not run yet:** needs Java 21 |
| Android phone, app | [Android app](#android-app) | **Not run yet:** needs Java 21 |

When you finish the checklist on a platform, update its status here in your next pull request.

## 1. Get the right version

**Test on `staging`.** It holds the next version of the product. Use `main` only for the final check before the deadline, and a `feature/` branch only to review its pull request. The [README](../README.md#for-teammates-which-branch-to-test) explains each branch.

The first time, follow [Prerequisites and Setup in the README](../README.md#prerequisites). After that, from the repository root:

```bash
git fetch origin
git switch staging
git pull
cd backend && bun install --frozen-lockfile && cd ..
cd client && bun install --frozen-lockfile && cd ..
```

The backend updates your database by itself when it starts.

## 2. Run the automated tests

These work the same for every platform, because they test the backend and the client's logic. From the repository root:

```bash
(cd backend && bun test) && (cd client && bun test)
```

Every line must end in `0 fail`. The backend tests against real MySQL are reported as skipped, so run them as well before a promotion. They **delete all bookings and activity** in the database they use, so create a separate one, once:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS lastworche_tests; GRANT ALL PRIVILEGES ON lastworche_tests.* TO 'lastworche'@'localhost';"
```

Then, from `backend/`:

```bash
TEST_DATABASE_URL=mysql://lastworche:lastworche@localhost:3306/lastworche_tests bun test
```

Before a pull request, also run the type check, lint and build:

```bash
cd backend && bun run typecheck && cd ..
cd client && bun run lint && bun run build && cd ..
```

## 3. Start the product on your platform

MySQL must be running on the computer in every case. Start each command in its own terminal, from the repository root.

### Computer browser

```bash
cd backend && bun run start
```

```bash
cd client && bun run dev
```

Open <http://localhost:5173>.

### Phone browser

This works on any phone with nothing to install, so try it first. The phone and computer must be on the same Wi-Fi.

```bash
cd backend && bun run start
```

```bash
cd client && bun run dev --host
```

Vite prints a `Network` address, such as `http://192.168.1.20:5173/`. Open that address in the phone's browser. It updates by itself when the code changes.

If nothing loads, allow incoming connections in your computer's firewall. Some company and guest networks block this, so try a phone hotspot.

### iOS simulator app

Needs a Mac with Xcode.

```bash
cd backend && bun run start
```

```bash
cd client
bun run mobile:sync
bunx cap open ios
```

In Xcode, choose an iPhone simulator and press **Run**. The first launch after the simulator starts can show a white screen for about 10 seconds.

### iPhone app

Needs a Mac with Xcode, an Apple ID and a cable. On a phone, `localhost` means the phone itself, so build the app with your computer's address. Find it [as described below](#find-your-computers-address), and use it in place of `192.168.1.20`. The phone and computer must be on the same Wi-Fi.

```bash
cd backend && bun run start
```

```bash
cd client
VITE_API_BASE_URL=http://192.168.1.20:3000/api bun run mobile:sync
bunx cap open ios
```

1. In Xcode, select the **App** target, then **Signing & Capabilities**, and choose your **Team**.
2. If Xcode rejects the bundle identifier, change `com.example.app` to something unique. Do not commit that change.
3. Connect the iPhone, choose it as the destination, and press **Run**.
4. If the iPhone says the developer is not trusted, allow it in **Settings → General → VPN & Device Management**.

When you finish, run `bun run mobile:sync` again to go back to the `localhost` address. Repeat these steps if your computer's address changes.

### Android app

Needs Android Studio on Windows, macOS or Linux, and **Java 21**. In Android Studio, choose Java 21 under **Settings → Build Tools → Gradle → Gradle JDK**. With an older version, the build fails with `invalid source release: 21`.

```bash
cd backend && bun run start
```

```bash
cd client
bun run mobile:sync
bunx cap open android
```

Choose an emulator or a phone connected by cable, and press **Run**. Then let the device reach the backend on your computer:

```bash
adb reverse tcp:3000 tcp:3000
```

Run that again whenever the device reconnects. If your `backend/.env` is older than this guide, set `CORS_ORIGINS` as in `backend/.env.example`, or the app cannot reach the API.

**Android phone with no cable:** build with your computer's address instead, as for the [iPhone app](#iphone-app), and skip `adb reverse`.

### Find your computer's address

| System | Command | Look for |
|---|---|---|
| macOS | `ipconfig getifaddr en0` | The address it prints |
| Windows | `ipconfig` | `IPv4 Address` |
| Linux | `hostname -I` | The first address |

### Windows and Linux commands

Linux uses the same commands as macOS. On Windows, these differ in PowerShell:

| Step | macOS and Linux | Windows PowerShell |
|---|---|---|
| Create the database | `mysql -u root -p < backend/setup-database.sql` | `Get-Content backend/setup-database.sql \| mysql -u root -p` |
| Run all tests | `(cd backend && bun test) && (cd client && bun test)` | `cd backend; bun test; cd ../client; bun test; cd ..` |
| Tests against real MySQL | `TEST_DATABASE_URL=... bun test` | `$env:TEST_DATABASE_URL="..."; bun test` |
| Build with an address | `VITE_API_BASE_URL=... bun run mobile:sync` | `$env:VITE_API_BASE_URL="..."; bun run mobile:sync` |

In PowerShell, a variable set this way stays until you close the terminal. Open a new one before going back to the normal build. iOS apps can only be built on a Mac.

### After pulling new changes

The apps hold a copy of the client and do not update by themselves. Run `bun run mobile:sync` in `client/`, and press **Run** again. Restart the backend on every platform.

## 4. The checklist for every platform

Start with fresh data, because step 10 locks a month, step 15 changes a name, and the bookings stay. To reset:

```bash
mysql -u root -p -e "DROP DATABASE lastworche"
mysql -u root -p < backend/setup-database.sql
```

Then restart the backend. To sign in: enter the email, choose *Send code*, then *Use code*. All users are fictional, and the [README](../README.md#demo-users) lists them. The labels below are in English, and *DE* switches to German.

| # | Sign in as | Do this | You should see |
|---|---|---|---|
| 1 | Nobody | Open the app | The sign-in screen with the logo, in German if your device's time zone is in Germany, Austria, Switzerland or Liechtenstein, otherwise in English unless your browser is set to German |
| 2 | Nobody | Enter `not-an-email`, then *Send code* | An error, and you stay on the same screen |
| 3 | `a.weber@client.example` | Enter a wrong 6-digit code | An error, and the boxes empty themselves |
| 4 | `l.hoffmann@consultis.example` | Sign in | The consultant screen with 2 orders to choose from, the tabs *Book time* and *My bookings*, and *You signed in* under *Recent activity* |
| 5 | Same | Enter `9 bis 5 am Kundenportal, 1 h Mittag`, then *Check proposal* and *Confirm booking* | *Booking saved*, the booking at the top of *Recent activity* and of the *My bookings* tab, and today's hours at 7.0 h |
| 6 | Same | Do step 5 again | **Rejected:** overlaps with an existing booking, and no new entry under *Recent activity* |
| 7 | Same | Choose order 4500012346, and do step 5 again | **Rejected:** only 0.5 PD left |
| 8 | Same | Reload the page, then choose *Sign out* | Still signed in after the reload, then back on the sign-in screen |
| 9 | `a.weber@client.example` | Look at order 4500012345 | *Budget* tab: used is 84.875 PD and free is 55.125 PD. *Bookings* tab: the new booking. *Recent activity*: L. Hoffmann booked 7.0 h |
| 10 | Same | On the *Proofs of work* tab, choose *Approve proof of work* for the current month, then *Yes, approve* | The month shows *Approved* and *Approved by A. Weber*, and *You approved* appears under *Recent activity* |
| 11 | `m.krueger@consultis.example` | Do step 5 | One order to choose from, then **rejected:** proof of work already approved |
| 12 | `j.schneider@client.example` | Sign in | Only order 4500012347 |
| 13 | `k.vogel@client.example` | Look at the screen | Totals on the *Suppliers* and *Orders* tabs, 4500012346 marked *Follow-up order needed*. *Recent activity* shows the approved month without a name and no bookings. **No other person's name anywhere** |
| 14 | Any | Choose *DE*, then *EN*, including while an error is showing | All text changes, including the error, and your choice is still there after a reload |
| 15 | `m.krueger@consultis.example` | Under *My profile*, choose *Edit*, clear the name and save, then enter `Mira Krüger` and save | An error for the empty name, then *Profile saved*, the new name at the top of the page, and still there after a reload. Email and role cannot be edited |
| 16 | `a.weber@client.example` | Open the *Bookings* tab | The new name on that consultant's bookings |

### Screen sizes

- **1280 px wide or more:** tabs on the left, the page in the middle, and profile and activity on the right. When the page scrolls, the side columns stay in view, and the right column scrolls by itself.
- **1024 to 1279 px:** tabs on the left, with profile and activity below the page.
- **Below 1024 px:** tabs in a row above the page, with profile and activity below it.

### Extra checks on phones and apps

- Nothing scrolls sideways, apart from wide tables inside their own box.
- The status bar, notch and home bar do not cover any content.
- Buttons are easy to tap, and the code keyboard shows numbers.
- Pasting a 6-digit code into the boxes signs you in.
- **iPhone only:** with real email on, a code from Mail is offered above the keyboard.

## Optional: real services

The product needs neither of these, and neither has been fully tested. Set them in `backend/.env`, and restart the backend.

**Real email.** The test users' `.example` addresses have no mailbox, so point one at an address you own, in a database you can reset:

```bash
mysql -u root -p lastworche -e "UPDATE users SET email = 'you@example.com' WHERE id = 'user-consultant'"
```

```bash
MAIL_MOCK=false
TEST_ACCOUNTS_ENABLED=false
SMTP_HOST=your.mail.server
SMTP_PORT=587
SMTP_USER=your-user
SMTP_PASSWORD=your-password
```

The code should now arrive by email only, and the *Test mode* box should be gone. If nothing arrives, look in the backend's log for `Sending a sign-in code failed`.

**Real AI.** Set `AI_MOCK=false` and `OPENROUTER_API_KEY`. The one-sentence booking should then read the times from your sentence, instead of always proposing 09:00–17:00.

## Report what you find

Fix a bug on a new `feature/` branch from `development`, never on `staging` itself. When you report one, include:

- **Branch and commit:** `git log --oneline -1`
- **Platform:** device, system and browser or app
- **Test user and checklist step**
- **What you expected, and what happened,** with a screenshot and any error from the backend's terminal

Problems starting the product are covered under [If something does not start](../README.md#if-something-does-not-start).
