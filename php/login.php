<?php
session_start(); // Start session to maintain login state

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'db_connect.php'; // Ensure this connects properly

$response = [];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $loginIdentifier = $_POST['loginIdentifier'] ?? ''; // Can be email or user_id
    $password = $_POST['password_hash'] ?? '';

    if (empty($loginIdentifier) || empty($password)) {
        echo json_encode(["success" => false, "message" => "Missing fields."]);
        exit;
    }

    // Check if user exists
    $stmt = $conn->prepare("SELECT user_id, email, password_hash FROM users WHERE email = ? OR user_id = ?");
    $stmt->bind_param("ss", $loginIdentifier, $loginIdentifier);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        if (password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['user_id']; // Store session variable
            echo json_encode(["success" => true, "message" => "Login successful!"]);
        } else {
            echo json_encode(["success" => false, "message" => "Incorrect password."]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "User not found."]);
    }
}
?>
