<?php
include "db_connect.php";
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: ../login.html");
    exit();
}

$donor_id = $_SESSION['user_id'];
$product_id = $_GET['product_id'];
$donated_to = "Needy Student";  // Default for now

$sql = "INSERT INTO donations (donor_id, product_id, donated_to) VALUES ('$donor_id', '$product_id', '$donated_to')";

if ($conn->query($sql) === TRUE) {
    echo "Donation successful!";
} else {
    echo "Error: " . $conn->error;
}
?>
