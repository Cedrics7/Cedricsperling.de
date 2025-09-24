<?php
// =========== Grundkonfiguration ===========
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start(); // Startet die Session für Nutzer-Login

// =========== Datenbankverbindung ===========
$servername = "localhost";
$username = "Linsenwaffeln";
$password = "Salzig";
$dbname = "webshop";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankverbindung fehlgeschlagen']);
    exit;
}

// =========== API-Router ===========
$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];
header('Content-Type: application/json');

// Je nach Aktion die passende Funktion aufrufen
switch ($action) {
    case 'getProducts':
        handleGetProducts($conn);
        break;
    case 'register':
        if ($method == 'POST') handleRegister($conn);
        break;
    case 'login':
        if ($method == 'POST') handleLogin($conn);
        break;
    case 'logout':
        handleLogout();
        break;
    case 'getCart':
        if (isUserLoggedIn()) handleGetCart($conn);
        break;
    case 'addToCart':
        if ($method == 'POST' && isUserLoggedIn()) handleAddToCart($conn);
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Aktion nicht gefunden']);
        break;
}

// =========== Hilfsfunktionen ===========
function isUserLoggedIn() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401); // Unauthorized
        echo json_encode(['error' => 'Benutzer nicht angemeldet']);
        return false;
    }
    return true;
}

// =========== API-Funktionen ===========
function handleGetProducts($conn) {
    $sql = "SELECT id, name, description, price, image_url FROM products";
    $result = $conn->query($sql);
    $products = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
    }
    echo json_encode($products);
}

function handleRegister($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'E-Mail und Passwort sind erforderlich.']);
        return;
    }

    // Passwort sicher hashen
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");
    $stmt->bind_param("ss", $email, $password_hash);

    if ($stmt->execute()) {
        echo json_encode(['success' => 'Benutzer erfolgreich registriert.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Fehler bei der Registrierung.']);
    }
    $stmt->close();
}

function handleLogin($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    $stmt = $conn->prepare("SELECT id, password_hash FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($user = $result->fetch_assoc()) {
        if (password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $email;
            echo json_encode(['success' => 'Login erfolgreich.', 'user_email' => $email]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Falsches Passwort.']);
        }
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Benutzer nicht gefunden.']);
    }
    $stmt->close();
}

function handleLogout() {
    session_destroy();
    echo json_encode(['success' => 'Logout erfolgreich.']);
}

function handleAddToCart($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $productId = $data['productId'] ?? 0;
    $userId = $_SESSION['user_id'];

    if ($productId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültige Produkt-ID.']);
        return;
    }
    // Prüfen, ob das Produkt bereits im Warenkorb ist
    $stmt = $conn->prepare("SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?");
    $stmt->bind_param("ii", $userId, $productId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($item = $result->fetch_assoc()) {
        // Produkt ist bereits da -> Menge erhöhen
        $newQuantity = $item['quantity'] + 1;
        $updateStmt = $conn->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?");
        $updateStmt->bind_param("ii", $newQuantity, $item['id']);
        $updateStmt->execute();
    } else {
        // Produkt neu hinzufügen
        $insertStmt = $conn->prepare("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1)");
        $insertStmt->bind_param("ii", $userId, $productId);
        $insertStmt->execute();
    }

    echo json_encode(['success' => 'Produkt zum Warenkorb hinzugefügt.']);
}

function handleGetCart($conn) {
    $userId = $_SESSION['user_id'];
    $sql = "SELECT p.id, p.name, p.price, p.image_url, ci.quantity
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $cartItems = [];
    while($row = $result->fetch_assoc()) {
        $cartItems[] = $row;
    }
    echo json_encode($cartItems);
}

$conn->close();
?>