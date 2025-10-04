# Cloudinary Setup Instructions

## Step 1: Create Upload Preset in Cloudinary

1. Go to [Cloudinary Console](https://console.cloudinary.com/)
2. Sign in with your account
3. Go to **Settings** > **Upload**
4. Scroll down to **Upload presets**
5. Click **Add upload preset**
6. Configure the preset:
   - **Preset name**: `lumina-unsigned`
   - **Signing Mode**: `Unsigned`
   - **Folder**: `lumina/`
   - **Resource Type**: `Auto`
   - **Access Mode**: `Public`
7. Click **Save**

## Step 2: Update Code

Once you create the upload preset, I'll update the code to use it.

## Alternative: Use Local Storage Only

If you prefer to keep it simple, we can just use local storage for now and add Cloudinary later.
