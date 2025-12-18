# CampTrade - Transaction Verification System

A secure, hybrid PIN + QR code verification system for campus marketplace transactions.

## 🎯 Overview

CampTrade is a student marketplace application with an enhanced transaction verification system that combines the speed of QR codes with the reliability of PIN verification. This system ensures secure item exchanges between students on campus.

## ✨ Features

### 🔐 Security Features
- **Hybrid Verification**: PIN codes + QR codes for maximum flexibility
- **Single-Use Verification**: Prevents replay attacks
- **Role-Based Authorization**: Only sellers can verify transactions
- **Automatic Point System**: Rewards both buyers and sellers
- **Status Tracking**: Complete transaction lifecycle management

### 📱 User Experience
- **Mobile-Friendly**: Responsive design for all devices
- **QR Code Scanning**: Camera-based verification
- **Real-Time Updates**: Live transaction status changes
- **Fallback Support**: PIN entry when QR scanning unavailable
- **Clear Visual Feedback**: Status badges and progress indicators

## 🚀 Quick Start

### 1. Testing the System

**Option A: Debug Mode (Recommended for testing)**
```bash
# Open in browser
debug-item.html          # Test transaction creation
debug-transaction.html   # Test full system
simple-test.html        # Basic functionality test
```

**Option B: Full Application**
```bash
# Open in browser
index.html              # Main marketplace
item.html?id=X&type=Y   # Item details page
profile.html            # User profile and transactions
```

### 2. System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for Firebase
- Camera access for QR code scanning (optional)
- Firebase project with Realtime Database enabled

## 📁 Project Structure

```
CampTrade/
├── 📄 Core Pages
│   ├── index.html              # Main marketplace
│   ├── item.html               # Item details & purchase
│   ├── profile.html            # User profile & transactions
│   ├── login.html              # Authentication
│   └── signup.html             # User registration
│
├── 🔧 Verification System
│   ├── js/verification.js              # QR generation & scanning
│   ├── js/firebase-transactions.js     # Cloud Functions API
│   └── js/firebase-transactions-fallback.js  # Direct DB access
│
├── ☁️ Backend (Cloud Functions)
│   ├── functions/src/index.ts          # Secure transaction logic
│   ├── functions/package.json          # Dependencies
│   └── functions/tsconfig.json         # TypeScript config
│
├── 🧪 Testing & Debug
│   ├── debug-item.html                 # Transaction creation test
│   ├── debug-transaction.html          # Full system test
│   ├── simple-test.html               # Basic functionality
│   └── test-verification.html         # QR/PIN testing
│
├── 📚 Documentation
│   ├── README.md                      # This file
│   ├── TRANSACTION_SCHEMA.md          # Technical specifications
│   └── VERIFICATION_IMPLEMENTATION.md  # Setup guide
│
└── 🛠️ Configuration
    ├── firebase.json                  # Firebase config
    └── deploy-verification.bat        # Deployment script
```

## 🔄 Transaction Flow

```mermaid
graph TD
    A[Buyer clicks "Buy Item"] --> B[Transaction Created]
    B --> C[Status: requested]
    C --> D[Seller Approves]
    D --> E[Status: approved]
    E --> F[PIN & QR Generated]
    F --> G[In-Person Exchange]
    G --> H[Seller Verifies PIN/QR]
    H --> I[Status: completed]
    I --> J[Points Awarded]
    J --> K[Item Removed]
```

## 🛠️ Setup Instructions

### Development Setup

