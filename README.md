# 📈 StockInvest AI

**Platform Analisis Saham dan Investasi Berbasis AI**

StockInvest AI adalah aplikasi web yang memadukan analisis pasar saham, data real-time, dan fitur AI untuk membantu pengguna melakukan riset dan simulasi investasi saham Indonesia.

---

## ✨ Ringkasan

StockInvest AI hadir untuk:

- Menyajikan data IHSG dan saham BEI dalam tampilan visual
- Memberikan simulasi portofolio berbasis optimasi Markowitz
- Menyediakan fitur chat AI untuk konsultasi investasi
- Menampilkan data saham real-time menggunakan Yahoo Finance
- Menggunakan referensi OJK sebagai dasar edukasi investasi

---

## 🧩 Struktur Proyek Saat Ini

Proyek dibagi menjadi dua modul utama:

- `backend/` — Backend FastAPI dengan banyak endpoint pasar, chat, dan simulasi portofolio
- `frontend/` — Frontend React untuk pengalaman pengguna

```text
stock-invest-ai/
├── backend/                          # FastAPI backend
│   ├── .env                          # Konfigurasi runtime environment
│   ├── data/                         # Sumber data dan referensi OJK
│   │   ├── __init__.py
│   │   ├── referensi_ojk.txt
│   │   └── user_selection.py         # State pilihan saham pengguna
│   ├── main.py                       # Entry point FastAPI
│   └── routers/                      # API routes
│       ├── chat.py                   # Chat AI endpoint
│       ├── ihsg.py                   # IHSG endpoint
│       ├── market.py                 # Market movers, AI picks, forecast
│       ├── portfolio.py              # Simulasi portofolio & optimasi
│       └── realtime_stock.py         # Harga saham real-time per ticker
├── frontend/                         # React frontend
│   ├── package.json                  # Dependensi dan skrip npm
│   ├── public/                       # File statis
│   └── src/                          # Kode sumber React
│       ├── App.js
│       ├── App.css
│       ├── index.js
│       ├── logo.svg
│       ├── reportWebVitals.js
│       ├── setupTests.js
│       └── components/               # UI components
│           ├── Chat.js
│           ├── Market.js
│           └── Portfolio.js
└── readme                            # Dokumentasi ini
```

---

## 🛠️ Teknologi Utama

### Backend

- FastAPI
- yfinance
- NumPy, pandas, SciPy
- python-dotenv
- CORS middleware

### Frontend

- React 19
- Tailwind CSS 4
- Recharts
- React Fast Marquee
- React Scripts

---

## ⚙️ Persiapan Lingkungan

### Prasyarat

- Python 3.8+ atau lebih tinggi
- Node.js 14+ atau lebih tinggi
- Koneksi internet untuk `yfinance`
- Git

---

## 🚀 Cara Menjalankan Proyek

### 1. Clone repository

```bash
git clone <repository-url>
cd stock-invest-ai
```

### 2. Backend

#### 2.1 Buat virtual environment

```bash
python -m venv .venv
```

#### 2.2 Aktifkan virtual environment

```powershell
.venv\Scripts\activate
```

#### 2.3 Install dependensi backend

```bash
cd backend
pip install fastapi uvicorn yfinance numpy pandas scipy python-dotenv
```

#### 2.4 Konfigurasi environment

Buka `backend/.env` dan atur nilai:

```text
LANGCHAIN_ENABLE=true
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
```

Jika `GROQ_API_KEY` tidak dimasukkan, fitur chat akan fallback ke balasan template.

#### 2.5 Jalankan backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> Backend tersedia di `http://localhost:8000`

---

### 3. Frontend

#### 3.1 Install dependensi frontend

```bash
cd ../frontend
npm install
```

#### 3.2 Jalankan frontend

```bash
npm start
```

> Frontend tersedia di `http://localhost:3000`

---

## 📡 Endpoint Backend

### Umum

- `GET /` — Health check API

### Portofolio

- `POST /api/simulate` — Simulasi optimasi portofolio saham

### Market

- `GET /api/market-movers` — Top gainers, top losers, sektor rotation, AI picks, forecast
- `GET /api/live-market` — Data pasar yang disimulasikan secara berkala

### IHSG

- `GET /api/ihsg` — Data indeks IHSG dan chart 1 tahun

### Chat AI

- `POST /api/chat` — Konsultasi AI investasi berbasis GROQ dan filter topik

### Real-time Stock

- `GET /api/realtime-stock/{ticker}` — Data harga real-time untuk ticker `.JK`

---