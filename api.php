<?php
// api.php - FINALE KORRIGIERTE VERSION V3
ini_set('display_errors', 0); // Fehler nicht direkt ausgeben
error_reporting(E_ALL);
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Setzt den Header sofort, um sicherzustellen, dass die Antwort als JSON interpretiert wird.
header('Content-Type: application/json');

// PHPMailer und Konfiguration für Bestell-E-Mails einbinden
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';
require 'config.php';

// --- Datenbankverbindung ---
$servername = "localhost";
$username = "Linsenwaffeln";
$password = "Salzig";
$dbname = "webshop";
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'DB-Verbindung fehlgeschlagen: ' . $conn->connect_error]);
    exit;
}
$conn->set_charset("utf8mb4");

// --- API-Router (ruft die Funktionen unten auf) ---
$action = $_REQUEST['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Haupt-Try-Catch-Block, um alle Fehler abzufangen und als JSON zurückzugeben
try {
    switch ($action) {
        case 'getProducts': handleGetProducts($conn); break;
        case 'register': if ($method == 'POST') handleRegister($conn); break;
        case 'login': if ($method == 'POST') handleLogin($conn); break;
        case 'logout': handleLogout(); break;
        case 'getUserProfile': if ($method == 'GET') handleGetUserProfile($conn); break;
        case 'updateUserProfile': if ($method == 'POST') handleUpdateUserProfile($conn); break;
        case 'getCart': handleGetCart($conn); break;
        case 'addToCart': if ($method == 'POST') handleAddToCart($conn); break;
        case 'updateCart': if ($method == 'POST') handleUpdateCart($conn); break;
        case 'removeFromCart': if ($method == 'POST') handleRemoveFromCart($conn); break;
        case 'placeOrder': if ($method == 'POST') handlePlaceOrder($conn); break;
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Aktion nicht gefunden']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ein serverseitiger Fehler ist aufgetreten: ' . $e->getMessage()]);
}


$conn->close();

// =================================================================
// =========== FUNKTIONSDEFINITIONEN ===============================
// =================================================================

function isUserLoggedIn() {
    return isset($_SESSION['user_id']);
}

function handleGetProducts($conn) {
    $sql = "SELECT id, name, description, price, image_url, product_id as productId FROM products";
    $result = $conn->query($sql);
    $products = [];
    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
    }
    echo json_encode($products);
}

