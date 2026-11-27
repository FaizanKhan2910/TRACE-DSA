# TRACE-Kunal-Kushwaha-DSA-Lecture-Companion

End-to-end Retrieval-Augmented Generation (RAG) engine (`kdsa`) and interactive Next.js + Three.js web companion (`trace-web`) for searching and asking questions over Kunal Kushwaha's 79.6-hour Java + DSA YouTube playlist (69 lectures, 7,055 Qdrant vectors), with timestamped YouTube citations.

## Web Companion (`trace-web` + `kdsa_api.py`)

Requires Node.js 20+ and Python 3.12+ (`uv`).

1. **Start the local Qdrant + Groq RAG API sidecar:**
   ```bash
   uv run python kdsa_api.py
   ```
2. **Start the Next.js + Three.js frontend:**
   ```bash
   cd trace-web
   npm install
   npm run dev
   ```
   Open `http://127.0.0.1:3000`.

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

   ## How to Use TRACE

TRACE helps you learn from Kunal Kushwaha’s DSA lectures without manually searching through long videos. Ask a question, find the relevant explanation, and jump directly to that moment in the lecture.

### Get started

1. **Open the TRACE workbench.** Enter a DSA or Java question in the search box.
2. **Search the lecture archive.** TRACE retrieves relevant passages from its indexed lecture transcripts.
3. **Read the answer.** Explore the explanation and the transcript excerpts used to generate it.
4. **Verify the source.** Check the lecture title and timestamp associated with a retrieved passage.
5. **Watch the explanation.** Select a source to play the corresponding lecture inside TRACE at the relevant timestamp.

### What can you use it for?

- **Review a concept:** Search for topics like binary search, recursion, AVL tree rotations, or Java HashMap.
- **Find a lecture explanation:** Locate relevant moments without manually scrubbing through an entire video.
- **Revisit something you missed:** Use the transcript excerpts and video timestamps to return to the explanation.
- **Learn in context:** Read an answer, inspect the source passage, and watch the lecture segment that supports it.

### Example

You want to understand why binary search uses:

```java
int mid = low + (high - low) / 2;
```

Search this question in TRACE. It can retrieve relevant lecture passages, show the answer alongside its source information, and let you open the associated lecture at the matching timestamp.

### Who is TRACE for?

TRACE is useful for students learning DSA, developers revising fundamentals, and anyone following the indexed lecture content who wants a faster way to find and revisit explanations.

### A note about coverage

TRACE answers using the lecture material available in its indexed corpus. Results depend on the content and quality of those transcripts. If a topic is not covered, the system may not be able to provide a lecture-grounded answer. Check the linked source to verify the explanation and explore the original lesson.

## Known Limitations

- **Auto-caption errors:** YouTube auto-generated captions occasionally mis-hear technical terms (e.g., variable names, Big-O notation). The `ask` prompt instructs the LLM to fix obvious mis-hearings without inventing facts.
- **Translated/non-English tracks excluded from YouTube fetch:** Videos that only have machine-translated (`tlang=`) or non-English captions are recorded in `data/failed_transcripts.json` and excluded from `fetch`.
- **Whisper backfill:** `transcribe` uses `faster-whisper` (`small`, CPU `int8`) to backfill the 23 failed videos and 2 flagged low-quality videos (`Nckx9qMy_kw`, `apGV9Kg7ics`). Whisper transcripts are scored by `quality` for visibility but never excluded by `chunk`.
