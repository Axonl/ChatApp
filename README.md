# Dokumentasjon 

Her er datamodellen.

![Tabell](Tabell.png)


## Rom
Jeg har lagt til muligheten for å lage rom som kun viser meldinger som ble send i det rommet. 

```js
        async function hentRom() {
            const response = await fetch('/alleRom'); 
            const rom = await response.json();
             romDiv.innerHTML = '';
            for (let Rom of rom) {
                const btn = document.createElement('button');
                btn.textContent = Rom.Navn;

                btn.onclick = () => {
                    window.location.href = `/${Rom.romid}`; //tar deg til chat siden med iden til rommet du valgte
                };

                romDiv.appendChild(btn);
            }
        }
```

## forklaring av registrering og inlogging av bruker
<video width="640" height="360" controls>
  <source src="C:\ChatApp\ChatApp\KodeForklaring.mp4" type="video/mp4">
</video>

---
### forklaring
login.html
```js
        RegistrerForm.addEventListener("submit", registrer) // stareter registrer funksjonen når registrer knappen blir trykket i formen

        async function registrer(e) {
            e.preventDefault(); // forhindrer at netsiden refresher

            const brukernavn = RegBrukernavnEl.value; 
            const passord = RegPassordEl.value; // brukernavn og passord blir sutte till det brukeren skrev i formen

            if (!brukernavn || !passord) { // hvis der ikke ble skrevet brukernavn eller passord sendes en alert og funksjonen stopper
                alert("Vennligst fyll ut alle felt.");
                return;
            }
            
            try {
                const response = await fetch("/signup", { // sender data til serveren
                    method: "POST", // Post betyr at vi sender data
                    headers:{ "Content-Type":"application/json" }, // sier at vi sender JSON 
                    body: JSON.stringify({ brukernavn, passord}) // gjør data om til JSON format
               });
               const data = await response.json(); //data = det vi får som svar fra serveren
               if (response.ok) {
                   alert("Registrering vellykket! Du kan nå logge inn.");
                   window.location.reload(true); //hvis alt gikk bra får du en alert og siden refresher
               } else {
                   alert(`Feil: ${data.error}`); //viser feilmelding
               }
            }
            catch (error) { // hvis noe går galt før serveren svarer
                console.error("Feil under registrering:", error);
                alert("En feil oppstod under registreringen. Vennligst prøv igjen senere.");
            }
        }
```
---
app.js
```js
app.post("/signup", async (req, res) => { // Dette er server ruten som håndterer registrering
    const { brukernavn, passord } = req.body; // henter brukernavn og passord som brukeren sendte inn
    if (!brukernavn || !passord) { // sjekker om feltene ble fylt inn og sender feilmelding hvis ikke
        return res.status(400).json({ error: "Brukernavn og passord er påkrevd." });
    }

    try { // krypterer passordet med 13 salt rounds for rask og sikker lagring. tiden det tar for å hashe et passord dobbless for hver salt runde. jeg fant ut at 13 fungerte best. det tar vanligvis 0.5 sekunder.
        const hashedPassord = await bcrypt.hash(passord, saltRounds);
        const info = db.prepare("INSERT INTO bruker (Brukernavn, Passord_Hash) VALUES (?, ?)").run(brukernavn, hashedPassord); //lagrer brukernavn og hashet passord i databasen
        console.log(`Ny bruker registrert: ${brukernavn} (ID: ${info.lastInsertRowid})`);
        return res.status(201).json({ message: "Bruker registrert." }); //sender svar til frontent om at brukeren ble registrert
    } 
    catch (err) {
        console.error("Feil ved registrering av bruker:", err); // viser feil i konsol om det gikk galt

        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') { //hvis error koden sier at det allerede eksisterte en bruker med det navnet sendes denne meldingen til frontend
            return res.status(409).json({ error: "Brukernavn er allerede tatt." });
        }

        return res.status(500).json({ error: "Kunne ikke registrere bruker." }); // hvis en ukjent feil skjer
    } 

});
```
---
