import os
from pathlib import Path
from dotenv import load_dotenv

# Root directory of the project
ROOT = Path(__file__).resolve().parent.parent

# Load environment variables from .env if present
load_dotenv(ROOT / ".env")

# Directories
DATA_DIR = ROOT / "data"
TRANSCRIPT_DIR = ROOT / "transcripts"
PLAYLIST_MANIFEST = DATA_DIR / "playlist_manifest.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)
TRANSCRIPT_DIR.mkdir(parents=True, exist_ok=True)

# Playlist & Collection configurations
PLAYLIST_URL = os.getenv(
    "KDSA_PLAYLIST_URL",
    "https://www.youtube.com/playlist?list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ",
)
COLLECTION = os.getenv("KDSA_COLLECTION", "kunal_java_dsa")

# Embedding & vector store
EMBED_MODEL = os.getenv("KDSA_EMBED_MODEL", "BAAI/bge-small-en-v1.5")
QDRANT_PATH = str(ROOT / "qdrant_data")
QDRANT_URL = os.getenv("QDRANT_URL", "")  # optional hosted Qdrant
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")

# LLM (Groq via OpenAI client)
GROQ_API_KEY = os.getenv("GROQ_API_KEY") or os.getenv("ANTHROPIC_API_KEY", "")
LLM_MODEL = os.getenv("KDSA_LLM_MODEL", "llama-3.3-70b-versatile")

# Safety limits
MIN_DISK_SPACE_GB = float(os.getenv("KDSA_MIN_DISK_SPACE_GB", "2.0"))
