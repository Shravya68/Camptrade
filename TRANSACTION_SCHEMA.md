# CampTrade Transaction Verification System

## Overview

This document outlines the enhanced transaction verification system for CampTrade, implementing a hybrid PIN + QR code approach for secure item exchanges.

## Why This Approach?

### Hybrid PIN + QR Code System Benefits:

1. **Security**: 
   - SHA-256 hashed verification codes
   - Single-use verification prevents replay attacks
   - Server-side validation with Cloud Functions

2. **User Experience**:
   - QR codes for quick scanning (tech-savvy users)
   - PIN fallback for users without QR scanners
   - Clear visual feedback and status tracking

3. **Campus Environment Suitability**:
   - Works offline (PIN) and online (QR verification)
   - Fast verification during busy campus exchanges
   - Familiar to students (QR codes are common)

## Firestore Schema

### Transactions Collection (`/transactions/{transactionId}`)

```javascript
{
  // Basic transaction info
  itemId: "string",              // Reference to item being traded
  itemType: "sell|rent|donate",  // Type of transaction
  itemTitle: "string",           // Item title for display
  price: number,                 // Transaction amount (0 for donations)
  
  // User information
  sellerId: "string",            // Seller's user ID
  buyerId: "string",             // Buyer's user ID  
  buyerEmail: "string",          // Buyer's email for display
  
  // Transaction status workflow
  status: "requested|approved|exchange_pending|completed",
  
  // Verification system
  verificationPin: "string",     // 6-digit PIN (visible to buyer)
  verificationHash: "string",    // SHA-256 hash for security
  qrCodeData: "string",          // JSON string for QR code
  isVerificationUsed: boolean,   // Prevents reuse
  
  // Timestamps
  createdAt: number,             // Transaction creation
  approvedAt: number,            // When seller approved (optional)
  completedAt: number            // When verification completed (optional)
}
```

### Transaction Status Flow

```
requested → approved → exchange_pending → completed
    ↓           ↓            ↓              ↓
 Seller    Buyer gets   Verification   Points awarded
approves   PIN & QR     in progress    Item removed
```

### Users Collection Enhancement (`/users/{userId}`)

```javascript
{
  name: "string",
  email: "string", 
  rewardPoints: number,          // Enhanced point system
  // ... existing fields
}
```

## API Functions (Cloud Functions)

### 1. `createTransaction`

**Purpose**: Securely create a new transaction with verification codes

**Input**:
```javascript
{
  itemId: "string",
  itemType: "sell|rent|donate", 
  itemTitle: "string",
  price: number,
  sellerId: "string"
}
```

**Output**:
```javascript
{
  success: true,
  transactionId: "string",
  verificationPin: "string",    // 6-digit PIN
  qrCodeData: "string"          // JSON for QR generation
}
```

**Security Features**:
- Validates user authentication
- Prevents self-transactions
- Generates cryptographically secure PIN
- Creates tamper-proof hash

### 2. `approveTransaction`

**Purpose**: Seller approves the transaction request

**Input**:
```javascript
{
  transactionId: "string"
}
```

**Security Features**:
- Only seller can approve
- Validates transaction status
- Updates status to 'approved'

### 3. `verifyTransaction`

**Purpose**: Verify PIN or QR code during exchange

**Input**:
```javascript
{
  transactionId: "string",
  verificationCode: "string",   // PIN or QR data
  verificationType: "pin|qr"
}
```

**Output**:
```javascript
{
  success: true,
  buyerPointsAwarded: 10,
  sellerPointsAwarded: 15
}
```

**Security Features**:
- Only seller can verify
- Single-use verification
- Validates transaction status
- Awards points automatically
- Removes item from listings

## Frontend Components

### 1. TransactionVerification Class (`js/verification.js`)

**Features**:
- QR code generation using qrcode.js
- QR code scanning using qr-scanner.js  
- PIN validation
- Unified verification UI

**Key Methods**:
```javascript
generateQRCode(qrData, containerId)     // Generate QR display
startQRScanner(onSuccess, onError)      // Camera-based scanning
createVerificationUI(txId, qrData, onVerify) // Complete UI
validatePIN(pin)                        // PIN format validation
```

### 2. FirebaseTransactions Class (`js/firebase-transactions.js`)

**Features**:
- Cloud Function integration
- Transaction status management
- Real-time updates
- Error handling

**Key Methods**:
```javascript
createTransaction(itemData)             // Create new transaction
approveTransaction(transactionId)       // Seller approval
verifyTransaction(txId, code, type)     // Verification
getUserTransactions(userId, db)         // Get user's transactions
```

## Security Measures

### 1. Authentication & Authorization
- Firebase Authentication required for all operations
- User ID validation on all transactions
- Role-based permissions (buyer vs seller actions)

### 2. Verification Security
- SHA-256 hashing prevents code prediction
- Single-use verification prevents replay attacks
- Server-side validation prevents client manipulation
- Timestamp validation prevents old code reuse

### 3. Data Integrity
- Cloud Functions ensure consistent state updates
- Atomic operations for point awards and item removal
- Transaction status validation at each step

## Usage Examples

### Creating a Transaction (Buyer)
```javascript
const result = await transactionManager.createTransaction({
  itemId: "item123",
  itemType: "sell", 
  itemTitle: "Physics Textbook",
  price: 500,
  sellerId: "seller456"
});

console.log("PIN:", result.verificationPin);
console.log("QR Data:", result.qrCodeData);
```

### Approving Transaction (Seller)
```javascript
await transactionManager.approveTransaction("tx789");
```

### Verifying with PIN (Seller)
```javascript
await transactionManager.verifyTransaction("tx789", "123456", "pin");
```

### Verifying with QR (Seller)
```javascript
const qrResult = await scanQRCode(); // From camera
await transactionManager.verifyTransaction("tx789", qrResult, "qr");
```

## Error Handling

### Common Error Scenarios:
- **Invalid verification code**: User-friendly error message
- **Transaction not found**: Redirect to profile
- **Unauthorized access**: Authentication prompt
- **Already verified**: Prevent double verification
- **Network errors**: Retry mechanism with user feedback

### Error Response Format:
```javascript
{
  error: true,
  code: "invalid-argument|permission-denied|not-found",
  message: "User-friendly error description"
}
```

## Testing Checklist

### Security Tests:
- [ ] Cannot verify own transaction as buyer
- [ ] Cannot reuse verification codes
- [ ] Cannot verify with wrong PIN/QR
- [ ] Cannot approve transaction twice
- [ ] Cannot verify without approval

### User Experience Tests:
- [ ] QR code generates correctly
- [ ] QR scanner works on mobile
- [ ] PIN validation works
- [ ] Status updates in real-time
- [ ] Points awarded correctly
- [ ] Item removed after completion

### Edge Cases:
- [ ] Network disconnection during verification
- [ ] Multiple simultaneous verifications
- [ ] Invalid QR code format
- [ ] Camera permission denied
- [ ] Transaction deleted during process

## Deployment Notes

1. **Cloud Functions**: Deploy with `firebase deploy --only functions`
2. **Frontend**: Ensure QR libraries load before use
3. **Security Rules**: Update Firestore rules for new schema
4. **Testing**: Use Firebase emulators for development

This system provides a robust, secure, and user-friendly transaction verification process suitable for a campus marketplace environment.