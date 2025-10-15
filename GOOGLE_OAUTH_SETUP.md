# Google OAuth Setup Guide

## ⚠️ Fix for "redirect_uri_mismatch" Error

The error you encountered happens when Google doesn't recognize your redirect URI. Here's how to fix it:

## Step 1: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or the one where your OAuth credentials are)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (the one with your `GOOGLE_CLIENT_ID`)
5. Click **Edit** (pencil icon)

### Add Authorized Redirect URIs

In the "Authorized redirect URIs" section, add:

#### For Development:
```
http://localhost:5000/api/v1/auth/google/callback
```

#### For Production:
```
https://usesilverkey.com/api/v1/auth/google/callback
```

6. Click **Save** at the bottom

**⚠️ Important Notes**:
- The redirect URI **MUST** point to your backend server (port 5000)
- It should **NOT** point to the frontend (port 5173)
- The URI must match exactly (including http/https, port, and path)

## Step 2: Restart Backend Server

After updating Google Cloud Console, restart your backend to ensure it picks up any changes:

```bash
# Stop the current server (Ctrl+C if running)
cd /Users/jaycewalzer/Desktop/SilverKey/Server
python run.py
```

## Step 3: Test Again

1. Make sure backend is running on http://localhost:5000
2. Make sure frontend is running on http://localhost:5173
3. Navigate to http://localhost:5173/login
4. Click "Sign in with Google"
5. You should now be redirected to Google's authorization page

## Troubleshooting

### Still getting "redirect_uri_mismatch"?

**Check these:**
1. ✅ Redirect URI in Google Cloud Console is exactly: `http://localhost:5000/api/v1/auth/google/callback`
2. ✅ You clicked "Save" in Google Cloud Console after adding the URI
3. ✅ Backend server is running on port 5000 (check terminal)
4. ✅ You're using the correct Google Client ID (check `GOOGLE_CLIENT_ID` env var)

### Check the actual redirect URI being used:

Look at your backend logs when you click the Google button. You should see:
```
GOOGLE_AUTH_URL_GENERATED
```

The redirect_uri in the auth URL should be `http://localhost:5000/api/v1/auth/google/callback`

### Verify environment variables:

```bash
cd /Users/jaycewalzer/Desktop/SilverKey/Server
python3 -c "import os; from dotenv import load_dotenv; load_dotenv(); print('GOOGLE_CLIENT_ID:', os.getenv('GOOGLE_CLIENT_ID')[:20] + '...' if os.getenv('GOOGLE_CLIENT_ID') else 'NOT SET')"
```

## OAuth Flow Diagram

```
Frontend (localhost:5173)
    ↓ User clicks "Sign in with Google"
    ↓ Redirects to: http://localhost:5000/api/v1/auth/google/start
    ↓
Backend (localhost:5000)
    ↓ Generates OAuth URL with redirect_uri=http://localhost:5000/api/v1/auth/google/callback
    ↓ Redirects to: Google OAuth
    ↓
Google
    ↓ User authorizes
    ↓ Redirects to: http://localhost:5000/api/v1/auth/google/callback?code=...
    ↓
Backend (localhost:5000)
    ↓ Processes callback
    ↓ Creates/links user
    ↓ Sets session cookies
    ↓ Redirects to: http://localhost:5173/dashboard?google=success
    ↓
Frontend (localhost:5173)
    ✅ User is logged in
```

## Quick Test Commands

```bash
# Terminal 1: Backend
cd /Users/jaycewalzer/Desktop/SilverKey/Server
python run.py

# Terminal 2: Frontend
cd /Users/jaycewalzer/Desktop/SilverKey/Client/apps/web
npm run dev

# Then open browser to: http://localhost:5173/login
```

## Next Steps After Successful Test

Once Google OAuth is working in development:

1. **For Production**: Add the production redirect URI to Google Cloud Console:
   ```
   https://usesilverkey.com/api/v1/auth/google/callback
   ```

2. **Run Database Migration** (if not already done):
   ```bash
   cd /Users/jaycewalzer/Desktop/SilverKey/Server
   flask db upgrade
   ```

3. **Deploy**: The implementation is ready for production!

## Support

If you continue to have issues:
1. Check the backend logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Google Cloud Console changes have been saved
4. Try using an incognito/private browser window to avoid cached redirect issues