function handleRegister($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $firstname = $data['firstname'] ?? '';
    $lastname = $data['lastname'] ?? '';
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    if (empty($firstname) || empty($lastname) || empty($email) || empty($password) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Bitte alle Felder korrekt ausfüllen.']);
        return;
    }
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (firstname, lastname, email, password_hash) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $firstname, $lastname, $email, $password_hash);
    if ($stmt->execute()) {
        echo json_encode(['success' => 'Registrierung erfolgreich.']);
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
    $stmt = $conn->prepare("SELECT id, firstname, password_hash FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();
    if ($user = $result->fetch_assoc()) {
        if (password_verify($password, $user['password_hash'])) {
            $guest_cart = $_SESSION['cart'] ?? [];
            session_regenerate_id(true);
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_firstname'] = $user['firstname'];
            mergeGuestCart($conn, $guest_cart, $user['id']);
            echo json_encode(['success' => 'Login erfolgreich.', 'user_firstname' => $user['firstname']]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Falsches Passwort.']);
        }
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Benutzer nicht gefunden.']);
    }
}

function handleGetUserProfile($conn) {
    if (!isUserLoggedIn()) {
        http_response_code(401);
        echo json_encode(['error' => 'Nicht angemeldet.']);
        return;
    }
    $userId = $_SESSION['user_id'];
    $stmt = $conn->prepare("SELECT firstname, lastname, email, street, house_nr, zip, city, shipping_street, shipping_house_nr, shipping_zip, shipping_city FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($user = $result->fetch_assoc()) {
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Benutzer nicht gefunden.']);
    }
    $stmt->close();
}

function handleUpdateUserProfile($conn) {
    if (!isUserLoggedIn()) {
        http_response_code(401);
        echo json_encode(['error' => 'Nicht angemeldet.']);
        return;
    }
    $userId = $_SESSION['user_id'];
    $data = json_decode(file_get_contents('php://input'), true);

    $firstname = $data['firstname'] ?? '';
    $lastname = $data['lastname'] ?? '';
    $street = $data['street'] ?? '';
    $house_nr = $data['house_nr'] ?? '';
    $zip = $data['zip'] ?? '';
    $city = $data['city'] ?? '';
    $shipping_street = $data['shipping_street'] ?? '';
    $shipping_house_nr = $data['shipping_house_nr'] ?? '';
    $shipping_zip = $data['shipping_zip'] ?? '';
    $shipping_city = $data['shipping_city'] ?? '';


    if (empty($firstname) || empty($lastname)) {
        http_response_code(400);
        echo json_encode(['error' => 'Vor- und Nachname sind Pflichtfelder.']);
        return;
    }

    $stmt = $conn->prepare("UPDATE users SET firstname=?, lastname=?, street=?, house_nr=?, zip=?, city=?, shipping_street=?, shipping_house_nr=?, shipping_zip=?, shipping_city=? WHERE id=?");
    $stmt->bind_param("ssssssssssi", $firstname, $lastname, $street, $house_nr, $zip, $city, $shipping_street, $shipping_house_nr, $shipping_zip, $shipping_city, $userId);

    if ($stmt->execute()) {
        $_SESSION['user_firstname'] = $firstname;
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Profil konnte nicht aktualisiert werden.']);
    }
    $stmt->close();
}


function mergeGuestCart($conn, $guest_cart, $user_id) {
    if (empty($guest_cart)) return;
    foreach ($guest_cart as $product_id => $quantity) {
        $check_stmt = $conn->prepare("SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?");
        $check_stmt->bind_param("ii", $user_id, $product_id);
        $check_stmt->execute();
        $result = $check_stmt->get_result();
        if ($result->num_rows > 0) {
            $item = $result->fetch_assoc();
            $new_quantity = $item['quantity'] + $quantity;
            $update_stmt = $conn->prepare("UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?");
            $update_stmt->bind_param("iii", $new_quantity, $user_id, $product_id);
            $update_stmt->execute();
            $update_stmt->close();
        } else {
            $insert_stmt = $conn->prepare("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)");
            $insert_stmt->bind_param("iii", $user_id, $product_id, $quantity);
            $insert_stmt->execute();
            $insert_stmt->close();
        }
        $check_stmt->close();
    }
    unset($_SESSION['cart']);
}

function handleLogout() {
    session_destroy();
    echo json_encode(['success' => 'Logout erfolgreich.']);
}

function handleGetCart($conn) {
    $cartItems = [];
    $cart_data = [];
    if (isUserLoggedIn()) {
        $userId = $_SESSION['user_id'];
        $stmt = $conn->prepare("SELECT product_id, quantity FROM cart_items WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        while($row = $result->fetch_assoc()) {
            $cart_data[$row['product_id']] = $row['quantity'];
        }
    } else {
        $cart_data = $_SESSION['cart'] ?? [];
    }
    if (!empty($cart_data)) {
        $product_ids = array_keys($cart_data);
        $sql = "SELECT id, name, price, image_url, product_id as productId FROM products WHERE id IN (" . implode(',', array_fill(0, count($product_ids), '?')) . ")";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param(str_repeat('i', count($product_ids)), ...$product_ids);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $row['quantity'] = $cart_data[$row['id']];
            $cartItems[] = $row;
        }
    }
    echo json_encode($cartItems);
}

function handleAddToCart($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $productId = $data['productId'] ?? 0;
    if ($productId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültige Produkt-ID.']);
        return;
    }
    if (isUserLoggedIn()) {
        $userId = $_SESSION['user_id'];
        $stmt = $conn->prepare("SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?");
        $stmt->bind_param("ii", $userId, $productId);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($item = $result->fetch_assoc()) {
            $newQuantity = $item['quantity'] + 1;
            $updateStmt = $conn->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?");
            $updateStmt->bind_param("ii", $newQuantity, $item['id']);
            $updateStmt->execute();
        } else {
            $insertStmt = $conn->prepare("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1)");
            $insertStmt->bind_param("ii", $userId, $productId);
            $insertStmt->execute();
        }
    } else {
        if (!isset($_SESSION['cart'])) $_SESSION['cart'] = [];
        $_SESSION['cart'][$productId] = isset($_SESSION['cart'][$productId]) ? $_SESSION['cart'][$productId] + 1 : 1;
    }
    echo json_encode(['success' => true]);
}

function handleUpdateCart($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $productId = $data['productId'] ?? 0;
    $quantity = $data['quantity'] ?? -1;
    if ($productId <= 0 || $quantity < 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültige Anfrage.']);
        return;
    }
    if (isUserLoggedIn()) {
        $userId = $_SESSION['user_id'];
        if ($quantity == 0) {
            $stmt = $conn->prepare("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?");
            $stmt->bind_param("ii", $userId, $productId);
        } else {
            $stmt = $conn->prepare("UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?");
            $stmt->bind_param("iii", $quantity, $userId, $productId);
        }
        $stmt->execute();
    } else {
        if ($quantity == 0) unset($_SESSION['cart'][$productId]);
        else $_SESSION['cart'][$productId] = $quantity;
    }
    echo json_encode(['success' => 'Warenkorb aktualisiert.']);
}

function handleRemoveFromCart($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $productId = $data['productId'] ?? 0;
    if ($productId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültige Produkt-ID.']);
        return;
    }
    if (isUserLoggedIn()) {
        $userId = $_SESSION['user_id'];
        $stmt = $conn->prepare("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?");
        $stmt->bind_param("ii", $userId, $productId);
        $stmt->execute();
    } else {
        unset($_SESSION['cart'][$productId]);
    }
    echo json_encode(['success' => 'Produkt entfernt.']);
}
function handlePlaceOrder($conn) {
    global $deine_email, $dein_passwort, $dein_name;
    $data = json_decode(file_get_contents('php://input'), true);
    list($cartItems, $totalPrice) = getCartDataForProcessing($conn);

    if (empty($cartItems)) {
        http_response_code(400);
        echo json_encode(['error' => 'Ihr Warenkorb ist leer.']);
        return;
    }

    if (isUserLoggedIn()) {
        $stmt = $conn->prepare("SELECT firstname, lastname, email, street, house_nr, zip, city, shipping_street, shipping_house_nr, shipping_zip, shipping_city FROM users WHERE id = ?");
        $stmt->bind_param("i", $_SESSION['user_id']);
        $stmt->execute();
        $user_result = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (empty($user_result['street']) || empty($user_result['zip']) || empty($user_result['city'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Bitte vervollständigen Sie Ihre Adresse im Profil.']);
            return;
        }

        $customer_name = $user_result['firstname'] . ' ' . $user_result['lastname'];
        $customer_email = $user_result['email'];
        $billing_address = "{$user_result['firstname']} {$user_result['lastname']}\n{$user_result['street']} {$user_result['house_nr']}\n{$user_result['zip']} {$user_result['city']}";

        if (empty($user_result['shipping_street'])) {
            $shipping_address = $billing_address;
        } else {
            $shipping_address = "{$user_result['firstname']} {$user_result['lastname']}\n{$user_result['shipping_street']} {$user_result['shipping_house_nr']}\n{$user_result['shipping_zip']} {$user_result['shipping_city']}";
        }
    } else {
        // Guest user
        $firstname = $data['firstname'] ?? '';
        $lastname = $data['lastname'] ?? '';
        $customer_email = $data['email'] ?? '';
        $street = $data['street'] ?? '';
        $housenr = $data['house_nr'] ?? '';
        $zip = $data['zip'] ?? '';
        $city = $data['city'] ?? '';

        $shipping_firstname = $data['shipping_firstname'] ?? '';
        $shipping_lastname = $data['shipping_lastname'] ?? '';
        $shipping_street = $data['shipping_street'] ?? '';
        $shipping_housenr = $data['shipping_house_nr'] ?? '';
        $shipping_zip = $data['shipping_zip'] ?? '';
        $shipping_city = $data['shipping_city'] ?? '';


        if (empty($firstname) || empty($lastname) || !filter_var($customer_email, FILTER_VALIDATE_EMAIL) || empty($street) || empty($housenr) || empty($zip) || empty($city)) {
            http_response_code(400);
            echo json_encode(['error' => 'Bitte füllen Sie alle erforderlichen Felder der Rechnungsadresse aus.']);
            return;
        }
        $customer_name = $firstname . ' ' . $lastname;
        $billing_address = "$firstname $lastname\n$street $housenr\n$zip $city";

        if (empty($shipping_street)) {
            $shipping_address = $billing_address;
        } else {
            if (empty($shipping_firstname) || empty($shipping_lastname) || empty($shipping_street) || empty($shipping_housenr) || empty($shipping_zip) || empty($shipping_city)) {
                http_response_code(400);
                echo json_encode(['error' => 'Bitte füllen Sie alle erforderlichen Felder der Lieferadresse aus.']);
                return;
            }
            $shipping_address = "$shipping_firstname $shipping_lastname\n$shipping_street $shipping_housenr\n$shipping_zip $shipping_city";
        }

    }

    $conn->begin_transaction();

    $user_id = isUserLoggedIn() ? $_SESSION['user_id'] : null;
    $stmt = $conn->prepare("INSERT INTO orders (user_id, customer_name, customer_email, total_price, customer_address, shipping_address) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isdsss", $user_id, $customer_name, $customer_email, $totalPrice, $billing_address, $shipping_address);
    $stmt->execute();
    $order_id = $conn->insert_id;
    $stmt->close();

    $stmt = $conn->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
    foreach ($cartItems as $item) {
        $stmt->bind_param("iiid", $order_id, $item['id'], $item['quantity'], $item['price']);
        $stmt->execute();
    }
    $stmt->close();
    if (isUserLoggedIn()) {
        $stmt = $conn->prepare("DELETE FROM cart_items WHERE user_id = ?");
        $stmt->bind_param("i", $_SESSION['user_id']);
        $stmt->execute();
        $stmt->close();
    } else {
        $_SESSION['cart'] = [];
    }
    $conn->commit();
    sendOrderConfirmationEmail($customer_email, $customer_name, $order_id, $cartItems, $totalPrice, $billing_address, $shipping_address);
    echo json_encode(['success' => true, 'order_id' => $order_id]);

}


function getCartDataForProcessing($conn) {
    $cartItems = [];
    $totalPrice = 0;
    $cart_data = isUserLoggedIn() ? getDbCart($conn) : ($_SESSION['cart'] ?? []);
    if (!empty($cart_data)) {
        $product_ids = array_keys($cart_data);
        $sql = "SELECT id, name, price, product_id as productId FROM products WHERE id IN (" . implode(',', array_fill(0, count($product_ids), '?')) . ")";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param(str_repeat('i', count($product_ids)), ...$product_ids);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $quantity = $cart_data[$row['id']];
            $row['quantity'] = $quantity;
            $cartItems[] = $row;
            $totalPrice += $row['price'] * $quantity;
        }
    }
    return [$cartItems, $totalPrice];
}

function getDbCart($conn) {
    $cart_data = [];
    $stmt = $conn->prepare("SELECT product_id, quantity FROM cart_items WHERE user_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $cart_data[$row['product_id']] = $row['quantity'];
    }
    return $cart_data;
}

function sendOrderConfirmationEmail($email, $name, $order_id, $items, $total, $billing_address, $shipping_address) {
    global $deine_email, $dein_passwort, $dein_name;
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.strato.de';
        $mail->SMTPAuth = true;
        $mail->Username = $deine_email;
        $mail->Password = $dein_passwort;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port = 465;
        $mail->CharSet = 'UTF-8';
        $mail->setFrom($deine_email, $dein_name);
        $mail->addAddress($email, $name);
        $mail->Subject = 'Ihre Bestellung #' . $order_id;
        $body = "<h1>Vielen Dank für Ihre Bestellung!</h1>";
        $body .= "<p>Hallo $name,</p>";
        $body .= "<p>wir haben Ihre Bestellung mit der Nummer #$order_id erhalten:</p>";
        $body .= "<table border='1' cellpadding='5' cellspacing='0' style='width: 100%; border-collapse: collapse;'><tr><th style='text-align: left;'>Produkt-ID</th><th style='text-align: left;'>Produkt</th><th>Menge</th><th style='text-align: right;'>Preis</th></tr>";
        foreach ($items as $item) {
            $body .= "<tr><td>" . $item['productId'] . "</td><td>" . $item['name'] . "</td><td style='text-align: center;'>" . $item['quantity'] . "</td><td style='text-align: right;'>" . number_format($item['price'] * $item['quantity'], 2, ',', '.') . " €</td></tr>";
        }
        $body .= "</table>";
        $body .= "<p style='text-align: right;'><b>Gesamtsumme: " . number_format($total, 2, ',', '.') . " €</b></p>";
        $body .= "<h3>Rechnungsadresse</h3><p>" . nl2br(htmlspecialchars($billing_address)) . "</p>";
        $body .= "<h3>Lieferadresse</h3><p>" . nl2br(htmlspecialchars($shipping_address)) . "</p>";

        $mail->isHTML(true);
        $mail->Body = $body;
        $mail->AltBody = 'Vielen Dank für Ihre Bestellung! Ihre Bestellnummer ist #' . $order_id . '. Gesamtsumme: ' . number_format($total, 2, ',', '.') . ' €';
        $mail->send();
    } catch (Exception $e) {
        error_log("Confirmation mail for order #$order_id to $email failed: " . $mail->ErrorInfo);
    }
}

?>