# 🆓 MessengerKo Free Deployment Guide

## 📱 Part 1: Build APK (Mobile App)

### Prerequisites
1. **Install Android Studio**: https://developer.android.com/studio
2. **Install Java JDK 11+**: https://adoptium.net/
3. **Install Node.js**: https://nodejs.org/

### Step-by-Step APK Build

1. **Setup Capacitor:**
   ```bash
   npm run mobile:setup
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Prepare mobile app:**
   ```bash
   npm run mobile:build
   ```

4. **Open in Android Studio:**
   ```bash
   npm run mobile:open
   ```

5. **In Android Studio:**
   - Wait for Gradle sync to complete
   - Go to **Build → Generate Signed Bundle/APK**
   - Choose **APK**
   - Create new keystore (save the passwords!)
   - Build **Release** APK
   - APK will be in: `android/app/build/outputs/apk/release/`

## 🌐 Part 2: Free Backend Deployment

### Option 1: Render.com (Recommended) ⭐

**Why Render.com?**
- ✅ 750 hours/month free (enough for 24/7)
- ✅ Automatic HTTPS
- ✅ Easy deployment
- ✅ Good performance
- ✅ WebSocket support

**Steps:**
1. **Create account**: https://render.com/
2. **Connect GitHub**: Link your repository
3. **Create Web Service**:
   - Repository: Your MessengerKo repo
   - Branch: main
   - Root Directory: `backend`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. **Set Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=your-super-secret-jwt-key-make-it-very-long-and-random
   MONGODB_URI=mongodb+srv://Rhod:weakako123@cluster0.8bpku4d.mongodb.net/messenger?retryWrites=true&w=majority
   ADMIN_EMAIL=admin123@admin.com
   ADMIN_PASSWORD=admin123
   ```
5. **Deploy**: Click "Create Web Service"
6. **Your URL**: `https://your-app-name.onrender.com`

### Option 2: Railway.app

**Steps:**
1. **Create account**: https://railway.app/
2. **Deploy from GitHub**:
   - Connect repository
   - Select `backend` folder
3. **Set Environment Variables** (same as above)
4. **Deploy automatically**
5. **Your URL**: `https://your-app-name.up.railway.app`

### Option 3: Vercel (Serverless)

**Note**: Limited WebSocket support, better for REST API only

**Steps:**
1. **Create account**: https://vercel.com/
2. **Import project** from GitHub
3. **Set Root Directory**: `backend`
4. **Set Environment Variables** (same as above)
5. **Deploy**
6. **Your URL**: `https://your-app-name.vercel.app`

## 🔧 Update Frontend URLs

After deploying backend, update these files:

### 1. Update API URL
In `src/lib/services/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://YOUR-ACTUAL-URL.onrender.com/api'  // Replace with your URL
  : 'http://localhost:3002/api';
```

### 2. Update Socket.io URL
In `src/lib/services/socket.ts`:
```typescript
const socketUrl = import.meta.env.PROD 
  ? 'https://YOUR-ACTUAL-URL.onrender.com'  // Replace with your URL
  : 'http://localhost:3002';
```

### 3. Rebuild APK
```bash
npm run mobile:dev
```

## 🎯 Complete Workflow

### First Time Setup:
1. **Deploy backend** to Render.com
2. **Get your backend URL** (e.g., `https://messengerko-abc123.onrender.com`)
3. **Update frontend URLs** with your actual backend URL
4. **Build APK** with updated URLs
5. **Test everything**

### Updates:
1. **Make changes** to your code
2. **Push to GitHub** (backend auto-deploys)
3. **Rebuild APK** if frontend changed
4. **Distribute new APK**

## 💰 Free Tier Limits

### Render.com:
- ✅ 750 hours/month (24/7 for 31 days)
- ✅ 512MB RAM
- ✅ Sleeps after 15min inactivity
- ✅ Custom domains

### Railway.app:
- ✅ $5 credit/month (usually enough)
- ✅ 512MB RAM
- ✅ No sleep

### Vercel:
- ✅ 100GB bandwidth/month
- ✅ Serverless functions
- ❌ Limited WebSocket support

## 🚀 Quick Commands

```bash
# Setup mobile development
npm run mobile:setup

# Build and open in Android Studio
npm run mobile:dev

# Just build for mobile
npm run mobile:build

# Open Android Studio
npm run mobile:open
```

## 🔍 Testing Your Deployment

### Test Backend:
1. Visit: `https://your-url.onrender.com/health`
2. Should return: `{"success":true,"message":"Server is running"}`

### Test APK:
1. Install APK on Android device
2. Login with admin: `admin123@admin.com` / `admin123`
3. Create users from admin panel
4. Test real-time messaging
5. Test group chats

## 🆘 Troubleshooting

### Common Issues:

1. **APK won't install**: Enable "Unknown sources" in Android settings
2. **Can't connect to backend**: Check URLs in frontend code
3. **Real-time not working**: Ensure WebSocket support on hosting platform
4. **Backend sleeping**: Use a service like UptimeRobot to ping every 5 minutes

### Useful Links:
- **Android Studio**: https://developer.android.com/studio
- **Capacitor Docs**: https://capacitorjs.com/docs
- **Render.com Docs**: https://render.com/docs
- **Railway Docs**: https://docs.railway.app/

## 🎉 You're Done!

Your MessengerKo app is now:
- 📱 **Mobile APK** - Installable on Android devices
- 🌐 **Live Backend** - Hosted for free with real-time messaging
- 🔄 **Auto-deployment** - Updates automatically when you push to GitHub
- 💰 **Completely Free** - No hosting costs

**Share your APK** with friends and start messaging! 🚀
