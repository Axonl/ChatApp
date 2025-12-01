// Setter opp en Express-app
const bcrypt = require('bcrypt');
const express = require('express');
const app = express();
const PORT = 3000;

// Setter opp databasen
const Database = require('better-sqlite3');
const db = new Database('chat.db');

async function hashPassword() { // bcrypt test
const salt = bcrypt.genSaltSync(13);
const password = "password123";

console.time("hashing");
const hash = await bcrypt.hash(password, salt);
console.timeEnd("hashing");

const match = await bcrypt.compare("password123", hash);

console.log("Passord:",password);
console.log("Salt:",salt);
console.log("Hash:",hash);
console.log("Match:", match)
}

hashPassword();

db.prepare(`
    CREATE TABLE IF NOT EXISTS melding (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person TEXT NOT NULL,
        melding TEXT NOT NULL,
        tid TEXT NOT NULL,
        rom INTEGER NOT NULL
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
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/rom', (req, res) => {
    res.sendFile(__dirname + '/public/rom.html');
});


app.get('/hentMeldinger/:rom', (req, res) => {
    const rom = req.params.rom;

    const rows = db.prepare(`
        SELECT * FROM melding 
        WHERE rom = ?
        ORDER BY id ASC
    `).all(rom);

    res.json(rows);
});
app.get('/alleRom', (req, res) => {
    const rows = db.prepare("SELECT * FROM Rom").all();
    res.json(rows);
});

app.get('/rom:romid', (req, res) => {
    const id = req.params.romid;
    const row = db.prepare("SELECT * FROM Rom WHERE romid = ?").get(id);
    res.sendFile(__dirname + '/public/chat.html');
    if (!row) {
        return res.status(404).send("Rom finnes ikke.");
    } 
});

app.post("/signup", (req, res) => {

});


app.post("/login", (req, res) => {

});


app.post("/lagRom", (req, res) => {
    try {
        let { navn } = req.body;
        navn = navn.toString().trim();

        console.log("motatt romnavn:", { navn });

        db.prepare("INSERT INTO Rom (Navn) VALUES (?)")
            .run(navn);
        return res.sendStatus(201);

    } catch (err) {
        console.error("Feil ved oppretting av rom:", err);
        return res 
            .status(500)
            .json({ error: "Kunne ikke opprette rommet" });
    }
});

app.post("/sendMelding", (req, res) => {
    try {
        let { person, melding, tid, rom } = req.body;

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
