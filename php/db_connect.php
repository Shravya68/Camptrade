<?php
$servername = "127.0.0.1"; // or "localhost"
$username = "root"; // default MySQL user in XAMPP
$password = ""; // default password for root in XAMPP is empty
$dbname = "camptrade"; // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
