# How to Build the iOS App on your Mac

Based on the system check, here are the **3 exact steps** you need to complete to get the app on your iPhone.

## Step 1: Install Full Xcode (Required)
Your system currently only has "Command Line Tools", but building an iPhone app requires the full **Xcode** application.
1.  Open the **App Store** on your Mac.
2.  Search for **Xcode**.
3.  Click **Get/Install** (Note: It is a large download, ~3GB+).
4.  Once installed, open it at least once to agree to the license terms.

## Step 2: Set up your Developer Account
Apple requires a digital signature to run apps on a physical device.
1.  Open the folder `mobile_app/ios` on your Mac.
2.  Double-click **`Runner.xcworkspace`** to open it in Xcode.
3.  In the left sidebar, click the top blue icon named **Runner**.
4.  Switch to the **Signing & Capabilities** tab in the main view.
5.  Under "Team", click **Add an Account...** and log in with your Apple ID.
6.  Select your Personal Team from the dropdown.

## Step 3: Install on iPhone
1.  Connect your iPhone to your Mac via USB cable.
2.  Unlock your iPhone and click **"Trust"** if prompted.
3.  Open your **Terminal** and navigate to the project folder:
    ```bash
    cd mobile_app
    ```
4.  Run the build command:
    ```bash
    flutter run --release
    ```

### Troubleshooting
- If you see "Untrusted Developer" on your iPhone:
  - Go to **Settings -> General -> VPN & Device Management** on your iPhone.
  - Tap your email address and click **Trust**.
