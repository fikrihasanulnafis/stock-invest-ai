import os
import json
import re
import urllib.request
import urllib.error
import yfinance as yf

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

LANGCHAIN_ENABLED = os.getenv("LANGCHAIN_ENABLED", "true").lower() in ("1", "true", "yes")

router = APIRouter()

OUT_OF_SCOPE_KEYWORDS = {
    "makanan", "resep", "pahlawan", "sejarah", "geografi", "selebriti", "artis", "film",
    "musik", "olahraga", "game", "video", "programming", "coding", "python", "java", "c++",
    "politik", "agama", "travelling", "liburan", "cuaca", "kucing", "anjing",
    "biologi", "fisika", "kimia", "sosiologi", "budaya", "seni", "bahasa", "novel",
    "matematika", "aritmatika", "aljabar", "statistika", "logika"
}
POSITIVE_FINANCE_KEYWORDS = {
    "saham", "investasi", "portofolio", "ojk", "pasar", "modal", "emiten", "dividen", "risiko",
    "indeks", "trading", "trader", "nilai", "harga", "jual", "beli", "kinerja", "analisis",
    "fundamental", "teknikal", "efek", "reksa", "dana", "korporasi", "profit", "laba", "utang",
    "aset", "liabilitas", "neraca", "obligasi", "yield", "volatilitas", "manajemen", "diversifikasi",
    "strategi", "alokasi", "portofolio", "pasar modal", "regulasi", "ojk", "perusahaan"
}

def normalize_text(text: str) -> str:
    return re.sub(r'[^a-z0-9\s]', ' ', text.lower())


def contains_keyword(text: str, keywords: set) -> bool:
    normalized = normalize_text(text)
    return any(f" {keyword} " in f" {normalized} " for keyword in keywords)


def is_out_of_scope_question(message: str) -> bool:
    normalized = normalize_text(message)
    has_out = contains_keyword(normalized, OUT_OF_SCOPE_KEYWORDS)
    has_finance = contains_keyword(normalized, POSITIVE_FINANCE_KEYWORDS)
    has_ticker = bool(re.search(r'\b[A-Za-z]{2,5}(?:\.JK)?\b', message))
    return has_out and not (has_finance or has_ticker)


def extract_ticker_candidates(message: str) -> list:
    normalized = normalize_text(message)
    raw_tokens = re.findall(r'\b[a-z]{2,5}(?:\.jk)?\b', normalized)
    candidates = []
    for token in raw_tokens:
        code = token.upper().replace('.JK', '')
        if code in POSITIVE_FINANCE_KEYWORDS or len(code) < 2:
            continue
        if code not in candidates:
            candidates.append(code)
        if len(candidates) >= 4:
            break
    return candidates


