<?php
// =========== Temporäre Fehlerdiagnose ===========
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


// PHPMailer-Klassen importieren
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;


// Autoloader von PHPMailer laden
try {
    require 'PHPMailer/src/Exception.php';
    require 'PHPMailer/src/PHPMailer.php';
    require 'PHPMailer/src/SMTP.php';
} catch (Exception $e) {
    echo "FATALER FEHLER: Eine PHPMailer-Datei konnte nicht geladen werden. Überprüfen Sie den Pfad. Fehler: " . $e->getMessage();
    exit;
}

// =========== KONFIGURATION: HIER DEINE DATEN EINTRAGEN ===========

// Deine E-Mail-Adresse und dein Name für den Versand
$deine_email = "mail@cedricsperling.de";
$dein_name = "Cedric Sperling";
$dein_passwort = "Qwasyx.1234"; // WICHTIG: Ersetze das hier durch dein echtes Passwort!

// E-Mail-Adresse, an die die Kontaktanfragen gehen sollen (kann die gleiche sein)
$empfaenger_email = "cedricsperling@icloud.com";

// Betreff der E-Mail, die DU erhältst.
$betreff_fuer_dich = "Neue Kontaktanfrage von Cedricsperling.de";

// Betreff für die Bestätigungs-E-Mail an den Besucher.
$betreff_fuer_besucher = "Empfangsbestätigung: Vielen Dank für Ihre Anfrage!";

// ======================= ENDE DER KONFIGURATION =======================



// Prüfen, ob das Formular per POST-Methode gesendet wurde
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Formulardaten sicher abrufen
    $name = strip_tags(trim($_POST["name"]));
    $email_besucher = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $nachricht = trim($_POST["message"]);

    // Überprüfen, ob alle Felder ausgefüllt sind
    if (empty($name) || empty($email_besucher) || !filter_var($email_besucher, FILTER_VALIDATE_EMAIL) || empty($nachricht)) {
        http_response_code(400);
        echo "Bitte fülle alle Felder korrekt aus.";
        exit;
    }

    $mail = new PHPMailer(true);

    try {
        // --- SMTP-SERVER-EINSTELLUNGEN (für Strato) ---
        // Debug aus: $mail->SMTPDebug = SMTP::DEBUG_SERVER;
        $mail->isSMTP();
        $mail->Host       = 'smtp.strato.de';
        $mail->SMTPAuth   = true;
        $mail->Username   = $deine_email;
        $mail->Password   = $dein_passwort;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = 465;
        $mail->CharSet    = 'UTF-8';

        // --- E-MAIL AN DICH SENDEN ---
        $mail->setFrom($deine_email, $dein_name);
        $mail->addAddress($empfaenger_email);
        $mail->addReplyTo($email_besucher, $name);
        $mail->Subject = $betreff_fuer_dich;

        $inhalt_fuer_dich = "Du hast eine neue Nachricht über dein Kontaktformular erhalten:\n\n";
        $inhalt_fuer_dich .= "Name: $name\n";
        $inhalt_fuer_dich .= "E-Mail: $email_besucher\n\n";
        $inhalt_fuer_dich .= "Nachricht:\n$nachricht\n";
        $mail->Body = $inhalt_fuer_dich;

        $mail->send();

        // --- BESTÄTIGUNGS-E-MAIL AN DEN BESUCHER SENDEN ---
        $mail->clearAddresses();
        $mail->clearReplyTos();

        $mail->addAddress($email_besucher, $name);
        $mail->addReplyTo($deine_email, $dein_name);
        $mail->Subject = $betreff_fuer_besucher;

        $inhalt_fuer_besucher = "Hallo Herr $name,\n\n";
        $inhalt_fuer_besucher .= "vielen Dank für Ihr Nachricht. Ich habe Ihre Anfrage erhalten und werde mich so schnell wie möglich bei Ihnen melden.\n\n";
        $inhalt_fuer_besucher .= "Hier ist eine Kopie Ihrer Nachricht:\n";
        $inhalt_fuer_besucher .= "------------------------------------------\n";
        $inhalt_fuer_besucher .= "$nachricht\n";
        $inhalt_fuer_besucher .= "------------------------------------------\n\n";
        $inhalt_fuer_besucher .= "Mit freundlichen Grüßen,\n";
        $inhalt_fuer_besucher .= "Cedric Sperling";
        $mail->Body = $inhalt_fuer_besucher;


        $mail->send();

        http_response_code(200);
        echo "Vielen Dank! Ihre Nachricht wurde gesendet.";

    } catch (Exception $e) {
        http_response_code(500);
        echo "Oops! Etwas ist schiefgelaufen. Fehler: {$mail->ErrorInfo}";
    }
} else {
    http_response_code(403);
    echo "Es gab ein Problem mit Ihrer Anfrage. Kein POST.";
}
?>