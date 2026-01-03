import os
import subprocess
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_groq import ChatGroq

# Load file .env untuk ambil API Key
load_dotenv()

app = FastAPI()

# Konfigurasi CORS agar Next.js bisa akses
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inisialisasi AI (Pastikan GROQ_API_KEY ada di file .env lu)
# Kita pake Llama 3 karena kenceng banget buat coding assistant
llm = ChatGroq(
    temperature=0.2, 
    groq_api_key=os.getenv("GROQ_API_KEY"), 
    model_name="llama-3.1-8b-instant"
)

# Schema data yang masuk dari Frontend
class CodeRequest(BaseModel):
    code: str

@app.get("/")
def home():
    return {"status": "Nalar Server is Running!", "ai_status": "Ready"}

@app.post("/run")
async def run_code(request: CodeRequest):
    """Endpoint untuk menjalankan kode Python siswa"""
    try:
        # Eksekusi kode Python dengan timeout 5 detik agar tidak hang
        result = subprocess.run(
            ["python", "-c", request.code],
            capture_output=True,
            text=True,
            timeout=5
        )
        return {
            "stdout": result.stdout,
            "stderr": result.stderr
        }
    except subprocess.TimeoutExpired:
        return {"stderr": "Error: Waktu eksekusi habis (Infinite loop?)"}
    except Exception as e:
        return {"stderr": f"Error System: {str(e)}"}

@app.post("/explain")
async def explain_error(request: CodeRequest):
    # Debug: Cek apakah Key terbaca di terminal backend
    print(f"DEBUG - API KEY: {os.getenv('GROQ_API_KEY')[:10]}...") 
    
    # Prompt yang lebih terstruktur sebagai mentor coding
    system_instruction = (
        "Anda adalah Nalar AI, seorang mentor pemrograman yang handal, ramah, dan profesional. "
        "Tugas Anda adalah menjelaskan kesalahan kode Python kepada pengguna (pelajar) dan memberikan solusi terbaik. "
        "Gunakan bahasa Indonesia yang santun namun teknis. "
        "Format jawaban Anda dengan Markdown yang sangat rapi:\n"
        "1. **Ringkasan Masalah**: Jelaskan dalam satu kalimat apa yang salah.\n"
        "2. **Analisis Mendalam**: Mengapa hal itu terjadi? (Gunakan poin-poin jika perlu).\n"
        "3. **Saran Perbaikan**: Berikan kode yang benar di dalam blok kode Markdown.\n"
        "4. **Tips Nalar**: Berikan satu tips singkat agar pengguna tidak mengulangi kesalahan serupa.\n"
        "Pastikan jawaban tidak terlalu panjang tapi sangat jelas."
    )
    
    user_prompt = f"Tolong jelaskan kesalahan pada kode ini:\n\n```python\n{request.code}\n```"
    
    # Gabungkan instruksi ke dalam satu prompt untuk invoke
    full_prompt = f"{system_instruction}\n\nUser: {user_prompt}"
    
    try:
        response = llm.invoke(full_prompt)
        return {"explanation": response.content}
    except Exception as e:
        # Tampilkan error aslinya di terminal uvicorn
        print(f"ERROR ASLI DARI AI: {str(e)}") 
        return {"explanation": f"Nalar error karena: {str(e)}"}