def get_yahoo_finance_data(message: str) -> str:
    candidates = extract_ticker_candidates(message)
    summaries = []
    for code in candidates:
        for symbol in [f"{code}.JK", code]:
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="2d")
                if hist is not None and not hist.empty:
                    last_row = hist.iloc[-1]
                    close = last_row.get('Close')
                    open_price = last_row.get('Open')
                    high = last_row.get('High')
                    low = last_row.get('Low')
                    volume = int(last_row.get('Volume') or 0)
                    currency = 'IDR'
                    summaries.append(
                        f"[DATA REAL-TIME YAHOO FINANCE] {symbol} - Harga terakhir: {close:.0f} {currency}. "
                        f"Open: {open_price:.0f}, High: {high:.0f}, Low: {low:.0f}, Volume: {volume:,}."
                    )
                    break
                fast_info = getattr(ticker, 'fast_info', None)
                if fast_info:
                    last_price = fast_info.get('last_price')
                    if last_price:
                        summaries.append(
                            f"[DATA REAL-TIME YAHOO FINANCE] {symbol} - Harga terakhir: {last_price:.0f} {fast_info.get('currency', 'IDR')} (berdasarkan data pasar terbaru)."
                        )
                        break
            except Exception:
                continue
    return "\n".join(summaries)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Pesan kosong tidak diperbolehkan.")

    if is_out_of_scope_question(request.message):
        return {
            "reply": (
                "Maaf, saya hanya dirancang untuk membantu pengguna dalam koridor investasi saham, pasar modal, portofolio, "
                "dan aturan OJK. Untuk topik di luar itu, saya tidak dapat menjawab dengan tepat."
            )
        }

    groq_api_key = os.getenv("GROQ_API_KEY")
    
    groq_model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    if groq_model in ["llama3-8b-8192", "llama3-8b-instant"]:
        groq_model = "llama-3.1-8b-instant"

    if not groq_api_key:
        print("[CHAT] Warning: GROQ_API_KEY tidak ditemukan. Menggunakan jawaban template.")
        return {"reply": generate_fallback_reply(request.message) + " (Mode Demo: API Key belum dikonfigurasi)"}

    data_pasar_tambahan = get_yahoo_finance_data(request.message)

    system_prompt = (
        "Anda adalah StockInvest AI, asisten virtual ahli dan konsultan spesialis investasi saham, manajemen risiko portofolio, serta regulasi OJK.\n"
        "TUGAS UTAMA: Anda HANYA BOLEH menjawab pertanyaan yang berkaitan dengan ruang lingkup saham, pasar modal, keuangan, bisnis, strategi investasi, portofolio, dan aturan OJK.\n"
        "ATURAN KETAT FILTER TOPIK: Jika pengguna memberikan pertanyaan di luar topik tersebut (seperti makanan, resep, pahlawan, matematika non-keuangan, coding, sejarah, selebriti, geografi, dll), "
        "Jika pengguna memberikan pertanyaan di luar topik tersebut, Anda WAJIB menolak dengan sopan dan tegas dalam 1-2 kalimat saja.\n\n"
        "Anda WAJIB menolak dengan sopan dan tegas. Katakan bahwa Anda hanya dirancang untuk membantu pengguna dalam koridor investasi saham dan aturan OJK.\n\n"
        "PANDUAN KHUSUS UNTUK PERTANYAAN CEPAT (QUICK PROMPTS):\n"
        "Jika pengguna menanyakan salah satu pertanyaan di bawah ini, jawablah secara spesifik dan jelas menggunakan panduan berikut:\n\n"
        
        "1. Pertanyaan: 'Bagaimana cara menggunakan fitur simulasi portofolio untuk memilih alokasi saham yang optimal?'\n"
        "   - Jawab: Jelaskan bahwa pengguna cukup memasukkan kode saham pilihan mereka (dipisahkan koma) dan nominal budget di menu Simulasi. "
        "Sistem backend StockInvest AI akan menggunakan Optimasi Markowitz (SLSQP) untuk menghitung bobot persentase alokasi terbaik yang memaksimalkan Sharpe Ratio (return optimal dengan risiko terminimalisir).\n\n"
        
        "2. Pertanyaan: 'Apa saja indikator penting yang harus diperhatikan ketika melihat saham di StockInvestAI?'\n"
        "   - Jawab: Sebutkan indikator utama yang disediakan aplikasi Anda, yaitu: Harga Terakhir (Close Price), Perubahan Harga harian (Log Change %), Tingkat Risiko (Low/Moderate/High) berdasarkan Annual Volatility, Sharpe Ratio (efisiensi return terhadap risiko), dan Nilai VaR (Value at Risk) bulanan/tahunan untuk mengukur potensi kerugian maksimum.\n\n"
        
        "3. Pertanyaan: 'Bagaimana aturan OJK mempengaruhi pilihan investasi saham di aplikasi ini?'\n"
        "   - Jawab: Jelaskan bahwa StockInvest AI berkomitmen pada edukasi dan transparansi sesuai prinsip perlindungan konsumen OJK. Aplikasi hanya menampilkan saham-saham legal yang tercatat di Bursa Efek Indonesia (BEI) dan diawasi OJK. Sistem tidak memberikan rekomendasi pom-pom atau ajakan mutlak beli/jual, melainkan mendorong diversifikasi portofolio demi keamanan investor.\n\n"
        
        "4. Pertanyaan: 'Bagaimana saya dapat menganalisis risiko portofolio dengan data saham yang tersedia?'\n"
        "   - Jawab: Jelaskan bahwa risiko dianalisis menggunakan metode simulasi Monte Carlo untuk menghitung Value at Risk (VaR). Tunjukkan bahwa aplikasi menampilkan metrik VaR harian, bulanan, dan tahunan dalam bentuk persentase serta nominal rupiah (Rp). Melalui data ini, pengguna bisa mengetahui skenario terburuk potensi penurunan nilai aset mereka pada tingkat kepercayaan 95%.\n\n"
        "PEDOMAN PEMROSESAN DATA YAHOO FINANCE:\n"
        "1. Jika di bawah ini terdapat teks berkode '[DATA REAL-TIME YAHOO FINANCE]', data tersebut adalah data valid ter-update dari pasar. Anda WAJIB mengolah, merangkum, dan menyajikannya sebagai basis utama jawaban Anda!\n"
        "2. Dilarang keras memberikan jawaban template seperti 'Saya tidak memiliki akses real-time' atau 'Saya tidak bisa mengakses internet' jika data real-time sudah disediakan di bawah.\n"
        "3. Jika data mencakup perbandingan beberapa kode saham, lakukan analisis perbandingan ringkas (kelebihan/kekurangan) secara objektif berdasarkan angka tersebut.\n"
        "4. Jika data mencakup pergerakan harga harian (seperti tren tertinggi, terendah, top gainers, atau top losers), jelaskan kondisi volatilitas saham tersebut secara informatif kepada pengguna.\n\n"
        "Aturan Komunikasi & Gaya Bahasa:\n"
        "1. Jawablah menggunakan bahasa Indonesia yang santun, profesional, cerdas, mudah dipahami, dan interaktif.\n"
        "2. Ketika menjawab pertanyaan analisis, perbandingan, atau strategi (seperti defensive stocks), kombinasikan data riil dari Yahoo Finance dengan teori keuangan yang relevan secara komprehensif.\n"
        "3. Jangan pernah memberikan rekomendasi pom-pom atau ajakan mutlak untuk membeli/menjual saham tertentu. Selalu edukasi pengguna tentang pentingnya manajemen risiko, diversifikasi, dan riset mandiri.\n"
        "4. Jika pengguna bertanya tentang risiko portofolio atau fitur simulasi di aplikasi ini, jelaskan implementasi Teori Portofolio Modern (Markowitz) untuk meminimalkan risiko melalui diversifikasi optimal.\n"
    )

    if data_pasar_tambahan:
        system_prompt += data_pasar_tambahan + "\nGunakan data real-time tersebut untuk menjawab pertanyaan pengguna dengan akurat."

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": request.message}
    ]

    if LANGCHAIN_ENABLED and groq_api_key:
        try:
            reply = call_langchain_api(request.message, system_prompt, data_pasar_tambahan, groq_api_key, groq_model)
            return {"reply": reply}
        except Exception as e:
            print("[CHAT] LangChain warning, fallback ke Groq:", e)

    if not groq_api_key:
        print("[CHAT] Warning: GROQ_API_KEY tidak ditemukan. Menggunakan jawaban template.")
        return {"reply": generate_fallback_reply(request.message) + " (Mode Demo: API Key belum dikonfigurasi)"}

    try:
        reply = call_groq_api(messages, groq_api_key, groq_model)
        return {"reply": reply}
    except Exception as e:
        print("[CHAT] Groq API error:", e)
        return {"reply": f"Gagal terkoneksi ke Groq. Silakan periksa kembali konfigurasi API Key dan Model di berkas .env Anda. Eror: {str(e)}"}


