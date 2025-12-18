// Firebase Transaction Management
// Handles secure transaction operations using Cloud Functions

class FirebaseTransactions {
    constructor(functions) {
        this.functions = functions;
        this.httpsCallable = null;
        this.initializeCallable();
    }

    async initializeCallable() {
        try {
            const { httpsCallable } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js");
            this.httpsCallable = httpsCallable;
        } catch (error) {
            console.error('Failed to load httpsCallable:', error);
        }
    }

    // Create a new transaction
    async createTransaction(itemData) {
        try {
            if (!this.httpsCallable) {
                await this.initializeCallable();
            }
            
            if (!this.httpsCallable) {
                throw new Error('Firebase Functions not available');
            }

            const createTransactionFn = this.httpsCallable(this.functions, 'createTransaction');
            const result = await createTransactionFn({
                itemId: itemData.itemId,
                itemType: itemData.itemType,
                itemTitle: itemData.itemTitle,
                price: itemData.price,
                sellerId: itemData.sellerId
            });

            return result.data;
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw new Error(error.message || 'Failed to create transaction');
        }
    }

    // Approve a transaction (seller accepts)
    async approveTransaction(transactionId) {
        try {
            if (!this.httpsCallable) {
                await this.initializeCallable();
            }
            
            if (!this.httpsCallable) {
                throw new Error('Firebase Functions not available');
            }

            const approveTransactionFn = this.httpsCallable(this.functions, 'approveTransaction');
            const result = await approveTransactionFn({
                transactionId: transactionId
            });

            return result.data;
        } catch (error) {
            console.error('Error approving transaction:', error);
            throw new Error(error.message || 'Failed to approve transaction');
        }
    }

    // Verify transaction with PIN or QR
    async verifyTransaction(transactionId, verificationCode, verificationType) {
        try {
            if (!this.httpsCallable) {
                await this.initializeCallable();
            }
            
            if (!this.httpsCallable) {
                throw new Error('Firebase Functions not available');
            }

            const verifyTransactionFn = this.httpsCallable(this.functions, 'verifyTransaction');
            const result = await verifyTransactionFn({
                transactionId: transactionId,
                verificationCode: verificationCode,
                verificationType: verificationType
            });

            return result.data;
        } catch (error) {
            console.error('Error verifying transaction:', error);
            throw new Error(error.message || 'Failed to verify transaction');
        }
    }

    // Get transaction status
    async getTransactionStatus(transactionId, database) {
        try {
            const { ref, get } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js");
            const transactionRef = ref(database, `transactions/${transactionId}`);
            const snapshot = await get(transactionRef);
            
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                throw new Error('Transaction not found');
            }
        } catch (error) {
            console.error('Error getting transaction status:', error);
            throw error;
        }
    }

    // Listen to transaction updates
    listenToTransaction(transactionId, database, callback) {
        import("https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js")
            .then(({ ref, onValue }) => {
                const transactionRef = ref(database, `transactions/${transactionId}`);
                return onValue(transactionRef, (snapshot) => {
                    if (snapshot.exists()) {
                        callback(snapshot.val());
                    }
                });
            })
            .catch(console.error);
    }

    // Get user transactions with enhanced status
    async getUserTransactions(userId, database) {
        try {
            const { ref, query, orderByChild, equalTo, get } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js");
            
            const buyerQuery = query(ref(database, 'transactions'), orderByChild('buyerId'), equalTo(userId));
            const sellerQuery = query(ref(database, 'transactions'), orderByChild('sellerId'), equalTo(userId));
            
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
            return transactions.sort((a, b) => b.createdAt - a.createdAt);
        } catch (error) {
            console.error('Error getting user transactions:', error);
            throw error;
        }
    }
}

// Transaction status helpers
const TransactionStatus = {
    REQUESTED: 'requested',
    APPROVED: 'approved', 
    EXCHANGE_PENDING: 'exchange_pending',
    COMPLETED: 'completed',
    
    getStatusDisplay: (status) => {
        const statusMap = {
            'requested': { text: 'Pending Approval', color: 'yellow' },
            'approved': { text: 'Ready for Exchange', color: 'blue' },
            'exchange_pending': { text: 'Exchange in Progress', color: 'orange' },
            'completed': { text: 'Completed', color: 'green' }
        };
        return statusMap[status] || { text: 'Unknown', color: 'gray' };
    },
    
    getStatusBadge: (status) => {
        const display = TransactionStatus.getStatusDisplay(status);
        const colorClasses = {
            'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'blue': 'bg-blue-100 text-blue-800 border-blue-200',
            'orange': 'bg-orange-100 text-orange-800 border-orange-200',
            'green': 'bg-green-100 text-green-800 border-green-200',
            'gray': 'bg-gray-100 text-gray-800 border-gray-200'
        };
        
        return `<span class="px-2 py-1 text-xs font-medium rounded-full border ${colorClasses[display.color]}">${display.text}</span>`;
    }
};

// Export for use in other files
window.FirebaseTransactions = FirebaseTransactions;
window.TransactionStatus = TransactionStatus;