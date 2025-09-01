# Investment Dashboard 📈

[🇸🇪 Svenska](#svensk-version) | [🇬🇧 English](#english-version)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

## English Version

A comprehensive investment dashboard for tracking and analyzing your stock portfolio with real-time data from Yahoo Finance. Features a Swedish interface with all values in SEK.

### 🌟 Live Demo
Coming soon...

### 📸 Screenshots
![Dashboard Overview](https://via.placeholder.com/800x400?text=Dashboard+Overview)

---

## Svensk Version

# Investeringsdashboard 📈

En komplett investeringsdashboard för att spåra och analysera din aktieportfölj. Allt i svenska kronor (SEK) med svenskt gränssnitt.

## Funktioner

### 🎯 Huvudfunktioner
- **Portföljöversikt** - Se totalt värde, vinst/förlust och daglig förändring
- **Transaktionshantering** - Lägg till köp/sälj-transaktioner manuellt
- **Realtidsuppdatering** - Automatisk uppdatering av aktiekurser
- **Historisk data** - Visa portföljutveckling över tid
- **Interaktiva diagram** - Visualiseringar för allokering och prestanda

### 📊 Dashboard-vyer
1. **Översikt** - Sammanfattning av portföljen med nyckeltal
2. **Transaktioner** - Lista över alla köp och försäljningar
3. **Ny Transaktion** - Formulär för att lägga till nya transaktioner
4. **Diagram** - Visualiseringar och analyser

## Installation

### Krav
- Node.js (version 14 eller högre)
- npm eller yarn

### Steg-för-steg

1. **Installera beroenden:**
```bash
# Installera backend-beroenden
npm install

# Installera frontend-beroenden
cd client
npm install
cd ..
```

2. **Starta applikationen:**
```bash
# Starta både backend och frontend samtidigt
npm run dev
```

Applikationen kommer att köras på:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Användning

### Lägga till transaktioner

1. Klicka på **"Ny Transaktion"** i navigeringen
2. Fyll i följande information:
   - **Transaktionstyp**: Köp eller Sälj
   - **Ticker**: Aktiesymbol (t.ex. AAPL, MSFT)
   - **Företagsnamn**: Valfritt namn på företaget
   - **Antal aktier**: Hur många aktier
   - **Pris per aktie**: Inköpspris i SEK
   - **Valuta**: Välj valuta (standard SEK)
   - **Datum**: När transaktionen genomfördes

3. Klicka på **"Spara transaktion"**

### Visa portfölj

På **Översikt**-sidan ser du:
- **Totalt värde** - Aktuellt värde av hela portföljen
- **Total vinst/förlust** - Skillnad mellan nuvarande värde och investerat belopp
- **Investerat belopp** - Totalt investerat kapital
- **Antal innehav** - Antal olika aktier i portföljen

### Analysera med diagram

Under **Diagram**-fliken finns:
- **Allokering** - Cirkeldiagram över portföljfördelning
- **Utveckling** - Linjediagram över portföljvärde över tid
- **Månadsvis** - Stapeldiagram över köp/sälj per månad
- **Sektorer** - Fördelning mellan olika sektorer

## Datalagring

All data lagras lokalt i en SQLite-databas (`portfolio.db`) som skapas automatiskt vid första körningen.

### Databastabeller:
- `transactions` - Alla köp/sälj-transaktioner
- `holdings` - Aktuella innehav (uppdateras automatiskt)
- `price_history` - Historiska priser

## API-endpoints

Backend tillhandahåller följande endpoints:

- `GET /api/transactions` - Hämta alla transaktioner
- `POST /api/transactions` - Lägg till ny transaktion
- `DELETE /api/transactions/:id` - Ta bort transaktion
- `GET /api/holdings` - Hämta aktuella innehav
- `GET /api/prices/:tickers` - Hämta aktuella priser
- `GET /api/history/:ticker` - Hämta historisk data
- `GET /api/exchange-rates` - Hämta valutakurser

## Anpassning

### Ändra valutakurser
I `server/index.js`, uppdatera valutakurserna i `/api/exchange-rates` endpoint.

### Anpassa färgtema
Redigera CSS-variabler i `client/src/App.css`:
```css
:root {
  --primary-color: #0088FE;
  --secondary-color: #00C49F;
  --success-color: #00C49F;
  --danger-color: #FF8042;
  /* ... */
}
```

## Utveckling

### Projektstruktur
```
InvestmentDashboard/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React-komponenter
│   │   ├── App.js        # Huvudkomponent
│   │   └── App.css        # Styling
├── server/
│   └── index.js           # Express backend
├── portfolio.db           # SQLite databas
└── package.json           # Projektberoenden
```

### Teknisk stack
- **Frontend**: React, Recharts, Axios, Lucide Icons
- **Backend**: Node.js, Express, SQLite3
- **Styling**: CSS med dark theme

## Tips

1. **Regelbunden uppdatering**: Lägg till transaktioner varje vecka för bäst överblick
2. **Ticker-format**: Använd standard ticker-symboler (AAPL, MSFT, etc.)
3. **Valutakonvertering**: Alla värden visas automatiskt i SEK

## Felsökning

### Applikationen startar inte
- Kontrollera att Node.js är installerat: `node --version`
- Verifiera att alla beroenden är installerade: `npm install`

### Data visas inte
- Kontrollera att backend körs på port 5000
- Verifiera att `portfolio.db` har skapats i rot-mappen

### Priser uppdateras inte
- För närvarande använder appen simulerade priser
- För riktiga priser, integrera med en finansiell API (Yahoo Finance, Alpha Vantage, etc.)

## Framtida förbättringar

- [ ] Integration med riktig börs-API för realtidspriser
- [ ] Export av data till CSV/Excel
- [ ] Dividend tracking
- [ ] Skatteberäkningar
- [ ] Mobilapp
- [ ] Portfolio-mål och alerts
- [ ] Jämförelse med index

## Licens

Detta projekt är skapat för personligt bruk.

---

Skapad med ❤️ för svenska investerare
