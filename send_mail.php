<?php
// PHPMailer-Klassen importieren
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

// Autoloader von PHPMailer laden
require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

// =========== KONFIGURATION: HIER DEINE DATEN EINTRAGEN ===========

// Deine E-Mail-Adresse und dein Name für den Versand
$deine_email = "mail@cedricsperling.de";
$dein_name = "Cedric Sperling";
$dein_passwort = "Qwasyx.1234"; // WICHTIG: Ersetze das hier!

// E-Mail-Adresse, an die die Kontaktanfragen gehen sollen (kann die gleiche sein)
$empfaenger_email = "cedricsperling@icloud.com";

// Betreff der E-Mail, die DU erhältst.
$betreff_fuer_dich = "Neue Kontaktanfrage von Cedricsperling.de";

// Betreff für die Bestätigungs-E-Mail an den Besucher.
$betreff_fuer_besucher = "Empfangsbestätigung: Vielen Dank für deine Anfrage!";

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

    // Ein PHPMailer-Objekt erstellen
    $mail = new PHPMailer(true);

    try {
        // --- SMTP-SERVER-EINSTELLUNGEN (für Strato) ---
        // $mail->SMTPDebug = SMTP::DEBUG_SERVER; // Zum Testen und zur Fehlersuche aktivieren
        $mail->SMTPDebug = SMTP::DEBUG_SERVER; // Zum Testen und zur Fehlersuche aktivieren
        $mail->isSMTP();
        $mail->Host       = 'smtp.strato.de'; // SMTP-Server von Strato
        $mail->SMTPAuth   = true;
        $mail->Username   = $deine_email;
        $mail->Password   = $dein_passwort;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL-Verschlüsselung
        $mail->Port       = 465; // SSL-Port für Strato
        $mail->CharSet    = 'UTF-8';

        // --- E-MAIL AN DICH SENDEN ---
        $mail->setFrom($deine_email, $dein_name); // Absender ist dein eigenes Postfach
        $mail->addAddress($empfaenger_email); // Empfänger bist du
        $mail->addReplyTo($email_besucher, $name); // Antwort-Adresse ist der Besucher
        $mail->Subject = $betreff_fuer_dich;

        // E-Mail-Inhalt für dich
        $inhalt_fuer_dich = "Du hast eine neue Nachricht über dein Kontaktformular erhalten:\n\n";
        $inhalt_fuer_dich .= "Name: $name\n";
        $inhalt_fuer_dich .= "E-Mail: $email_besucher\n\n";
        $inhalt_fuer_dich .= "Nachricht:\n$nachricht\n";
        $mail->Body = $inhalt_fuer_dich;

        $mail->send(); // E-Mail an dich versenden

        // --- BESTÄTIGUNGS-E-MAIL AN DEN BESUCHER SENDEN ---
        $mail->clearAddresses(); // Empfängerliste leeren
        $mail->clearReplyTos();  // Antwort-Adressen leeren

        $mail->addAddress($email_besucher, $name); // Empfänger ist jetzt der Besucher
        $mail->addReplyTo($deine_email, $dein_name); // Antwort-Adresse bist du
        $mail->Subject = $betreff_fuer_besucher;

        // E-Mail-Inhalt für den Besucher
        $inhalt_fuer_besucher = "Hallo $name,\n\n";
        $inhalt_fuer_besucher .= "vielen Dank für deine Nachricht. Ich habe deine Anfrage erhalten und werde mich so schnell wie möglich bei dir melden.\n\n";
        $inhalt_fuer_besucher .= "Hier ist eine Kopie deiner Nachricht:\n";
        $inhalt_fuer_besucher .= "------------------------------------------\n";
        $inhalt_fuer_besucher .= "$nachricht\n";
        $inhalt_fuer_besucher .= "------------------------------------------\n\n";
        $inhalt_fuer_besucher .= "Mit freundlichen Grüßen,\n";
        $inhalt_fuer_besucher .= "Cedric Sperling";
        $mail->Body = $inhalt_fuer_besucher;

        $mail->send(); // E-Mail an Besucher versenden

        http_response_code(200);
        echo "Vielen Dank! Deine Nachricht wurde gesendet.";

    } catch (Exception $e) {
        http_response_code(500);
        // Detaillierte Fehlermeldung für dich, allgemeine für den Besucher
        // error_log("Mailer Error: " . $mail->ErrorInfo); // Schreibt Fehler in Server-Log-Datei
        echo "Oops! Etwas ist schiefgelaufen. Bitte versuche es später erneut. Fehler: {$mail->ErrorInfo}";
    }
} else {
    // Nicht per POST aufgerufen, also Fehler
    http_response_code(403);
    echo "Es gab ein Problem mit deiner Anfrage.";
}
?>