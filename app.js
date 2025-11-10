const express = require('express');
const app = express();

// Setter opp databasen
const Database = require('better-sqlite3');
const db = new Database('chat.db');

// Eksempel på en rute, NB! ..som ikke sender korrekt HTML
app.get('/', (req, res) => {
    res.send("Hei!");
});

// Eksempel på en rute som sjekker om databasen fungerer, returnerer alle meldinger i JSON-format
app.get('/hentMeldinger', (req, res) => {
    const row = db.prepare('SELECT * FROM melding').all();
    res.json(row);
});

// Åpner en port på serveren, og kjører den
app.listen(3000, () => {
    console.log('Server kjører på http://localhost:3000');
});
