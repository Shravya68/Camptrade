<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json"); // Ensure response is JSON

include 'db_connect.php'; // Ensure this file is included for database connection

$response = []; // Response array

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $full_name = $_POST['full_name'] ?? ''; 
    $email = $_POST['email'] ?? '';
    $user_id = $_POST['user_id'] ?? '';
    $password = password_hash($_POST['password_hash'] ?? '', PASSWORD_DEFAULT);
    $mobile = $_POST['mobile'] ?? '';
    $university = $_POST['university'] ?? '';
    $roll_no = $_POST['roll_no'] ?? '';
    $year_of_study = $_POST['year_of_study'] ?? '';
    $department = $_POST['department'] ?? '';

    // Check if user already exists
    $checkUser = $conn->prepare("SELECT * FROM users WHERE email = ? OR user_id = ?");
    $checkUser->bind_param("ss", $email, $user_id);
    $checkUser->execute();
    $result = $checkUser->get_result();

    if ($result->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "User already exists!"]);
        exit;
    } else {
        // Insert new user
        $stmt = $conn->prepare("INSERT INTO users (full_name, email, user_id, password_hash, mobile, university, roll_no, year_of_study, department, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->bind_param("sssssssss", $full_name, $email, $user_id, $password, $mobile, $university, $roll_no, $year_of_study, $department);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Signup successful!"]);
        } else {
            echo json_encode(["success" => false, "message" => "Database error: " . $stmt->error]);
        }
    }
}
?>
