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
    model_name="llama3-8b-8192"
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
    """Endpoint AI Mentor untuk menjelaskan error"""
    # Prompt khusus untuk memberikan karakter "Nalar" sebagai mentor
    prompt = (
        "Kamu adalah 'Nalar', seorang mentor pemrograman yang sangat ramah "
        "untuk siswa sekolah di Indonesia. Gunakan bahasa Indonesia yang santai dan suportif. "
        "Siswa ini sedang belajar dan kodenya mengalami error. "
        f"Berikut adalah kodenya:\n\n{request.code}\n\n"
        "Tolong jelaskan apa yang salah dengan analogi sederhana dan berikan solusi "
        "tanpa langsung memberikan jawaban jadi, ajak mereka berpikir."
    )
    
    try:
        response = llm.invoke(prompt)
        return {"explanation": response.content}
    except Exception as e:
        return {"explanation": "Aduh, otak Nalar lagi sedikit error nih. Coba tanya lagi ya!"}