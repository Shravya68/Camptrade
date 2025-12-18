@echo off
echo ========================================
echo CampTrade Verification System Deployment
echo ========================================
echo.

echo Step 1: Installing Cloud Function dependencies...
cd functions
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo Step 2: Building TypeScript...
cd functions
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build TypeScript
    pause
    exit /b 1
)
cd ..

echo.
echo Step 3: Deploying Cloud Functions...
call firebase deploy --only functions
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy functions
    pause
    exit /b 1
)

echo.
echo Step 4: Deploying hosting (optional)...
set /p deploy_hosting="Deploy hosting as well? (y/n): "
if /i "%deploy_hosting%"=="y" (
    call firebase deploy --only hosting
    if %errorlevel% neq 0 (
        echo ERROR: Failed to deploy hosting
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Deployment completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Update Firestore security rules (see VERIFICATION_IMPLEMENTATION.md)
echo 2. Test the system using test-verification.html
echo 3. Check Firebase console for function logs
echo.
echo Files to review:
echo - TRANSACTION_SCHEMA.md (technical documentation)
echo - VERIFICATION_IMPLEMENTATION.md (setup guide)
echo - test-verification.html (testing interface)
echo.
pause