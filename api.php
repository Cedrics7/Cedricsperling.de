<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// --- Datenbankverbindung ---
// Ersetzen Sie diese Werte durch Ihre echten Zugangsdaten!
$servername = "localhost";
$username = "Linsenwaffeln";
$password = "Salzig";
$dbname = "webshop";

// Verbindung herstellen
$conn = new mysqli($servername, $username, $password, $dbname);

// Verbindung prüfen
if ($conn->connect_error) {
    // Im Fehlerfall eine saubere JSON-Fehlermeldung senden
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankverbindung fehlgeschlagen']);
    exit;
}

// --- API-Logik ---
// Wir prüfen, welche Art von Anfrage kommt (z.B. "getProducts")
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action == 'getProducts') {
    $sql = "SELECT id, name, description, price, image_url FROM products";
    $result = $conn->query($sql);

    $products = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
    }

    // Produkte als JSON zurückgeben
    header('Content-Type: application/json');
    echo json_encode($products);
}

// Später können wir hier weitere Aktionen hinzufügen, z.B. 'createOrder'

$conn->close();
?>