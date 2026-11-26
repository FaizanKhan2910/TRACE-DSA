import json
import re
from pathlib import Path
from typing import Any

from kdsa import config
from kdsa.models import Segment

# Bundled common English words (everyday + basic computing/teaching vocabulary)
COMMON_ENGLISH_WORDS: frozenset[str] = frozenset(
    """
    a able about above accept according account across act action actually add address
    admit adult affect after again against age agency agent ago agree agreement ahead
    air all allow almost alone along already also although always am among amount an
    and angle animal another answer any anyone anything appear apply approach area
    argue arm around arrive art article artist as ask assume at attack attention
    attorney audience author authority available avoid away baby back bad bag ball
    bank bar base be beat beautiful because become bed before begin behavior behind
    believe benefit best better between beyond big bill billion bit black blood blue
    board body book born both box boy break bring brother budget build building
    business but buy by call camera campaign can cancer candidate capital car card
    care career carry case catch cause cell center central century certain certainly
    chair challenge chance change character charge check child choice choose church
    citizen city civil claim class clear clearly close coach cold collection college
    color come commercial common community company compare computer concern condition
    conference congress consider consumer contain continue control cost could country
    couple course court cover create crime cultural culture cup current customer cut
    dark data daughter day dead deal death debate decade decide decision deep defense
    degree democrat democratic describe design despite detail determine develop
    development die difference different difficult dinner direction director discover
    discuss discussion disease do doctor dog door down draw dream drive drop drug
    during each early east easy eat economic economy edge education effect effort
    eight either election else employee end energy enjoy enough enter entire
    environment environmental especially establish even evening event ever every
    everybody everyone everything evidence exactly example executive exist expect
    experience expert explain eye face fact factor fail fall family far fast father
    fear federal feel feeling few field fight figure fill film final finally
    financial find fine finger finish fire firm first fish five floor fly focus
    follow food foot for force foreign forget form former forward four free friend
    from front full fund future game garden gas general generation get girl give
    glass go goal good government great green ground group grow growth guess gun guy
    hair half hand hang happen happy hard have he head health hear heart heat heavy
    help her here herself high him himself his history hit hold home hope hospital
    hot hotel hour house how however huge human hundred husband i idea identify if
    image imagine impact important improve in include including increase indeed
    indicate individual industry information inside instead institution interest
    interesting international interview into investment involve issue it item its
    itself job join just keep key kid kill kind kitchen know knowledge land language
    large last late later laugh law lawyer lay lead leader learn least leave left
    leg legal less let letter level lie life light like likely line list listen
    little live local long look lose loss lot love low machine magazine main
    maintain major majority make man manage management manager many market marriage
    material matter may maybe me mean measure media medical meet meeting member
    memory mention message method middle might military million mind minute miss
    mission model modern moment money month more morning most mother mouth move
    movement movie mr mrs much music must my myself name nation national natural
    nature near nearly necessary need network never new news newspaper next nice
    night no none nor north not note nothing notice now number occur of off offer
    office officer official often oh oil ok old on once one only onto open operation
    opportunity option or order organization other others our out outside over own
    owner page pain painting paper parent part participant particular particularly
    partner party pass past patient pattern pay peace people per perform performance
    perhaps period person personal phone physical pick picture piece place plan
    plant play player pm point police policy political politics poor popular
    population position positive possible power practice prepare present president
    pressure pretty prevent price private probably problem process produce product
    production professional professor program project property protect prove provide
    public pull purpose push put quality question quickly quite race radio raise
    range rate rather reach read ready real reality realize really reason receive
    recent recently recognize record red reduce reflect region relate relationship
    religious remain remember remove report represent republican require research
    resource respond response responsibility rest result return reveal rich right
    rise risk road rock role room rule run safe same save say scene school science
    scientist score sea season seat second section security see seek seem sell send
    senior sense series serious serve service set seven several shake share she
    shoot short shot should shoulder show side sign significant similar simple simply
    since sing single sister sit site situation six size skill skin small smile so
    social society soldier some somebody someone something sometimes son song soon
    sort sound source south southern space speak special specific speech spend sport
    spring staff stage stand standard star start state statement station stay step
    still stock stop store story strategy street strong structure student study stuff
    style subject success successful such suddenly suffer suggest summer support
    sure surface system table take talk task tax teach teacher team technology
    television tell ten tend term test than thank that the their them themselves
    then theory there these they thing think third this those though thought
    thousand threat three through throughout throw thus time to today together
    tonight too top total touch toward town trade traditional training travel treat
    treatment tree trial trip trouble true truth try turn tv two type under
    understand unit until up upon us use usually value various very victim view
    violence visit voice vote wait walk wall want war watch water way we weapon
    wear week weight well west western what whatever when where whether which while
    white who whole whom whose why wide wife will win wind window wish with within
    without woman wonder word work worker world worry would write writer wrong
    yard yeah year yes yet you young your yourself
    algorithm algorithms array arrays binary bit bits boolean boot bootcamp bug bugs
    byte bytes cache call called calling class classes code coding compile compiler
    complexity constant data database debug debugging decimal decimals default
    delete deleted directory disk download downloaded dynamic editor element
    elements else error errors example examples execute false file files float
    folder folders for function functions git github graph hash heap hello html
    http ide if import in index input install installed int integer interface
    interview interviews java javascript json key keys language languages laptop
    leetcode linear linked list lists local log logic loop loops map memory merge
    method methods module modules node nodes null number numbers object objects
    online open output override package parameter parameters parse parsed path
    pointer pointers pop print println private problem problems program programming
    project projects public push python queue recursion recursive reference
    repository return returned returns run running runtime search searching
    segment segments select set sets size sort sorted sorting source space stack
    static string strings struct structure structures sub submit subset sum
    syntax system systems table target temp template test testing text thread
    threads time timeout tree trees true tuple type types update updated upload
    uploaded url user users value values var variable variables vector version
    video videos view views void while window windows write written zero
    getting going doing making taking coming looking working talking saying trying
    using having being seeing knowing thinking wanting giving finding telling
    asking seeming feeling leaving calling keeping letting beginning showing
    hearing playing running moving living believing bringing happening writing
    providing sitting standing losing paying meeting including continuing setting
    learning changing leading understanding watching following stopping creating
    speaking reading allowing adding spending growing opening walking winning
    offering remembering loving considering appearing buying waiting serving dying
    sending expecting building staying falling cutting reaching killing remaining
    uploaded downloaded installed compiled executed sorted searched merged
    subscribers views playlist channel lecture lectures tutorial tutorials course
    faang google amazon microsoft meta netflix apple
    t s m re ve ll d don doesn didn isn aren wasn weren won wouldn couldn shouldn
    haven hasn hadn okay guys gonna wanna gotta alright cool awesome basically
    literally definitely obviously means things works gives takes makes comes goes
    looks needs wants uses shows tells asks calls starts ends helps keeps holds
    turns runs plays moves lives feels seems becomes leaves puts sets gets lets
    says knows thinks sees finds points lines words numbers letters parts steps
    ways times days years weeks months hours minutes seconds
    """.split()
)


