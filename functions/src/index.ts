import {setGlobalOptions} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import {getAuth} from "firebase-admin/auth";
import {initializeApp} from "firebase-admin/app";
import * as logger from "firebase-functions/logger";
import * as crypto from "crypto";

setGlobalOptions({ maxInstances: 10 });

// Initialize Firebase Admin
initializeApp();

interface VerificationData {
  transactionId: string;
  verificationCode: string;
}

interface TransactionData {
  itemId: string;
  itemType: string;
  itemTitle: string;
  price: number;
  sellerId: string;
  buyerId: string;
  buyerEmail: string;
  status: 'requested' | 'approved' | 'exchange_pending' | 'completed';
  verificationPin: string;
  verificationHash: string;
  qrCodeData: string;
  createdAt: number;
  approvedAt?: number;
  completedAt?: number;
  isVerificationUsed: boolean;
}

// Generate secure 6-digit PIN
function generateSecurePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate secure hash for verification
function generateVerificationHash(transactionId: string, pin: string): string {
  return crypto.createHash('sha256')
    .update(`${transactionId}:${pin}:${Date.now()}`)
    .digest('hex');
}

// Create transaction with enhanced security
export const createTransaction = onCall(async (request) => {
  const {auth, data} = request;
  
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {itemId, itemType, itemTitle, price, sellerId} = data;
  
  if (!itemId || !itemType || !sellerId) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  if (auth.uid === sellerId) {
    throw new HttpsError('permission-denied', 'Cannot buy your own item');
  }

  try {
    const db = getDatabase();
    const transactionRef = db.ref('transactions').push();
    const transactionId = transactionRef.key!;
    
    const verificationPin = generateSecurePin();
    const verificationHash = generateVerificationHash(transactionId, verificationPin);
    
    // QR code contains encrypted transaction data
    const qrCodeData = JSON.stringify({
      txId: transactionId,
      hash: verificationHash.substring(0, 16), // First 16 chars for QR
      timestamp: Date.now()
    });

    const transactionData: TransactionData = {
      itemId,
      itemType,
      itemTitle,
      price: price || 0,
      sellerId,
      buyerId: auth.uid,
      buyerEmail: auth.token.email || '',
      status: 'requested',
      verificationPin,
      verificationHash,
      qrCodeData,
      createdAt: Date.now(),
      isVerificationUsed: false
    };

    await transactionRef.set(transactionData);
    
    logger.info(`Transaction created: ${transactionId}`);
    
    return {
      success: true,
      transactionId,
      verificationPin,
      qrCodeData
    };
  } catch (error) {
    logger.error('Error creating transaction:', error);
    throw new HttpsError('internal', 'Failed to create transaction');
  }
});

// Approve transaction (seller accepts the request)
export const approveTransaction = onCall(async (request) => {
  const {auth, data} = request;
  
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {transactionId} = data;
  
  try {
    const db = getDatabase();
    const transactionRef = db.ref(`transactions/${transactionId}`);
    const snapshot = await transactionRef.once('value');
    
    if (!snapshot.exists()) {
      throw new HttpsError('not-found', 'Transaction not found');
    }

    const transaction = snapshot.val() as TransactionData;
    
    if (transaction.sellerId !== auth.uid) {
      throw new HttpsError('permission-denied', 'Only seller can approve transaction');
    }

    if (transaction.status !== 'requested') {
      throw new HttpsError('failed-precondition', 'Transaction cannot be approved');
    }

    await transactionRef.update({
      status: 'approved',
      approvedAt: Date.now()
    });

    return {success: true};
  } catch (error) {
    logger.error('Error approving transaction:', error);
    throw new HttpsError('internal', 'Failed to approve transaction');
  }
});

// Verify transaction during exchange
export const verifyTransaction = onCall(async (request) => {
  const {auth, data} = request;
  
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {transactionId, verificationCode, verificationType} = data as {
    transactionId: string;
    verificationCode: string;
    verificationType: 'pin' | 'qr';
  };

  try {
    const db = getDatabase();
    const transactionRef = db.ref(`transactions/${transactionId}`);
    const snapshot = await transactionRef.once('value');
    
    if (!snapshot.exists()) {
      throw new HttpsError('not-found', 'Transaction not found');
    }

    const transaction = snapshot.val() as TransactionData;
    
    // Security checks
    if (transaction.sellerId !== auth.uid) {
      throw new HttpsError('permission-denied', 'Only seller can verify transaction');
    }

    if (transaction.status !== 'approved' && transaction.status !== 'exchange_pending') {
      throw new HttpsError('failed-precondition', 'Transaction not ready for verification');
    }

    if (transaction.isVerificationUsed) {
      throw new HttpsError('failed-precondition', 'Verification code already used');
    }

    // Verify based on type
    let isValid = false;
    
    if (verificationType === 'pin') {
      isValid = transaction.verificationPin === verificationCode;
    } else if (verificationType === 'qr') {
      try {
        const qrData = JSON.parse(verificationCode);
        const expectedHash = transaction.verificationHash.substring(0, 16);
        isValid = qrData.txId === transactionId && qrData.hash === expectedHash;
      } catch {
        isValid = false;
      }
    }

    if (!isValid) {
      throw new HttpsError('invalid-argument', 'Invalid verification code');
    }

    // Update transaction status
    await transactionRef.update({
      status: 'completed',
      completedAt: Date.now(),
      isVerificationUsed: true
    });

    // Award points to both users
    const buyerRef = db.ref(`users/${transaction.buyerId}/rewardPoints`);
    const sellerRef = db.ref(`users/${transaction.sellerId}/rewardPoints`);
    
    const [buyerSnapshot, sellerSnapshot] = await Promise.all([
      buyerRef.once('value'),
      sellerRef.once('value')
    ]);

    const buyerPoints = (buyerSnapshot.val() || 0) + 10;
    const sellerPoints = (sellerSnapshot.val() || 0) + 15;

    await Promise.all([
      buyerRef.set(buyerPoints),
      sellerRef.set(sellerPoints)
    ]);

    // Remove item from listings
    const itemPath = transaction.itemType === 'sell' ? 'items' : 
                    transaction.itemType === 'rent' ? 'rent-items' : 'donation-items';
    await db.ref(`${itemPath}/${transaction.itemId}`).remove();

    logger.info(`Transaction verified and completed: ${transactionId}`);
    
    return {
      success: true,
      buyerPointsAwarded: 10,
      sellerPointsAwarded: 15
    };
  } catch (error) {
    logger.error('Error verifying transaction:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to verify transaction');
  }
});
