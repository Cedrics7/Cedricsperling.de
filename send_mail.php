<?php
// HINWEIS: Stellt sicher, dass diese Datei als UTF-8 gespeichert wird, um Probleme mit Umlauten zu vermeiden.

// =========== KONFIGURATION: HIER DEINE DATEN EINTRAGEN ===========

// 1. Die E-Mail-Adresse, an die die Kontaktanfragen gesendet werden sollen.
$empfaenger_email = "cedricsperling@icloud.com";

// 2. Die E-Mail-Adresse, die als Absender der Benachrichtigung an dich angezeigt wird.
//    Tipp: Verwende eine Adresse von derselben Domain, auf der die Webseite läuft (z.B. "noreply@deinewebsite.de"),
//    um zu verhindern, dass die Mail als Spam markiert wird.
$absender_fuer_dich = "mail@cedricsperling.de";

// 3. Der Betreff der E-Mail, die DU erhältst.
$betreff_fuer_dich = "Neue Kontaktanfrage von Cedricsperling.de";

// 4. Der Betreff für die Bestätigungs-E-Mail an den Besucher.
$betreff_fuer_besucher = "Empfangsbestätigung: Vielen Dank für deine Anfrage!";

// ======================= ENDE DER KONFIGURATION =======================


// Prüfen, ob das Formular per POST-Methode gesendet wurde
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Formulardaten sicher abrufen und bereinigen
    $name = strip_tags(trim($_POST["name"]));
    $email_besucher = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $nachricht = trim($_POST["message"]);

    // Überprüfen, ob alle Felder ausgefüllt sind
    if (empty($name) || empty($email_besucher) || !filter_var($email_besucher, FILTER_VALIDATE_EMAIL) || empty($nachricht)) {
        // Bei unvollständigen Daten eine Fehlermeldung senden
        http_response_code(400);
        echo "Bitte fülle alle Felder korrekt aus.";
        exit;
    }

    // --- E-MAIL AN DICH ZUSAMMENBAUEN ---

    // Inhalt der E-Mail, die du bekommst
    $inhalt_fuer_dich = "Du hast eine neue Nachricht über dein Kontaktformular erhalten:\n\n";
    $inhalt_fuer_dich .= "Name: $name\n";
    $inhalt_fuer_dich .= "E-Mail: $email_besucher\n\n";
    $inhalt_fuer_dich .= "Nachricht:\n$nachricht\n";

    // E-Mail-Header für die Mail an dich
    // Setzt den Absender und die "Antwort an"-Adresse auf die des Besuchers
    $header_fuer_dich = "From: $name <" . $absender_fuer_dich . ">\r\n";
    $header_fuer_dich .= "Reply-To: $email_besucher\r\n";
    $header_fuer_dich .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $header_fuer_dich .= "X-Mailer: PHP/" . phpversion();

    // --- BESTÄTIGUNGS-E-MAIL AN DEN BESUCHER ZUSAMMENBAUEN ---

    // Inhalt der Bestätigungs-E-Mail
    $inhalt_fuer_besucher = "Hallo $name,\n\n";
    $inhalt_fuer_besucher .= "vielen Dank für deine Nachricht. Ich habe deine Anfrage erhalten und werde mich so schnell wie möglich bei dir melden.\n\n";
    $inhalt_fuer_besucher .= "Hier ist eine Kopie deiner Nachricht:\n";
    $inhalt_fuer_besucher .= "------------------------------------------\n";
    $inhalt_fuer_besucher .= "$nachricht\n";
    $inhalt_fuer_besucher .= "------------------------------------------\n\n";
    $inhalt_fuer_besucher .= "Mit freundlichen Grüßen,\n";
    $inhalt_fuer_besucher .= "Cedric Sperling";

    // E-Mail-Header für die Mail an den Besucher
    // Setzt den Absender auf deine E-Mail-Adresse
    $header_fuer_besucher = "From: Cedric Sperling <" . $empfaenger_email . ">\r\n";
    $header_fuer_besucher .= "Reply-To: " . $empfaenger_email . "\r\n";
    $header_fuer_besucher .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $header_fuer_besucher .= "X-Mailer: PHP/" . phpversion();


    // --- E-MAILS VERSENDEN ---

    // Versuche, die E-Mail an dich zu senden
    if (mail($empfaenger_email, $betreff_fuer_dich, $inhalt_fuer_dich, $header_fuer_dich)) {
        // Wenn erfolgreich, sende die Bestätigungs-E-Mail an den Besucher
        mail($email_besucher, $betreff_fuer_besucher, $inhalt_fuer_besucher, $header_fuer_besucher);

        // Sende eine Erfolgsmeldung zurück an das JavaScript
        http_response_code(200);
        echo "Vielen Dank! Deine Nachricht wurde gesendet.";
    } else {
        // Bei einem Fehler eine Fehlermeldung senden
        http_response_code(500);
        echo "Oops! Etwas ist schiefgelaufen. Bitte versuche es später erneut.";
    }

} else {
    // Nicht per POST aufgerufen, also Fehler
    http_response_code(403);
    echo "Es gab ein Problem mit deiner Anfrage.";
}
?>