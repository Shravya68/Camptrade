// Firebase Transaction Management - Fallback Version
// This version works without Cloud Functions for testing

class FirebaseTransactionsFallback {
    constructor(database) {
        this.database = database;
    }

    // Generate secure 6-digit PIN
    generateSecurePin() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Generate verification hash
    generateVerificationHash(transactionId, pin) {
        // Simple hash for fallback (in production, use server-side hashing)
        const data = `${transactionId}:${pin}:${Date.now()}`;
        return btoa(data).substring(0, 16);
    }

    // Create a new transaction (fallback version)
    async createTransaction(itemData) {
        try {
            const { ref, push, set, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js");
            
            const transactionRef = ref(this.database, 'transactions');
            const newTransactionRef = push(transactionRef);
            const transactionId = newTransactionRef.key;
            
            const verificationPin = this.generateSecurePin();
            const verificationHash = this.generateVerificationHash(transactionId, verificationPin);
            
            // QR code contains transaction data
            const qrCodeData = JSON.stringify({
                txId: transactionId,
                hash: verificationHash,
                timestamp: Date.now()
            });

            const transactionData = {
                itemId: itemData.itemId,
                itemType: itemData.itemType,
                itemTitle: itemData.itemTitle,
                price: itemData.price || 0,
                sellerId: itemData.sellerId,
                buyerId: itemData.buyerId,
                buyerEmail: itemData.buyerEmail,
                status: 'requested',
                verificationPin: verificationPin,
                verificationHash: verificationHash,
                qrCodeData: qrCodeData,
                createdAt: serverTimestamp(),
                isVerificationUsed: false
            };

            await set(newTransactionRef, transactionData);
            
            return {
                success: true,
                transactionId: transactionId,
                verificationPin: verificationPin,
                qrCodeData: qrCodeData
            };
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw new Error(error.message || 'Failed to create transaction');
        }
    }

    // Approve a transaction (seller accepts)
    async approveTransaction(transactionId) {
        try {
            const { ref, get, update, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js");
            
            const transactionRef = ref(this.database, `transactions/${transactionId}`);
            const snapshot = await get(transactionRef);
            
            if (!snapshot.exists()) {
                throw new Error('Transaction not found');
            }

            const transaction = snapshot.val();
            
            if (transaction.status !== 'requested') {
                throw new Error('Transaction cannot be approved');
            }

            await update(transactionRef, {
                status: 'approved',
                approvedAt: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('Error approving transaction:', error);
            throw new Error(error.message || 'Failed to approve transaction');
        }
    }

    // Verify transaction with PIN or QR
    async verifyTransaction(transactionId, verificationCode, verificationType) {
        try {
            const { ref, get, update, remove, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js");
            
            const transactionRef = ref(this.database, `transactions/${transactionId}`);
            const snapshot = await get(transactionRef);
            
            if (!snapshot.exists()) {
                throw new Error('Transaction not found');
            }

            const transaction = snapshot.val();
            
            // Security checks
            if (transaction.status !== 'approved' && transaction.status !== 'exchange_pending') {
                throw new Error('Transaction not ready for verification');
            }

            if (transaction.isVerificationUsed) {
                throw new Error('Verification code already used');
            }

            // Verify based on type
            let isValid = false;
            
            if (verificationType === 'pin') {
                isValid = transaction.verificationPin === verificationCode;
            } else if (verificationType === 'qr') {
                try {
                    const qrData = JSON.parse(verificationCode);
                    const expectedHash = transaction.verificationHash;
                    isValid = qrData.txId === transactionId && qrData.hash === expectedHash;
                } catch {
                    isValid = false;
                }
            }

            if (!isValid) {
                throw new Error('Invalid verification code');
            }

            // Update transaction status
            await update(transactionRef, {
                status: 'completed',
                completedAt: serverTimestamp(),
                isVerificationUsed: true
            });

            // Award points to both users
            const buyerRef = ref(this.database, `users/${transaction.buyerId}/rewardPoints`);
            const sellerRef = ref(this.database, `users/${transaction.sellerId}/rewardPoints`);
            
            const [buyerSnapshot, sellerSnapshot] = await Promise.all([
                get(buyerRef),
                get(sellerRef)
            ]);

            const buyerPoints = (buyerSnapshot.val() || 0) + 10;
            const sellerPoints = (sellerSnapshot.val() || 0) + 15;

            await Promise.all([
                update(ref(this.database, `users/${transaction.buyerId}`), { rewardPoints: buyerPoints }),
                update(ref(this.database, `users/${transaction.sellerId}`), { rewardPoints: sellerPoints })
            ]);

            // Remove item from listings
            const itemPath = transaction.itemType === 'sell' ? 'items' : 
                            transaction.itemType === 'rent' ? 'rent-items' : 'donation-items';
            await remove(ref(this.database, `${itemPath}/${transaction.itemId}`));

            return {
                success: true,
                buyerPointsAwarded: 10,
                sellerPointsAwarded: 15
            };
        } catch (error) {
            console.error('Error verifying transaction:', error);
            throw new Error(error.message || 'Failed to verify transaction');
        }
    }

    // Get user transactions with enhanced status
    async getUserTransactions(userId) {
        try {
            const { ref, query, orderByChild, equalTo, get } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js");
            
            const buyerQuery = query(ref(this.database, 'transactions'), orderByChild('buyerId'), equalTo(userId));
            const sellerQuery = query(ref(this.database, 'transactions'), orderByChild('sellerId'), equalTo(userId));
            
            const [buyerSnapshot, sellerSnapshot] = await Promise.all([
                get(buyerQuery),
                get(sellerQuery)
            ]);

            const transactions = [];
            
            if (buyerSnapshot.exists()) {
                buyerSnapshot.forEach(child => {
                    transactions.push({
                        id: child.key,
                        ...child.val(),
                        userRole: 'buyer'
                    });
                });
            }
            
            if (sellerSnapshot.exists()) {
                sellerSnapshot.forEach(child => {
                    transactions.push({
                        id: child.key,
                        ...child.val(),
                        userRole: 'seller'
                    });
                });
            }

            // Sort by creation date (newest first)
            return transactions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } catch (error) {
            console.error('Error getting user transactions:', error);
            throw error;
        }
    }
}

// Export for use in other files
window.FirebaseTransactionsFallback = FirebaseTransactionsFallback;