// Setter opp en Express-app
const express = require('express');
const app = express();
const PORT = 3000;
var session = require('express-session');

require('dotenv').config();

// setter opp Bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 13;

// Setter opp databasen
const Database = require('better-sqlite3');
const db = new Database('chat.db');

//oppretter tabell hvi de ikke finnes
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

db.prepare(`
    CREATE TABLE IF NOT EXISTS bruker (
        Brukerid INTEGER PRIMARY KEY AUTOINCREMENT,
        Brukernavn TEXT NOT NULL UNIQUE, 
        Passord_Hash TEXT NOT NULL,
        Admin INTEGER DEFAULT 0
    )
`).run();


app.use(
    session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: { maxAge: 60000 * 60 * 24 }, // 1 dag
    secure: false
})
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve statiske filer fra public-mappen
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/rom', (req, res) => {
        if (!req.session.brukernavn) {
        return res.status(401).json({ error: "Uautorisert tilgang til rom." });
    }
    res.sendFile(__dirname + '/public/rom.html');
});


app.get('/hentMeldinger/:rom', (req, res) => {
    if (!req.session.brukernavn) {
        return res.status(401).json({ error: "Uautorisert tilgang til meldinger." });
    }
    const rom = req.params.rom;

    const rows = db.prepare(`
        SELECT * FROM melding 
        WHERE rom = ?
        ORDER BY id ASC
    `).all(rom);

    res.json(rows);
});
app.get('/alleRom', (req, res) => {

    if (!req.session.brukernavn) {
        return res.status(401).json({ error: "Uautorisert tilgang til rom." });
    }

    const rows = db.prepare("SELECT * FROM Rom").all();
    res.json(rows);
});

app.get('/rom:romid', (req, res) => {
    
        if (!req.session.brukernavn) {
        return res.status(401).json({ error: "Uautorisert tilgang." });
    }

    const id = req.params.romid;
    const row = db.prepare("SELECT * FROM Rom WHERE romid = ?").get(id);
    if (!row) {
        return res.status(404).send("Rom finnes ikke.");
    } 
        res.sendFile(__dirname + '/public/chat.html');
});

app.post("/signup", async (req, res) => {
    const { brukernavn, passord } = req.body;
    if (!brukernavn || !passord) {
        return res.status(400).json({ error: "Brukernavn og passord er påkrevd." });
    }

    try {
        console.time();
        const hashedPassord = await bcrypt.hash(passord, saltRounds);
        const info = db.prepare("INSERT INTO bruker (Brukernavn, Passord_Hash) VALUES (?, ?)").run(brukernavn, hashedPassord);
        console.log(`Ny bruker registrert: ${brukernavn} (ID: ${info.lastInsertRowid})`);
        console.timeEnd();
        return res.status(201).json({ message: "Bruker registrert." });
    } 
    catch (err) {
        console.error("Feil ved registrering av bruker:", err);

        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: "Brukernavn er allerede tatt." });
        }

        return res.status(500).json({ error: "Kunne ikke registrere bruker." });
    }

});


app.post("/login", async (req, res) => {
const { brukernavn, passord } = req.body;
if (!brukernavn || !passord) {
    return res.status(400).json({ error: "Brukernavn og passord er påkrevd." });
}

try { const bruker = db.prepare("SELECT * FROM Bruker WHERE Brukernavn = ?").get(brukernavn);
    
    if (!bruker) {
        return res.status(401).json({ error: "Ugyldig brukernavn eller passord." });
    }
    const match = await bcrypt.compare(passord, bruker.Passord_Hash);
    if (!match) {
        return res.status(401).json({ error: "Ugyldig brukernavn eller passord." });
    }

    if (match) {
        req.session.brukernavn = brukernavn;
        req.session.isAdmin = bruker.Admin === 1; // Lagrer admin-status
        console.log(`Bruker logget inn: ${brukernavn} (ID: ${bruker.Brukerid})`);
        return res.status(200).json({ message: "Innlogging vellykket.", isAdmin: bruker.Admin === 1 });
    }

    } catch (err) {
    console.error("Feil ved innlogging:", err);
    return res.status(500).json({ error: "Kunne ikke logge inn." });
    }

});


app.post("/lagRom", (req, res) => {
    if (!req.session.brukernavn) {
        return res.status(401).json({ error: "Du må være logget inn for å opprette rom." });
    }
    
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
    
    if (!req.session.brukernavn) {
        return res.status(401).json({ error: "Du må være logget inn for å sende melding." });
    }
    
    const person = req.session.brukernavn;
    
    try {
        let { melding, tid, rom } = req.body;

        melding = melding.toString().trim();
        tid = tid.toString().trim();
        rom = rom.toString().trim();

        console.log("motatt melding:", { melding, tid, rom });

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

app.delete("/slettMelding/:id", (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: "Du har ikke tillatelse til å slette meldinger." });
    }
    
    try {
        const id = req.params.id;
        db.prepare("DELETE FROM melding WHERE id = ?").run(id);
        return res.sendStatus(200);
    } catch (err) {
        console.error("Feil ved sletting av melding:", err);
        return res.status(500).json({ error: "Kunne ikke slette meldingen" });
    }
});

app.delete("/slettRom/:romid", (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: "Du har ikke tillatelse til å slette rom." });
    }
    
    try {
        const romid = req.params.romid;
        // Sletter først alle meldinger i rommet
        db.prepare("DELETE FROM melding WHERE rom = ?").run(romid);
        // Deretter sletter rommet
        db.prepare("DELETE FROM Rom WHERE romid = ?").run(romid);
        return res.sendStatus(200);
    } catch (err) {
        console.error("Feil ved sletting av rom:", err);
        return res.status(500).json({ error: "Kunne ikke slette rommet" });
    }
});

// Åpner en viss port på serveren, og nå kjører den
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
