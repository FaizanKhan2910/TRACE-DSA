from dataclasses import dataclass


@dataclass
class Video:
    video_id: str
    title: str
    duration: int = 0          # seconds
    has_manual: bool = False   # human English captions
    has_auto: bool = False     # auto-generated English captions
    error: str = ""


@dataclass
class Segment:                 # raw caption/Whisper line
    start: float
    end: float
    text: str


@dataclass
class Chunk:                   # what gets embedded
    video_id: str
    video_title: str
    text: str
    chunk_index: int = 0
    start: float = 0.0
    end: float = 0.0
    url: str = ""
    playlist_id: str = ""
    start_sec: int = 0
    end_sec: int = 0
