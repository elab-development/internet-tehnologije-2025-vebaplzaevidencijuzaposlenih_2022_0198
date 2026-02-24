# 📌 Evidencija zaposlenih

Web aplikacija za evidenciju aktivnosti zaposlenih, prisustva, rada od kuće (WFH), vremenskih uslova i državnih praznika.

Aplikacija implementira:

- Autentifikaciju i autorizaciju (RBAC)
- Upravljanje aktivnostima
- Evidenciju dolaska i odlaska
- WFH zahteve sa validacijom vremenskih uslova
- Integraciju sa eksternim API servisima
- Sigurnosne mehanizme (IDOR, CSRF, rate limiting)
- CI pipeline i Docker deploy

---

# 🧱 Tehnologije

## Frontend

- Next.js (App Router)
- React
- TypeScript

## Backend

- Next.js API Routes
- Prisma 7
- PostgreSQL

## Testiranje

- Vitest
- Integration testovi (API)

## DevOps

- Docker & Docker Compose
- GitHub Actions (CI)
- Render (deploy)

## Eksterni servisi

- Open-Meteo API (vremenski podaci)
- Nager.Date API (državni praznici)

---

# 🔐 Funkcionalnosti

## Autentifikacija

- Registracija
- Login
- JWT (httpOnly cookie)
- Role-based access control:
  - ADMIN
  - MANAGER
  - EMPLOYEE

## Aktivnosti

- Kreiranje aktivnosti
- Izmena i brisanje (ADMIN/MANAGER)
- Dodela aktivnosti drugim korisnicima
- Filtriranje po datumu
- Ownership kontrola (IDOR zaštita)

## Prisustvo

- Check-in
- Check-out
- Ograničenje na sopstveni nalog

## WFH zahtevi

- Zaposleni podnosi zahtev za rad od kuće
- Validacija na osnovu vremenskih uslova
- ADMIN odobrava ili odbija zahtev

## Praznici

- Sinhronizacija državnih praznika
- Onemogućeno kreiranje aktivnosti na praznik

## Sigurnost

- IDOR zaštita (ownership provera)
- CSRF zaštita (Origin validacija)
- Rate limiting na login endpoint
- React XSS zaštita (escape mehanizam)

📊 Vizualizacija podataka

Aplikacija sadrži Google Charts vizualizaciju statistike prisustva.

Stranica: `/stats/attendance`

Vizualizacije uključuju:

- Donut chart (Udeo statusa: PRESENT, LATE, ABSENT)
- Grafički prikaz po mesecima (stacked column chart)
- Role-based filtriranje (ADMIN/MANAGER mogu filtrirati po korisniku)
- Filter po datumu (Od – Do opseg)

Podaci se dinamički učitavaju sa backend API-ja i agregiraju na osnovu odabranog perioda.

---

# ⚙️ Pokretanje aplikacije (lokalno)

## 1️⃣ Kloniranje repozitorijuma

```bash
git clone <https://github.com/elab-development/internet-tehnologije-2025-vebaplzaevidencijuzaposlenih_2022_0198.git>
cd evidencija-zap
```

---

## 2️⃣ Instalacija zavisnosti

```bash
npm install
```

---

## 3️⃣ Kreiranje .env fajla

U root folderu kreirati `.env` fajl:

```
DATABASE_URL=postgresql://user:password@localhost:5432/attendance_app
JWT_SECRET=your_secret_key
APP_ORIGIN=http://localhost:3000
WEATHER_LAT=your_latitude
WEATHER_LON=your_longitude
```

---

## 4️⃣ Pokretanje baze (Docker)

```bash
docker-compose up -d db
```

---

## 5️⃣ Migracije i seed

```bash
npx prisma migrate dev
node prisma/seed.js
```

---

## 6️⃣ Pokretanje aplikacije

```bash
npm run dev
```

Aplikacija je dostupna na:

```
http://localhost:3000
```

---

# 🧪 Pokretanje testova

Za test okruženje koristi se posebna baza.

```bash
npm run test
```

Testovi obuhvataju:

- RBAC validaciju
- API funkcionalnost
- Database reset izolaciju
- JWT autentifikaciju

---

# 🐳 Pokretanje kompletne aplikacije preko Docker-a

```bash
docker-compose up --build
```

Aplikacija je dostupna na:

```
http://localhost:3001
```

---

# 🚀 Deploy

Aplikacija je deploy-ovana na Render platformi.

Deploy proces uključuje:

- npm ci
- prisma generate
- prisma migrate deploy
- npm run build
- pokretanje servera
- pokretanje testova
- docker build

---

# 📂 Struktura projekta

```
src/
  app/
    api/
    admin/
    attendance/
    calendar/
    login/
    my-requests/
    register/
    stats/
    swagger/
  components/
  lib/
prisma/
tests/
.github/workflows/
docker-compose.yml
docker/entrypoint.sh
Dockerfile
```

# 📘 API dokumentacija (Swagger / OpenAPI)

Aplikacija sadrži OpenAPI 3.0 specifikaciju backend API-ja.

OpenAPI JSON specifikacija dostupna je na:

```
GET /api/openapi
```

Specifikacija obuhvata:

- Auth rute
- Users rute
- Activities rute
- Attendance rute
- ICS export
- Definisane request/response šeme
- Cookie-based autentifikaciju (auth_token)

OpenAPI dokument se može:

- Otvoriti direktno u browseru
- Importovati u Swagger Editor
- Importovati u Postman

Specifikacija je u skladu sa OpenAPI 3.0.3 standardom.

---

# 📌 Napomena

Seed skripta kreira inicijalnog ADMIN korisnika za testiranje.

Za produkcioni deploy potrebno je:

- Postaviti environment varijable na hosting platformi
- Omogućiti sigurnosne cookie opcije (Secure, SameSite)
- Konfigurisati bazu podataka

---
