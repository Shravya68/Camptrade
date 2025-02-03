<?php
include "db_connect.php";
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: ../login.html");
    exit();
}

$buyer_id = $_SESSION['user_id'];
$product_id = $_GET['product_id'];

$sql = "INSERT INTO orders (buyer_id, product_id, amount) 
        SELECT '$buyer_id', product_id, price FROM products WHERE product_id='$product_id'";

if ($conn->query($sql) === TRUE) {
    echo "Purchase successful!";
} else {
    echo "Error: " . $conn->error;
}
?>
