# OAuth 404 Error - Complete Fix Guide

## What Was the Problem?
When you tried to sign up with Google or GitHub, after selecting an account you got a 404 NOT_FOUND error. This was caused by multiple issues:

1. **Database Schema Mismatch**: The User model was missing OAuth provider ID fields (`googleId`, `githubId`)
2. **Frontend Redirect Bug**: The OAuth callback wasn't redirecting to the correct API endpoint
3. **Missing Environment Variables**: Callback URLs weren't explicitly configured

## Fixes Applied ✅

### 1. Updated User Model (server/src/models/User.js)
- Added `googleId`, `githubId`, and `authProviders` fields to support OAuth

### 2. Fixed Frontend OAuth Callback (src/App.jsx)
- Now properly redirects to backend API URL
- Uses `VITE_API_URL` in production
- Uses relative path in development

### 3. Added Callback URL Configuration
- **Development** (server/.env):
  ```
  GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
  GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback
  ```
- **Production** (.env.production):
  ```
  GOOGLE_CALLBACK_URL=https://jobpilot-ai-92r6.onrender.com/api/auth/google/callback
  GITHUB_CALLBACK_URL=https://jobpilot-ai-92r6.onrender.com/api/auth/github/callback
  ```

### 4. Enhanced Logging
- Added detailed console logs to track OAuth flow for debugging

## What You Need to Do NOW

### ⚠️ IMPORTANT: Update Google OAuth App Settings

1. **Go to Google Cloud Console** (https://console.cloud.google.com/)
2. **Find your OAuth app** (228813641025-ouq3lac99qqcbuod8kplb17ifcbt5khe.apps.googleusercontent.com)
3. **Add these Authorized Redirect URIs**:
   - `http://localhost:3001/api/auth/google/callback` (for development)
   - `https://jobpilot-ai-92r6.onrender.com/api/auth/google/callback` (for production)

4. **Save the changes**

### ⚠️ IMPORTANT: Update GitHub OAuth App Settings

1. **Go to GitHub Settings** → Developer settings → OAuth Apps
2. **Find your OAuth app** (Client ID: Ov23liyOm6IN25tXfJoC)
3. **Update Authorization Callback URL**:
   - Set it to: `https://jobpilot-ai-92r6.onrender.com/api/auth/github/callback`
   - Or for local development: `http://localhost:3001/api/auth/github/callback`

4. **Save the changes**

### Testing in Development

1. **Start the backend server**:
   ```bash
   cd server
   npm run dev  # or node start.js
   ```

2. **Start the frontend server** (in another terminal):
   ```bash
   npm run dev
   ```

3. **Test OAuth flow**:
   - Go to http://localhost:5174/login
   - Click "Google" or "GitHub" button
   - Complete the OAuth flow
   - Should now create/update user and redirect to dashboard

### Troubleshooting with Logs

If you still get 404 errors, check the server console logs:
- Look for `[Google OAuth]` or `[GitHub OAuth]` prefixed logs
- They show:
  - The callback URL being sent to OAuth provider
  - Token response status
  - User creation/update status
  - Any errors encountered

### Common Issues

**Issue**: "Invalid callback URL"
- **Solution**: Make sure the callback URL in server/.env matches what's registered in Google/GitHub

**Issue**: User still gets 404 after OAuth callback
- **Solution**: Check browser console and server logs for error messages
- Ensure VITE_API_URL is set correctly for your environment

**Issue**: Database errors when creating user
- **Solution**: Restart the backend server to reload the new User schema

## Next Steps

1. ✅ Run backend server and check console logs
2. ✅ Test OAuth flow locally
3. ✅ If working, push changes to production
4. ✅ Verify OAuth apps are configured with production URLs
5. ✅ Test production OAuth flow

## Files Modified

- `server/src/models/User.js` - Added OAuth fields to schema
- `src/App.jsx` - Fixed OAuth callback redirect
- `server/.env` - Added callback URL config
- `.env.production` - Added production callback URLs
- `server/src/routes/auth.js` - Enhanced error logging

Let me know if you hit any issues!