1. **Clone/Download** the project files
2. **Configure Firebase** in the JavaScript files:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-domain.firebaseapp.com",
     projectId: "your-project-id",
     // ... other config
   };
   ```

3. **Test the System**:
   - Open `debug-item.html` for transaction testing
   - Open `test-verification.html` for QR/PIN testing

### Production Deployment

1. **Deploy Cloud Functions** (optional, for enhanced security):
   ```bash
   cd functions
   npm install
   npm run build
   firebase deploy --only functions
   ```

2. **Update Firebase Rules**:
   ```javascript
   // Realtime Database Rules
   {
     "rules": {
       "transactions": {
         "$transactionId": {
           ".read": "auth != null && (data.child('buyerId').val() == auth.uid || data.child('sellerId').val() == auth.uid)",
           ".write": "auth != null"
         }
       },
       "users": {
         "$userId": {
           ".read": "auth != null && auth.uid == $userId",
           ".write": "auth != null && auth.uid == $userId"
         }
       }
     }
   }
   ```

3. **Deploy Hosting**:
   ```bash
   firebase deploy --only hosting
   ```

## 🧪 Testing Guide

### 1. Basic Functionality Test
```bash
# Open simple-test.html
1. Click "Login" (anonymous authentication)
2. Click "Create Transaction"
3. Check console for success/error messages
```

### 2. Full Transaction Test
```bash
# Open debug-item.html
1. Wait for system initialization
2. Click "Debug Buy This Item"
3. Check System Status and Debug Output
```

### 3. Verification System Test
```bash
# Open test-verification.html
1. Click "Generate Test QR Code"
2. Click "Test PIN Validation"
3. Click "Test QR Scanner" (requires camera)
4. Click "Verify Exchange" for demo modal
```

## 🔧 Configuration Options

### Transaction Manager Modes

**Fallback Mode (Current Default)**
```javascript
// Direct database access - works immediately
const transactionManager = new FirebaseTransactionsFallback(db);
```

**Cloud Functions Mode (Production)**
```javascript
// Enhanced security via Cloud Functions
const transactionManager = new FirebaseTransactions(functions);
```

### Verification Options

**PIN Only**
```javascript
await transactionManager.verifyTransaction(txId, "123456", "pin");
```

**QR Code Only**
```javascript
const qrData = JSON.stringify({txId, hash, timestamp});
await transactionManager.verifyTransaction(txId, qrData, "qr");
```

## 🐛 Troubleshooting

### Common Issues

**1. "Transaction manager not initialized"**
- Check browser console for JavaScript errors
- Ensure all script files are loading properly
- Try the debug pages to isolate the issue

**2. "Firebase permission denied"**
- Update Firebase Realtime Database rules
- Check user authentication status
- Verify project configuration

**3. "QR Scanner not working"**
- Ensure HTTPS connection (required for camera)
- Check camera permissions in browser
- Try different browser (Chrome/Safari recommended)

**4. "Verification code invalid"**
- Check transaction status (must be 'approved')
- Ensure code hasn't been used already
- Verify you're the seller (not buyer)

### Debug Steps

1. **Open Browser Console** (F12) and check for errors
2. **Use Debug Pages**:
   - `debug-item.html` - Test transaction creation
   - `debug-transaction.html` - Test full system
   - `simple-test.html` - Test basic functionality

3. **Check Firebase Console**:
   - Realtime Database for transaction data
   - Authentication for user status
   - Functions logs (if using Cloud Functions)

## 📊 Transaction Status Reference

| Status | Description | User Actions |
|--------|-------------|--------------|
| `requested` | Transaction created, awaiting seller approval | Seller: Approve/Reject |
| `approved` | Seller approved, verification codes generated | Buyer: View PIN/QR |
| `exchange_pending` | Verification in progress | Seller: Verify PIN/QR |
| `completed` | Transaction finished successfully | Both: View history |

## 🎯 API Reference

### FirebaseTransactionsFallback Class

```javascript
// Create transaction
const result = await transactionManager.createTransaction({
  itemId: "item123",
  itemType: "sell",
  itemTitle: "Physics Book",
  price: 500,
  sellerId: "seller456",
  buyerId: "buyer789",
  buyerEmail: "buyer@example.com"
});

// Approve transaction (seller only)
await transactionManager.approveTransaction(transactionId);

// Verify transaction
await transactionManager.verifyTransaction(transactionId, code, "pin|qr");

// Get user transactions
const transactions = await transactionManager.getUserTransactions(userId);
```

### TransactionVerification Class

```javascript
const verificationSystem = new TransactionVerification();

// Generate QR code
await verificationSystem.generateQRCode(qrData, "canvas-id");

// Start QR scanner
verificationSystem.startQRScanner(onSuccess, onError);

// Validate PIN
const isValid = verificationSystem.validatePIN("123456");

// Create verification UI
const ui = verificationSystem.createVerificationUI(txId, qrData, onVerify);
```

## 🔒 Security Considerations

### Current Security Features
- ✅ Single-use verification codes
- ✅ Role-based transaction permissions
- ✅ Status validation at each step
- ✅ Automatic cleanup after completion

### Production Recommendations
- 🔄 Deploy Cloud Functions for server-side validation
- 🔄 Implement rate limiting for transaction creation
- 🔄 Add transaction timeout mechanisms
- 🔄 Enable audit logging for all transactions

## 📈 Performance & Scalability

### Current Implementation
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **Functions**: Optional Cloud Functions
- **Frontend**: Vanilla JavaScript (no framework dependencies)

### Optimization Tips
- Use Firebase indexes for transaction queries
- Implement pagination for transaction history
- Cache QR codes to reduce generation overhead
- Use Firebase offline persistence for mobile users

## 🤝 Contributing

### Development Workflow
1. Test changes using debug pages
2. Update documentation if needed
3. Ensure all test cases pass
4. Deploy to staging environment first

### Code Style
- Use modern JavaScript (ES6+)
- Follow Firebase best practices
- Include error handling for all async operations
- Add console logging for debugging

## 📞 Support

### Getting Help
1. **Check Documentation**: Review `TRANSACTION_SCHEMA.md` and `VERIFICATION_IMPLEMENTATION.md`
2. **Use Debug Tools**: Test with provided debug pages
3. **Check Console**: Look for JavaScript errors in browser console
4. **Firebase Console**: Check database and authentication status

### Common Solutions
- **Clear browser cache** if experiencing loading issues
- **Check Firebase project settings** for configuration problems
- **Update browser** for QR scanning compatibility
- **Enable camera permissions** for QR code scanning

---

## 📄 License

This project is part of CampTrade - A student marketplace application.

**Built with ❤️ for campus communities**

*Making peer-to-peer transactions safer and easier for students everywhere.*