<?php
session_start(); // Start session
include 'db_connect.php';

// Debugging session issues
if (!isset($_SESSION['user_id'])) {
    echo "Session is not set! Redirecting to login...";
    print_r($_SESSION); // Print session data
    exit();
} 
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CampTrade - Home</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Alpine.js CDN (if needed for future dynamic interactions) -->
  <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body class="bg-gray-100">
  <!-- Navbar -->
  <nav class="bg-white shadow-md p-4 flex justify-between items-center">
    <div class="flex items-center space-x-4">
      <h1 class="text-2xl font-bold">CampTrade</h1>
      <a href="home.php" class="text-gray-600 hover:text-gray-800">Home</a>
      
      <a href="#" class="text-gray-600 hover:text-gray-800">My Listings</a>
    </div>
    <div>
      <!-- This button simulates a logout by redirecting to the login page -->
      <a href="php/logout.php" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Logout</a>
    </div>
  </nav>

  <!-- Hero Section -->
  <header class="bg-blue-500 text-white text-center py-10">
    <h2 class="text-3xl font-bold">Welcome to CampTrade</h2>
    <p class="mt-2">Your Campus Marketplace for Sustainable Peer-to-Peer Exchange</p>
    <div class="mt-4 flex justify-center">
      <input type="text" placeholder="Search for products..." class="px-4 py-2 rounded-l-lg text-black w-1/2">
      <button class="px-4 py-2 bg-blue-700 rounded-r-lg hover:bg-blue-800">Search</button>
    </div>
  </header>

  <!-- Features Section -->
  <section class="p-10 grid grid-cols-1 md:grid-cols-4 gap-6">
    <div class="bg-white p-6 rounded-lg shadow text-center">
      <h3 class="font-bold text-lg">Buy</h3>
      <p class="mt-2 text-gray-600">Find affordable second-hand products.</p>
      <a href="buy.html" class="mt-4 inline-block text-blue-600 hover:underline">Explore Buy</a>
    </div>
    <div class="bg-white p-6 rounded-lg shadow text-center">
      <h3 class="font-bold text-lg">Sell</h3>
      <p class="mt-2 text-gray-600">List your items and earn some extra cash.</p>
      <a href="sell.html" class="mt-4 inline-block text-blue-600 hover:underline">Explore Sell</a>
    </div>
    <div class="bg-white p-6 rounded-lg shadow text-center">
      <h3 class="font-bold text-lg">Rent</h3>
      <p class="mt-2 text-gray-600">Rent out items temporarily and save money.</p>
      <a href="rent.html" class="mt-4 inline-block text-blue-600 hover:underline">Explore Rent</a>
    </div>
    <div class="bg-white p-6 rounded-lg shadow text-center">
      <h3 class="font-bold text-lg">Donate</h3>
      <p class="mt-2 text-gray-600">Help your peers by donating items you no longer need.</p>
      <a href="donate.html" class="mt-4 inline-block text-blue-600 hover:underline">Explore Donate</a>
    </div>
  </section>

  <!-- AI-Based Recommendations Section -->
  <section class="p-10 bg-white">
    <h2 class="text-xl font-bold mb-4 text-center">Recommended for You</h2>
    <div id="recommendations" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Recommendations will be dynamically inserted here via JavaScript -->
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-800 text-white text-center py-4 mt-10">
    <p>&copy; 2025 CampTrade. All rights reserved.</p>
  </footer>

  <!-- JavaScript for AI-Based Recommendations (Mock Data) -->
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const recommendations = [
        { name: 'Textbooks', price: 'Rs.300'  ,imageUrl: 'tb.png'},
        { name: 'Laptop', price: 'Rs.3000' ,imageUrl:'laptop.png'},
        { name: 'Headphones', price: 'Rs.800', imageUrl:'headphones.png'}
      ];
      
      const container = document.getElementById('recommendations');
      recommendations.forEach(item => {
        const div = document.createElement('div');
        div.className = 'bg-gray-100 p-4 rounded shadow text-center';
        div.innerHTML = 
        `<img src="${item.imageUrl}" alt="${item.name}" class="w-full h-40 object-cover rounded mb-4">
        <h3 class="font-bold">${item.name}</h3><p class="mt-2 text-gray-600">${item.price}</p>`;
        container.appendChild(div);
      });
    });
  </script>
</body>
</html>