def call_groq_api(messages: list, api_key: str, model: str) -> str:
    endpoint = "https://api.groq.com/openai/v1/chat/completions"
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 1200
    }
    
    data = json.dumps(payload).encode("utf-8")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }

    groq_req = urllib.request.Request(endpoint, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(groq_req, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"].strip()
            return "Maaf, saya menerima respon kosong dari pusat pemrosesan AI."
            
    except urllib.error.HTTPError as exc:
        try:
            error_detail = exc.read().decode('utf-8')
            parsed_error = json.loads(error_detail)
            msg = parsed_error.get("error", {}).get("message", error_detail)
        except Exception:
            msg = exc.reason
        raise RuntimeError(f"{msg}")
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Masalah jaringan internal backend: {exc.reason}")


def call_langchain_api(question: str, system_prompt: str, additional_data: str, api_key: str, model: str) -> str:
    try:
        from langchain_groq import ChatGroq
    except ImportError as exc:
        raise RuntimeError(
            "LangChain Groq integration tidak tersedia di lingkungan backend. "
            "Install `langchain-groq` agar ChatGroq dapat digunakan."
        ) from exc

    messages = [
        ("system", system_prompt),
        ("human", question),
    ]

    llm = ChatGroq(model=model, temperature=0.3, max_tokens=1200, api_key=api_key)
    response = llm.invoke(messages)

    if hasattr(response, "content"):
        return response.content.strip()
    return str(response).strip()


def generate_fallback_reply(message: str) -> str:
    text = message.lower()
    if "portofolio" in text or "simulasi" in text:
        return "Saya dapat membantu menjelaskan simulasi portofolio optimal dengan metode Markowitz."
    if "ojk" in text or "aturan" in text:
        return "Pastikan instrumen investasi Anda terdaftar dan diawasi oleh OJK untuk keamanan dana Anda."
    return "Maaf, server AI sedang sibuk. Silakan coba tanyakan seputar portofolio, saham, atau OJK beberapa saat lagi."