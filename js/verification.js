// Transaction Verification System
// Handles both PIN and QR code verification

class TransactionVerification {
    constructor() {
        this.qrCodeLib = null;
        this.qrScannerLib = null;
        this.loadQRLibraries();
    }

    // Load QR code libraries dynamically
    async loadQRLibraries() {
        try {
            // Load QR code generation library
            const qrScript = document.createElement('script');
            qrScript.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
            document.head.appendChild(qrScript);
            
            // Load QR code scanning library
            const scannerScript = document.createElement('script');
            scannerScript.src = 'https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner.umd.min.js';
            document.head.appendChild(scannerScript);
            
            // Wait for libraries to load
            await new Promise((resolve) => {
                let loadedCount = 0;
                const checkLoaded = () => {
                    loadedCount++;
                    if (loadedCount === 2) resolve();
                };
                qrScript.onload = checkLoaded;
                scannerScript.onload = checkLoaded;
            });
            
            this.qrCodeLib = window.QRCode;
            this.qrScannerLib = window.QrScanner;
        } catch (error) {
            console.error('Failed to load QR libraries:', error);
        }
    }

    // Generate QR code for transaction
    async generateQRCode(qrData, containerId) {
        if (!this.qrCodeLib) {
            throw new Error('QR Code library not loaded');
        }

        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error('QR container not found');
        }

        // Clear previous QR code
        container.innerHTML = '';

        try {
            await this.qrCodeLib.toCanvas(container, qrData, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw error;
        }
    }

    // Create QR scanner modal
    createQRScannerModal() {
        const modal = document.createElement('div');
        modal.id = 'qr-scanner-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Scan QR Code</h3>
                    <button id="close-scanner" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div id="qr-video-container" class="relative">
                    <video id="qr-video" class="w-full rounded-lg"></video>
                    <div class="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                        <div class="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                        <div class="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                        <div class="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                        <div class="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mt-2 text-center">Position the QR code within the frame</p>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }

    // Start QR code scanning
    async startQRScanner(onScanSuccess, onScanError) {
        if (!this.qrScannerLib) {
            throw new Error('QR Scanner library not loaded');
        }

        const modal = this.createQRScannerModal();
        const video = document.getElementById('qr-video');
        const closeBtn = document.getElementById('close-scanner');
        
        let scanner = null;

        try {
            scanner = new this.qrScannerLib(video, (result) => {
                scanner.stop();
                modal.remove();
                onScanSuccess(result.data);
            });

            await scanner.start();

            closeBtn.addEventListener('click', () => {
                scanner.stop();
                modal.remove();
            });

            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    scanner.stop();
                    modal.remove();
                }
            });

        } catch (error) {
            modal.remove();
            onScanError(error);
        }
    }

    // Validate PIN format
    validatePIN(pin) {
        return /^\d{6}$/.test(pin);
    }

    // Create verification UI
    createVerificationUI(transactionId, qrData, onVerify) {
        const container = document.createElement('div');
        container.className = 'bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto';
        container.innerHTML = `
            <h3 class="text-xl font-semibold mb-4 text-center">Transaction Verification</h3>
            
            <!-- PIN Verification -->
            <div class="mb-6">
                <h4 class="font-medium mb-2">Option 1: Enter PIN</h4>
                <div class="flex gap-2">
                    <input type="text" id="pin-input" placeholder="Enter 6-digit PIN" 
                           class="flex-1 px-3 py-2 border rounded-md" maxlength="6">
                    <button id="verify-pin" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                        Verify PIN
                    </button>
                </div>
            </div>

            <div class="text-center text-gray-500 mb-6">OR</div>

            <!-- QR Code Display/Scan -->
            <div class="mb-6">
                <h4 class="font-medium mb-2">Option 2: QR Code</h4>
                <div class="text-center">
                    <button id="scan-qr" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 mb-2">
                        Scan QR Code
                    </button>
                    <div id="qr-display" class="border rounded-lg p-4 bg-gray-50">
                        <canvas id="qr-canvas"></canvas>
                    </div>
                </div>
            </div>

            <div id="verification-status" class="text-center"></div>
        `;

        // Add event listeners
        const pinInput = container.querySelector('#pin-input');
        const verifyPinBtn = container.querySelector('#verify-pin');
        const scanQRBtn = container.querySelector('#scan-qr');
        const statusDiv = container.querySelector('#verification-status');

        // PIN verification
        verifyPinBtn.addEventListener('click', () => {
            const pin = pinInput.value.trim();
            if (!this.validatePIN(pin)) {
                this.showStatus(statusDiv, 'Please enter a valid 6-digit PIN', 'error');
                return;
            }
            onVerify(transactionId, pin, 'pin');
        });

        // QR scanning
        scanQRBtn.addEventListener('click', () => {
            this.startQRScanner(
                (qrResult) => {
                    onVerify(transactionId, qrResult, 'qr');
                },
                (error) => {
                    this.showStatus(statusDiv, 'Failed to scan QR code: ' + error.message, 'error');
                }
            );
        });

        // Generate QR code for display
        if (qrData) {
            setTimeout(() => {
                this.generateQRCode(qrData, 'qr-canvas').catch(console.error);
            }, 100);
        }

        return container;
    }

    // Show status message
    showStatus(container, message, type = 'info') {
        const colors = {
            success: 'text-green-600 bg-green-50 border-green-200',
            error: 'text-red-600 bg-red-50 border-red-200',
            info: 'text-blue-600 bg-blue-50 border-blue-200'
        };

        container.innerHTML = `
            <div class="p-3 rounded-md border ${colors[type]}">
                ${message}
            </div>
        `;
    }
}

// Export for use in other files
window.TransactionVerification = TransactionVerification;