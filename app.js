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

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve statiske filer fra public-mappen
app.use(express.static('public'));

// Eksempel på en rute
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Eksempel på en rute
app.get('/hentMeldinger', (req, res) => {
    const row = db.prepare('SELECT * FROM melding').all();
    res.json(row);
});

app.post("/sendMelding", (req, res) => {
    try {
        let { person, melding, tid } = req.body;

        person = person.toString().trim();
        melding = melding.toString().trim();
        tid = tid.toString().trim();

        console.log("motatt melding:", { person, melding, tid });

        db.prepare("INSERT INTO melding (person, melding, tid) VALUES (?, ?, ?)")
          .run(person, melding, tid);

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
