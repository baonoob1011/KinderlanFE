# 🔧 Fix Google OAuth "Origin Not Allowed" Error

## Step 1: Configure Google Cloud Console

You need to add your localhost URL to your Google OAuth client configuration:

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Navigate to APIs & Credentials:**
   - Select your project 
   - Go to "APIs & Services" > "Credentials"

3. **Edit your OAuth 2.0 Client ID:**
   - Find client ID: `32611107358-85idis0ht4agdonm6u449bem5djq17sr.apps.googleusercontent.com`
   - Click the edit button (pencil icon)

4. **Add Authorized JavaScript Origins:**
   ```
   http://localhost:3000
   ```
   
   If you're using different ports, also add:
   ```
   http://localhost:5173
   http://localhost:3001
   ```

5. **Add Authorized Redirect URIs (if needed):**
   ```
   http://localhost:3000
   http://localhost:3000/auth/callback
   ```

6. **Save the changes**

## Step 2: Common Backend Token Formats

Your backend might expect a different request format. Try these:

**Current format (what we're sending):**
```json
{
  "token": "google-jwt-credential-here"
}
```

**Alternative formats to try:**
```json
{
  "credential": "google-jwt-credential-here"
}
```

```json
{
  "idToken": "google-jwt-credential-here"
}
```

```json
{
  "access_token": "google-jwt-credential-here"
}
```

## Step 3: Test Again

1. **Restart your dev server** (to pick up any changes):
   ```bash
   npm run dev
   ```

2. **Open browser console** (F12) to see debugging logs

3. **Try Google login** and check the console for:
   - "Google credential received: Yes/No"
   - "Backend response status: XXX"
   - Any error messages

## Step 4: Backend Verification

Make sure your backend at `http://localhost:8080/api/v1/auth/login/google` expects:
- **Method:** POST
- **Content-Type:** application/json  
- **Body:** `{ "token": "jwt-token-here" }`
- **Response:** `{ "user": { "email": "...", "name": "..." } }`

## Still Getting Errors?

Check the browser console and share:
1. The "Backend response status" log
2. The "Backend error response" log
3. Any other error messages

This will help identify if it's a format issue or backend configuration problem.