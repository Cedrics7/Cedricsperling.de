<?php
// Dies prüft, ob das Formular mit der POST-Methode gesendet wurde.
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // --- Konfiguration ---
    // Ändern Sie diese E-Mail-Adresse zu Ihrer eigenen.
    $empfaenger_email = "cedricsperling@icloud.com";
    $betreff = "Neue Kontaktanfrage von deiner Website";

    // Formulardaten sicher abrufen
    $name = strip_tags(trim($_POST["name"]));
    $absender_email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $nachricht = trim($_POST["message"]);

    // --- Validierung ---
    // Prüfen, ob alle Felder ausgefüllt und die E-Mail gültig ist.
    if (empty($name) || empty($nachricht) || !filter_var($absender_email, FILTER_VALIDATE_EMAIL)) {
        // Bei einem Fehler eine Fehlermeldung senden.
        http_response_code(400);
        echo "Bitte füllen Sie alle Felder aus und geben Sie eine gültige E-Mail-Adresse an.";
        exit;
    }

    // --- E-Mail zusammenstellen ---
    $email_inhalt = "Name: $name\n";
    $email_inhalt .= "E-Mail: $absender_email\n\n";
    $email_inhalt .= "Nachricht:\n$nachricht\n";

    // E-Mail-Header setzen, damit die "Antwort an"-Adresse korrekt ist.
    $email_header = "From: $name <$absender_email>";

    // --- E-Mail versenden ---
    // Die mail()-Funktion von PHP wird verwendet.
    if (mail($empfaenger_email, $betreff, $email_inhalt, $email_header)) {
        // Bei Erfolg eine Erfolgsmeldung senden.
        http_response_code(200);
        echo "Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.";
    } else {
        // Bei einem Serverfehler eine Fehlermeldung senden.
        http_response_code(500);
        echo "Oops! Etwas ist schiefgelaufen. Wir konnten Ihre Nachricht nicht senden.";
    }

} else {
    // Wenn jemand versucht, die Datei direkt aufzurufen.
    http_response_code(403);
    echo "Es gab ein Problem mit Ihrer Anfrage, bitte versuchen Sie es erneut.";
}
?>