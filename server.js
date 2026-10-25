const express = require('express');
const nodemailer = require('nodemailer');
const app = express();

app.use(express.json());
app.use(express.static('public')); // Ordner für die HTML-Datei

// Temporärer Speicher für Codes und E-Mails (Sollte in Produktion eine DB sein)
const sessions = {}; 

// E-Mail-Konfiguration (Hier deine SMTP-Daten eintragen)
const transporter = nodemailer.createTransport({
    host: "dein-smtp-server.de",
    port: 465,
    secure: true, 
    auth: {
        user: "deine-email@domain.de",
        pass: "dein-passwort"
    }
});

// Schritt 1: E-Mail senden & Code generieren
app.post('/api/send-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-Mail erforderlich' });

    // Zufälliger 4-stelliger Code (1000 - 9999)
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    sessions[email] = { code, verified: false };

    try {
        await transporter.sendMail({
            from: '"Dein Dienst" <deine-email@domain.de>',
            to: email,
            subject: "Dein Bestätigungscode",
            text: `Dein Bestätigungscode lautet: ${code}`
        });
        res.json({ success: true, message: 'Code gesendet!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fehler beim E-Mail-Versand' });
    }
});

// Schritt 2: Code überprüfen
app.post('/api/verify-code', (req, res) => {
    const { email, code } = req.body;
    if (!sessions[email]) return res.status(400).json({ error: 'Sitzung abgelaufen' });

    if (sessions[email].code === code) {
        sessions[email].verified = true;
        res.json({ success: true, message: 'Code korrekt!' });
    } else {
        res.status(400).json({ error: 'Falscher Code!' });
    }
});

// Schritt 3: Benutzernamen speichern
app.post('/api/register-username', (req, res) => {
    const { email, username } = req.body;
    if (!sessions[email] || !sessions[email].verified) {
        return res.status(403).json({ error: 'Nicht autorisiert' });
    }

    // Hier würde der Benutzername in der Datenbank gespeichert werden
    console.log(`Erfolgreich registriert: ${username} (${email})`);
    
    // Sitzung aufräumen
    delete sessions[email]; 
    res.json({ success: true, message: 'Erfolgreich!' });
});

app.listen(3000, () => console.log('Server läuft auf Port 3000'));
