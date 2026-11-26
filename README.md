# Kunal Java DSA RAG (`kdsa`)

End-to-end Retrieval-Augmented Generation (RAG) CLI for searching and asking questions over Kunal Kushwaha's Java + DSA YouTube playlist, with timestamped YouTube citations.

## Setup

Requires Python 3.12+ and [`uv`](https://docs.astral.sh/uv/).

```bash
uv sync
cp .env.example .env
```

Edit `.env` and set your keys:
- `KDSA_PLAYLIST_URL` — YouTube playlist URL (defaults to Kunal's Java + DSA playlist)
- `KDSA_COLLECTION` — Qdrant collection name (default: `kunal_java_dsa`)
- `KDSA_EMBED_MODEL` — fastembed model (default: `BAAI/bge-small-en-v1.5`)
- `QDRANT_URL` — optional hosted Qdrant URL (leave blank for local `qdrant_data/`)
- `GROQ_API_KEY` — required for `ask` with Groq
- `KDSA_LLM_MODEL` — Groq model name (default: `llama-3.3-70b-versatile`)

## Command Order

1. **Verify playlist & caption availability**
   ```bash
   uv run python -m kdsa.cli verify
   ```
2. **Fetch English captions**
   ```bash
   uv run python -m kdsa.cli fetch --delay 1.5
   ```
3. **Score transcript quality**
   ```bash
   uv run python -m kdsa.cli quality
   ```
4. **Transcribe missing/low-quality videos with Whisper (optional)**
   ```bash
   uv run python -m kdsa.cli transcribe --limit 1
   uv run python -m kdsa.cli transcribe
   ```
5. **Chunk transcripts**
   ```bash
   uv run python -m kdsa.cli chunk
   ```
6. **Embed and index into Qdrant**
   ```bash
   uv run python -m kdsa.cli index --recreate
   ```
   Or run steps 2–6 incrementally in one command:
   ```bash
   uv run python -m kdsa.cli build
   ```
7. **Search, Ask, Deep Research, and Evaluate**
   ```bash
   uv run python -m kdsa.cli search "how does binary search work"
   uv run python -m kdsa.cli ask "how does quick sort work?"
   uv run python -m kdsa.cli deep "In Cyclic Sort, how does the index mapping change for 1 to N vs 0 to N, and why is complexity O(N)?"
   uv run python -m kdsa.cli ask "explain AVL rotations" --no-llm
   uv run python -m kdsa.cli eval
   ```

## Known Limitations

- **Auto-caption errors:** YouTube auto-generated captions occasionally mis-hear technical terms (e.g., variable names, Big-O notation). The `ask` prompt instructs the LLM to fix obvious mis-hearings without inventing facts.
- **Translated/non-English tracks excluded from YouTube fetch:** Videos that only have machine-translated (`tlang=`) or non-English captions are recorded in `data/failed_transcripts.json` and excluded from `fetch`.
- **Whisper backfill:** `transcribe` uses `faster-whisper` (`small`, CPU `int8`) to backfill the 23 failed videos and 2 flagged low-quality videos (`Nckx9qMy_kw`, `apGV9Kg7ics`). Whisper transcripts are scored by `quality` for visibility but never excluded by `chunk`.