def score_json3(raw: dict[str, Any]) -> tuple[float, int, int] | None:
    """Compute (score, segment_count, word_count) from json3 acAsrConf if present."""
    confs: list[int | float] = []
    seg_count = 0
    word_count = 0

    for event in raw.get("events", []):
        segs = event.get("segs")
        if not segs:
            continue
        text = "".join(s.get("utf8", "") for s in segs).replace("\n", " ").strip()
        if not text:
            continue
        seg_count += 1
        word_count += len(re.findall(r"[a-z]+", text.lower()))
        for s in segs:
            if "acAsrConf" in s:
                confs.append(s["acAsrConf"])

    if not confs:
        return None

    mean_conf = sum(confs) / len(confs)
    if mean_conf <= 0.0:
        return None

    # Normalize 0..255 YouTube confidence to 0.0..1.0
    score = round(mean_conf / 255.0, 4)
    return score, seg_count, word_count


def score_segments(segments: list[Segment]) -> tuple[float, int, int]:
    """Word-list quality score: fraction of valid tokens in COMMON_ENGLISH_WORDS.
    
    Skips tokens that are purely digits, single letters, or non-alphabetic.
    """
    words: list[str] = []
    for seg in segments:
        for tok in re.findall(r"[a-z]+", seg.text.lower()):
            if len(tok) > 1:  # skip single letters
                words.append(tok)

    if not words:
        return 0.0, len(segments), 0

    hits = sum(1 for w in words if w in COMMON_ENGLISH_WORDS)
    score = round(hits / len(words), 4)
    return score, len(segments), len(words)


def load_quality_map() -> dict[str, dict[str, Any]]:
    """Load data/transcript_quality.json if it exists."""
    path = config.DATA_DIR / "transcript_quality.json"
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, dict) else {}


def save_quality_map(quality_map: dict[str, dict[str, Any]]) -> Path:
    """Save quality results to data/transcript_quality.json."""
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = config.DATA_DIR / "transcript_quality.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(quality_map, f, indent=2, ensure_ascii=False)
    return path
