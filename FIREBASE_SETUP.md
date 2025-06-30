# 🔥 Firebase Setup Guide for WUVO Social Features

## 🎓 Using GitHub Student Developer Pack

1. **Get Student Benefits**
   - Visit: https://education.github.com/pack
   - Verify with your `.edu` email
   - Get $300 Google Cloud credits (12 months)

## 🚀 Firebase Project Setup

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click **"Create a project"**
3. Project name: `wuvo-social`
4. Enable Google Analytics: **Yes**
5. Select billing account with student credits

### Step 2: Get Firebase Configuration
1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"**
3. Click **"Add app"** → **Web** (</> icon)
4. App nickname: `WUVO React Native`
5. **Don't** enable Firebase Hosting
6. Copy the `firebaseConfig` object

### Step 3: Update Firebase Config
Replace the config in `/src/config/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};
```

### Step 4: Configure Authentication
1. In Firebase Console → **Authentication**
2. Click **"Get started"**
3. Go to **Sign-in method** tab
4. Enable these providers:
   - ✅ **Email/Password**
   - ✅ **Google** (use existing config from earlier setup)
   - ✅ **Apple** (use existing config from earlier setup)

### Step 5: Set Up Firestore Database
1. In Firebase Console → **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add security rules later)
4. Select region: **us-central1** (or closest to your users)

### Step 6: Configure Firestore Security Rules
Go to **Firestore Database** → **Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && resource.data.isPublic == true;
    }
    
    // Anyone can read public user profiles
    match /users/{userId} {
      allow read: if request.auth != null && resource.data.isPublic == true;
    }
    
    // Follow relationships
    match /follows/{followId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.followerId;
    }
    
    // User ratings
    match /userRatings/{ratingId} {
      allow read: if request.auth != null && resource.data.isPublic == true;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## 📱 React Native Configuration

### For Expo (Current Setup)
The Firebase SDK is already installed. Just update the config file.

### For Bare React Native (Future)
If you eject from Expo, additional native configuration needed:

**iOS (ios/YourApp/Info.plist):**
```xml
<!-- Add your GoogleService-Info.plist file to ios/ folder -->
```

**Android (android/app/google-services.json):**
```json
// Add your google-services.json file to android/app/ folder
```

## 🧪 Testing the Setup

### Step 1: Test Firebase Connection
Add this to your App.js temporarily:

```javascript
import { auth, db } from './src/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Test Firebase connection
console.log('Firebase Auth:', auth);
console.log('Firestore DB:', db);

onAuthStateChanged(auth, (user) => {
  console.log('Auth state changed:', user ? user.uid : 'No user');
});
```

### Step 2: Test User Search
1. Open the app
2. Go to Profile screen
3. Tap the 🔍 search icon
4. Try searching (will be empty until you add users)

## 🚧 Next Steps

### Phase 1: Authentication Integration
- [ ] Replace demo auth with Firebase Auth
- [ ] Update existing Google/Apple sign-in to create Firestore profiles
- [ ] Migrate local user data to Firestore

### Phase 2: User Creation
- [ ] Add username selection during onboarding
- [ ] Create public user profiles
- [ ] Sync movie ratings to Firestore

### Phase 3: Social Features
- [ ] Test follow/unfollow functionality
- [ ] Implement "You May Know" recommendations
- [ ] Add public profile views

## 💰 Cost Management

### Free Tier Limits (Before Student Credits)
- **Firestore**: 50K reads, 20K writes, 20K deletes per day
- **Authentication**: Unlimited
- **Cloud Functions**: 125K invocations per month

### With $300 Student Credits
- Supports ~500K+ monthly active users
- Plenty for development and initial user growth

## 🔧 Troubleshooting

### Common Issues

**"Firebase not defined" Error:**
- Check that you've updated the config in `firebase.js`
- Make sure the project is running (`npm start`)

**"Permission denied" in Firestore:**
- Check that security rules are configured correctly
- Ensure user is authenticated before making requests

**Search not working:**
- Firebase requires exact matches for text search
- Consider adding Algolia for advanced search later

**Build errors:**
- Make sure all Firebase packages are compatible versions
- Clear node_modules and reinstall if needed

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [GitHub Student Pack](https://education.github.com/pack)
- [Firebase Pricing](https://firebase.google.com/pricing)

---

**Ready to go social! 🎬👥**