<?php
include "db_connect.php";
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: ../login.html");
    exit();
}

$renter_id = $_SESSION['user_id'];
$product_id = $_GET['product_id'];
$rent_start = date("Y-m-d");
$rent_end = date("Y-m-d", strtotime("+7 days")); // Default 7-day rent

$sql = "INSERT INTO rentals (renter_id, product_id, rent_start, rent_end, total_price) 
        SELECT '$renter_id', product_id, rent_price_per_day * 7 FROM products WHERE product_id='$product_id'";

if ($conn->query($sql) === TRUE) {
    echo "Rented successfully!";
} else {
    echo "Error: " . $conn->error;
}
?>
