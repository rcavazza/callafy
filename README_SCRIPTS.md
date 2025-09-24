# Script di Gestione Server

## Script Disponibili

### Windows

#### `init-db.bat` - Inizializzazione Database
- **Descrizione**: Inizializza il database con i dati di esempio
- **Utilizzo**: Doppio click sul file `init-db.bat` oppure eseguire da terminale
- **Funzionalità**:
  - Crea le tabelle del database
  - Inserisce i dati di esempio (categorie, prodotti, ecc.)
  - Necessario solo alla prima installazione o dopo reset del database

#### `start.bat` - Avvio del Server
- **Descrizione**: Avvia il server backend dell'applicazione Inventario
- **Utilizzo**: Doppio click sul file `start.bat` oppure eseguire da terminale
- **Funzionalità**:
  - Verifica la presenza della directory backend
  - Controlla l'esistenza del file package.json
  - Avvia il server con `npm run dev`
  - Mostra messaggi di errore se qualcosa non funziona

#### `stop.bat` - Arresto del Server
- **Descrizione**: Ferma tutti i processi Node.js in esecuzione
- **Utilizzo**: Doppio click sul file `stop.bat` oppure eseguire da terminale
- **Funzionalità**:
  - Cerca tutti i processi Node.js attivi
  - Termina i processi trovati
  - Mostra conferma dell'operazione
  - Pausa per permettere di leggere i messaggi

## Istruzioni d'Uso

### Prima Esecuzione
1. Assicurarsi che Node.js sia installato sul sistema
2. Assicurarsi che le dipendenze siano installate:
   ```bash
   cd backend
   npm install
   ```
3. **IMPORTANTE**: Inizializzare il database eseguendo `init-db.bat`

### Inizializzazione Database
1. Eseguire `init-db.bat` per creare il database con i dati di esempio
2. Questo script va eseguito solo una volta alla prima installazione
3. Se si verificano errori di database, eliminare `backend/database.sqlite` e rieseguire lo script

### Avvio del Server
1. Eseguire `start.bat`
2. Il server si avvierà sulla porta 3000
3. Aprire il browser su `http://localhost:3000`

### Arresto del Server
1. Eseguire `stop.bat` per terminare il server
2. Oppure premere `Ctrl+C` nel terminale dove è in esecuzione

## Risoluzione Problemi

### Errore "package.json not found"
- Verificare di essere nella directory corretta del progetto
- Verificare che la cartella `backend` esista e contenga il file `package.json`

### Errore "npm command not found"
- Installare Node.js dal sito ufficiale: https://nodejs.org/
- Riavviare il terminale dopo l'installazione

### Porta già in uso
- Eseguire `stop.bat` per terminare eventuali processi precedenti
- Oppure cambiare la porta nel file di configurazione

## Note Tecniche

- Il server utilizza `nodemon` per il riavvio automatico durante lo sviluppo
- I log vengono salvati nella cartella `backend/logs/`
- Il database SQLite si trova in `backend/database.sqlite`