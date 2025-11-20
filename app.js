// Setter opp en Express-app
const express = require('express');
const app = express();

// Setter opp databasen
const Database = require('better-sqlite3');
const db = new Database('chat.db');

db.prepare(`
    CREATE TABLE IF NOT EXISTS melding (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person TEXT NOT NULL,
        melding TEXT NOT NULL,
        tid TEXT NOT NULL
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS Rom (
        romid INTEGER PRIMARY KEY AUTOINCREMENT,
        Navn TEXT NOT NULL
    )
`).run();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve statiske filer fra public-mappen
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/rom.html');
});

// Eksempel på en rute
app.get('/hentMeldinger', (req, res) => {
    const row = db.prepare('SELECT * FROM melding').all();
    res.json(row);
});

app.get('/alleRom', (req, res) => {
    const rows = db.prepare("SELECT * FROM Rom").all();
    res.json(rows);
});

app.get('/rom/:romid', (req, res) => {
    const id = req.params.romid;
    const row = db.prepare("SELECT * FROM Rom WHERE romid = ?").get(id);
    res.sendFile(__dirname + '/public/chat.html');
    if (!row) {
        return res.status(404).send("Rom finnes ikke.");
    } 
});

app.post("/sendMelding", (req, res) => {
    try {
        let { person, melding, tid } = req.body;

        person = person.toString().trim();
        melding = melding.toString().trim();
        tid = tid.toString().trim();
        rom = rom.toString().trim();

        console.log("motatt melding:", { person, melding, tid, rom });

        db.prepare("INSERT INTO melding (person, melding, tid, rom) VALUES (?, ?, ?, ?)")
          .run(person, melding, tid, rom);

        return res.sendStatus(201);

    } catch (err) {
        console.error("Feil ved innsending av melding:", err);
        return res
            .status(500)
            .json({ error: "Kunne ikke lagre meldingen" });
    }
});

// Åpner en viss port på serveren, og nå kjører den
app.listen(3000, () => {
    console.log('Server kjører på http://localhost:3000');
});
