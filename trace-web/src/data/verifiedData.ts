export interface LectureVideo {
  num: number;
  id: string;
  title: string;
  duration_sec: number;
  url: string;
  transcript_source: string;
  phase: number;
  phase_label: string;
}

export interface RagExcerpt {
  video_title: string;
  video_id: string;
  start_sec: number;
  end_sec?: number;
  timestamp: string;
  url: string;
  score: number;
  snippet: string;
  transcript_text?: string;
  chunk_index?: number;
}

export interface RagDemo {
  id: string;
  short_label: string;
  query: string;
  mode: string;
  sub_queries: string[];
  answer: string;
  excerpts: RagExcerpt[];
}

export const PLAYLIST_VIDEOS: LectureVideo[] = [
  {
    "num": 1,
    "id": "rZ41y93P2Qo",
    "title": "Best Data Structures & Algorithms (DSA) Course - Clear Any FAANG Interview!",
    "duration_sec": 980,
    "url": "https://www.youtube.com/watch?v=rZ41y93P2Qo&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=1",
    "transcript_source": "youtube-auto",
    "phase": 1,
    "phase_label": "01 \u00b7 Foundations & Java"
  },
  {
    "num": 2,
    "id": "Nckx9qMy_kw",
    "title": "Java vs C++ for Data Structures & Algorithms",
    "duration_sec": 675,
    "url": "https://www.youtube.com/watch?v=Nckx9qMy_kw&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=2",
    "transcript_source": "whisper",
    "phase": 1,
    "phase_label": "01 \u00b7 Foundations & Java"
  },
  {
    "num": 3,
    "id": "waGfV-IoOt8",
    "title": "How I Cleared My Google Interviews - Use LeetCode Effectively!",
    "duration_sec": 944,
    "url": "https://www.youtube.com/watch?v=waGfV-IoOt8&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=3",
    "transcript_source": "whisper",
    "phase": 1,
    "phase_label": "01 \u00b7 Foundations & Java"
  },
  {
    "num": 4,
    "id": "apGV9Kg7ics",
    "title": "Complete Git and GitHub Tutorial",
    "duration_sec": 4360,
    "url": "https://www.youtube.com/watch?v=apGV9Kg7ics&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=4",
    "transcript_source": "whisper",
    "phase": 1,
    "phase_label": "01 \u00b7 Foundations & Java"
  },
  {
    "num": 5,
    "id": "wn49bJOYAZM",
    "title": "Introduction to Programming - Types of Languages, Memory Management",
    "duration_sec": 2342,
    "url": "https://www.youtube.com/watch?v=wn49bJOYAZM&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=5",
    "transcript_source": "youtube-auto",
    "phase": 1,
    "phase_label": "01 \u00b7 Foundations & Java"
  },
  {
    "num": 6,
    "id": "lhELGQAV4gg",
    "title": "Flow of Program - Flowcharts & Pseudocode",
    "duration_sec": 1622,
    "url": "https://www.youtube.com/watch?v=lhELGQAV4gg&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=6",
    "transcript_source": "whisper",
    "phase": 1,
    "phase_label": "01 \u00b7 Foundations & Java"
  },
  {
    "num": 7,
    "id": "4EP8YzcN0hQ",
    "title": "Introduction to Java - Architecture & Installation",
    "duration_sec": 1706,
    "url": "https://www.youtube.com/watch?v=4EP8YzcN0hQ&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=7",
    "transcript_source": "whisper",
    "phase": 1,
    "phase_label": "01 \u00b7 Foundations & Java"
  },
  {
    "num": 8,
    "id": "TAtrPoaJ7gc",
    "title": "First Java Program - Input/Output, Debugging and Datatypes",
    "duration_sec": 5543,
    "url": "https://www.youtube.com/watch?v=TAtrPoaJ7gc&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=8",
    "transcript_source": "whisper",
    "phase": 1,
    "phase_label": "01 \u00b7 Foundations & Java"
  },
  {
    "num": 9,
    "id": "ldYLYRNaucM",
    "title": "Conditionals and Loops + Calculator Program",
    "duration_sec": 3755,
    "url": "https://www.youtube.com/watch?v=ldYLYRNaucM&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=9",
    "transcript_source": "youtube-auto",
    "phase": 1,
    "phase_label": "01 \u00b7 Foundations & Java"
  },
  {
    "num": 10,
    "id": "mA23x39DjbI",
    "title": "Switch Statements + Nested Case in Java",
    "duration_sec": 1571,
    "url": "https://www.youtube.com/watch?v=mA23x39DjbI&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=10",
    "transcript_source": "whisper",
    "phase": 1,
    "phase_label": "01 \u00b7 Foundations & Java"
  },
  {
    "num": 11,
    "id": "vvanI8NRlSI",
    "title": "Functions / Methods in Java",
    "duration_sec": 5431,
    "url": "https://www.youtube.com/watch?v=vvanI8NRlSI&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=11",
    "transcript_source": "whisper",
    "phase": 1,
    "phase_label": "01 \u00b7 Foundations & Java"
  },
  {
    "num": 12,
    "id": "n60Dn0UsbEk",
    "title": "Introduction to Arrays and ArrayList in Java",
    "duration_sec": 6353,
    "url": "https://www.youtube.com/watch?v=n60Dn0UsbEk&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=12",
    "transcript_source": "youtube-auto",
    "phase": 1,
    "phase_label": "01 \u00b7 Foundations & Java"
  },
  {
    "num": 13,
    "id": "_HRA37X8N_Q",
    "title": "Linear Search Algorithm - Theory + Code + Questions",
    "duration_sec": 4544,
    "url": "https://www.youtube.com/watch?v=_HRA37X8N_Q&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=13",
    "transcript_source": "youtube-auto",
    "phase": 2,
    "phase_label": "02 \u00b7 Search & Sorting"
  },
  {
    "num": 14,
    "id": "f6UU7V3szVw",
    "title": "Binary Search Algorithm - Theory + Code",
    "duration_sec": 3496,
    "url": "https://www.youtube.com/watch?v=f6UU7V3szVw&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=14",
    "transcript_source": "whisper",
    "phase": 2,
    "phase_label": "02 \u00b7 Search & Sorting"
  },
  {
    "num": 15,
    "id": "W9QJ8HaRvJQ",
    "title": "Binary Search Interview Questions - Google, Facebook, Amazon",
    "duration_sec": 14506,
    "url": "https://www.youtube.com/watch?v=W9QJ8HaRvJQ&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=15",
    "transcript_source": "whisper",
    "phase": 2,
    "phase_label": "02 \u00b7 Search & Sorting"
  },
  {
    "num": 16,
    "id": "enI_KyGLYPo",
    "title": "Binary Search in 2D Arrays",
    "duration_sec": 3537,
    "url": "https://www.youtube.com/watch?v=enI_KyGLYPo&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=16",
    "transcript_source": "youtube-auto",
    "phase": 2,
    "phase_label": "02 \u00b7 Search & Sorting"
  },
  {
    "num": 17,
    "id": "F5MZyqRp_IM",
    "title": "Bubble Sort Algorithm - Theory + Code",
    "duration_sec": 2797,
    "url": "https://www.youtube.com/watch?v=F5MZyqRp_IM&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=17",
    "transcript_source": "whisper",
    "phase": 2,
    "phase_label": "02 \u00b7 Search & Sorting"
  },
  {
    "num": 18,
    "id": "Nd4SCCIHFWk",
    "title": "Selection Sort Algorithm - Theory + Code",
    "duration_sec": 1129,
    "url": "https://www.youtube.com/watch?v=Nd4SCCIHFWk&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=18",
    "transcript_source": "whisper",
    "phase": 2,
    "phase_label": "02 \u00b7 Search & Sorting"
  },
  {
    "num": 19,
    "id": "By_5-RRqVeE",
    "title": "Insertion Sort Algorithm - Theory + Code",
    "duration_sec": 1840,
    "url": "https://www.youtube.com/watch?v=By_5-RRqVeE&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=19",
    "transcript_source": "whisper",
    "phase": 2,
    "phase_label": "02 \u00b7 Search & Sorting"
  },
  {
    "num": 20,
    "id": "JfinxytTYFQ",
    "title": "Cycle Sort - Amazon, Google, Microsoft Interview Questions",
    "duration_sec": 5732,
    "url": "https://www.youtube.com/watch?v=JfinxytTYFQ&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=20",
    "transcript_source": "youtube-auto",
    "phase": 2,
    "phase_label": "02 \u00b7 Search & Sorting"
  },
  {
    "num": 21,
    "id": "zL1DPZ0Ovlo",
    "title": "Strings and StringBuilder in Java",
    "duration_sec": 5249,
    "url": "https://www.youtube.com/watch?v=zL1DPZ0Ovlo&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=21",
    "transcript_source": "youtube-auto",
    "phase": 2,
    "phase_label": "02 \u00b7 Search & Sorting"
  },
  {
    "num": 22,
    "id": "lsOOs5J8ycw",
    "title": "Solve Any Pattern Question With This Trick!",
    "duration_sec": 3440,
    "url": "https://www.youtube.com/watch?v=lsOOs5J8ycw&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=22",
    "transcript_source": "youtube-auto",
    "phase": 2,
    "phase_label": "02 \u00b7 Search & Sorting"
  },
  {
    "num": 23,
    "id": "M2uO2nMT0Bk",
    "title": "Introduction to Recursion - Learn In The Best Way",
    "duration_sec": 6949,
    "url": "https://www.youtube.com/watch?v=M2uO2nMT0Bk&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=23",
    "transcript_source": "youtube-auto",
    "phase": 3,
    "phase_label": "03 \u00b7 Recursion & Backtracking"
  },
  {
    "num": 24,
    "id": "mV3wrLBbuuE",
    "title": "Time and Space Complexity COMPLETE Tutorial - What is Big O?",
    "duration_sec": 8904,
    "url": "https://www.youtube.com/watch?v=mV3wrLBbuuE&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=24",
    "transcript_source": "whisper",
    "phase": 3,
    "phase_label": "03 \u00b7 Recursion & Backtracking"
  },
  {
    "num": 25,
    "id": "fzip9Aml6og",
    "title": "Bitwise Operators + Number Systems - Maths for DSA",
    "duration_sec": 8229,
    "url": "https://www.youtube.com/watch?v=fzip9Aml6og&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=25",
    "transcript_source": "whisper",
    "phase": 3,
    "phase_label": "03 \u00b7 Recursion & Backtracking"
  },
  {
    "num": 26,
    "id": "lmSpZ0bjCyQ",
    "title": "Maths for Data Structures & Algorithms",
    "duration_sec": 6894,
    "url": "https://www.youtube.com/watch?v=lmSpZ0bjCyQ&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=26",
    "transcript_source": "youtube-auto",
    "phase": 3,
    "phase_label": "03 \u00b7 Recursion & Backtracking"
  },
  {
    "num": 27,
    "id": "JxILxTwHukM",
    "title": "Recursion - Level 1 Questions (Theory + Code + Tips)",
    "duration_sec": 4402,
    "url": "https://www.youtube.com/watch?v=JxILxTwHukM&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=27",
    "transcript_source": "youtube-auto",
    "phase": 3,
    "phase_label": "03 \u00b7 Recursion & Backtracking"
  },
  {
    "num": 28,
    "id": "sTdiMLom00U",
    "title": "Recursion - Array Questions (Theory + Code + Tips)",
    "duration_sec": 4728,
    "url": "https://www.youtube.com/watch?v=sTdiMLom00U&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=28",
    "transcript_source": "youtube-auto",
    "phase": 3,
    "phase_label": "03 \u00b7 Recursion & Backtracking"
  },
  {
    "num": 29,
    "id": "ymgnIIclCF0",
    "title": "Recursion - Pattern Questions + Bubble Sort + Selection Sort",
    "duration_sec": 2075,
    "url": "https://www.youtube.com/watch?v=ymgnIIclCF0&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=29",
    "transcript_source": "whisper",
    "phase": 3,
    "phase_label": "03 \u00b7 Recursion & Backtracking"
  },
  {
    "num": 30,
    "id": "iKGAgWdgoRk",
    "title": "Merge Sort Using Recursion (Theory + Complexity + Code)",
    "duration_sec": 2987,
    "url": "https://www.youtube.com/watch?v=iKGAgWdgoRk&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=30",
    "transcript_source": "whisper",
    "phase": 3,
    "phase_label": "03 \u00b7 Recursion & Backtracking"
  },
  {
    "num": 31,
    "id": "Z8svOqamag8",
    "title": "Quick Sort Using Recursion (Theory + Complexity + Code)",
    "duration_sec": 2534,
    "url": "https://www.youtube.com/watch?v=Z8svOqamag8&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=31",
    "transcript_source": "youtube-auto",
    "phase": 3,
    "phase_label": "03 \u00b7 Recursion & Backtracking"
  },
  {
    "num": 32,
    "id": "gdifkIwCJyg",
    "title": "Recursion Subset, Subsequence, String Questions",
    "duration_sec": 5036,
    "url": "https://www.youtube.com/watch?v=gdifkIwCJyg&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=32",
    "transcript_source": "whisper",
    "phase": 3,
    "phase_label": "03 \u00b7 Recursion & Backtracking"
  },
  {
    "num": 33,
    "id": "gDGw0cvFXPQ",
    "title": "Recursion - Permutations (Theory + Code + Tips)",
    "duration_sec": 1522,
    "url": "https://www.youtube.com/watch?v=gDGw0cvFXPQ&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=33",
    "transcript_source": "whisper",
    "phase": 3,
    "phase_label": "03 \u00b7 Recursion & Backtracking"
  },
  {
    "num": 34,
    "id": "9ByWqPzfXDU",
    "title": "Recursion Google, Amazon Questions: Dice Throw & Letter Combinations of a Phone Number",
    "duration_sec": 2316,
    "url": "https://www.youtube.com/watch?v=9ByWqPzfXDU&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=34",
    "transcript_source": "whisper",
    "phase": 3,
    "phase_label": "03 \u00b7 Recursion & Backtracking"
  },
  {
    "num": 35,
    "id": "zg5v2rlV1tM",
    "title": "Backtracking Introduction + Maze Problems - Theory + Code + Tips",
    "duration_sec": 5290,
    "url": "https://www.youtube.com/watch?v=zg5v2rlV1tM&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=35",
    "transcript_source": "youtube-auto",
    "phase": 3,
    "phase_label": "03 \u00b7 Recursion & Backtracking"
  },
  {
    "num": 36,
    "id": "nC1rbW2YSz0",
    "title": "N-Queens, N-Knights, Sudoku Solver (LeetCode) - Backtracking Questions",
    "duration_sec": 4766,
    "url": "https://www.youtube.com/watch?v=nC1rbW2YSz0&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=36",
    "transcript_source": "youtube-auto",
    "phase": 3,
    "phase_label": "03 \u00b7 Recursion & Backtracking"
  },
  {
    "num": 37,
    "id": "BSVKUk58K6U",
    "title": "OOP 1 | Introduction & Concepts - Classes, Objects, Constructors, Keywords",
    "duration_sec": 6147,
    "url": "https://www.youtube.com/watch?v=BSVKUk58K6U&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=37",
    "transcript_source": "youtube-auto",
    "phase": 4,
    "phase_label": "04 \u00b7 OOP Mastery 1\u20137"
  },
  {
    "num": 38,
    "id": "_Ya6CN13t8k",
    "title": "OOP 2 | Packages, Static, Singleton Class, In-built Methods",
    "duration_sec": 4753,
    "url": "https://www.youtube.com/watch?v=_Ya6CN13t8k&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=38",
    "transcript_source": "whisper",
    "phase": 4,
    "phase_label": "04 \u00b7 OOP Mastery 1\u20137"
  },
  {
    "num": 39,
    "id": "46T2wD3IuhM",
    "title": "OOP 3 | Principles - Inheritance, Polymorphism, Encapsulation, Abstraction",
    "duration_sec": 7971,
    "url": "https://www.youtube.com/watch?v=46T2wD3IuhM&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=39",
    "transcript_source": "whisper",
    "phase": 4,
    "phase_label": "04 \u00b7 OOP Mastery 1\u20137"
  },
  {
    "num": 40,
    "id": "W145DXs8fFg",
    "title": "OOP 4 | Access Control, In-built Packages, Object Class",
    "duration_sec": 3045,
    "url": "https://www.youtube.com/watch?v=W145DXs8fFg&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=40",
    "transcript_source": "whisper",
    "phase": 4,
    "phase_label": "04 \u00b7 OOP Mastery 1\u20137"
  },
  {
    "num": 41,
    "id": "rgHZa7-Dibg",
    "title": "OOP 5 | Abstract Classes, Interfaces, Annotations",
    "duration_sec": 4242,
    "url": "https://www.youtube.com/watch?v=rgHZa7-Dibg&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=41",
    "transcript_source": "youtube-auto",
    "phase": 4,
    "phase_label": "04 \u00b7 OOP Mastery 1\u20137"
  },
  {
    "num": 42,
    "id": "OY2lPr8h93U",
    "title": "OOP 6 | Generics, Custom ArrayList, Lambda Expressions, Exception Handling, Object Cloning",
    "duration_sec": 5513,
    "url": "https://www.youtube.com/watch?v=OY2lPr8h93U&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=42",
    "transcript_source": "youtube-auto",
    "phase": 4,
    "phase_label": "04 \u00b7 OOP Mastery 1\u20137"
  },
  {
    "num": 43,
    "id": "9ogGan-R1pc",
    "title": "OOP 7 | Collections Framework, Vector Class, Enums in Java",
    "duration_sec": 1600,
    "url": "https://www.youtube.com/watch?v=9ogGan-R1pc&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=43",
    "transcript_source": "whisper",
    "phase": 4,
    "phase_label": "04 \u00b7 OOP Mastery 1\u20137"
  },
  {
    "num": 44,
    "id": "58YbpRDc4yw",
    "title": "Linked List Tutorial - Singly + Doubly + Circular (Theory + Code + Implementation)",
    "duration_sec": 6957,
    "url": "https://www.youtube.com/watch?v=58YbpRDc4yw&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=44",
    "transcript_source": "youtube-auto",
    "phase": 5,
    "phase_label": "05 \u00b7 Linear DS & Games"
  },
  {
    "num": 45,
    "id": "70tx7KcMROc",
    "title": "Linked List Interview Questions - Google, Facebook, Amazon, Microsoft",
    "duration_sec": 11291,
    "url": "https://www.youtube.com/watch?v=70tx7KcMROc&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=45",
    "transcript_source": "whisper",
    "phase": 5,
    "phase_label": "05 \u00b7 Linear DS & Games"
  },
  {
    "num": 46,
    "id": "rHQI4mrJ3cg",
    "title": "Stacks and Queues Complete Tutorial - Theory + Implementation + Types (Dynamic, Circular)",
    "duration_sec": 5447,
    "url": "https://www.youtube.com/watch?v=rHQI4mrJ3cg&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=46",
    "transcript_source": "youtube-auto",
    "phase": 5,
    "phase_label": "05 \u00b7 Linear DS & Games"
  },
  {
    "num": 47,
    "id": "S9LUYztYLu4",
    "title": "Stacks and Queues Interview Questions - Google, Facebook, Amazon, Microsoft",
    "duration_sec": 8661,
    "url": "https://www.youtube.com/watch?v=S9LUYztYLu4&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=47",
    "transcript_source": "youtube-auto",
    "phase": 5,
    "phase_label": "05 \u00b7 Linear DS & Games"
  },
  {
    "num": 48,
    "id": "jlLNXmi4Nmw",
    "title": "Tic Tac Toe Java Game in Under 15 Minutes",
    "duration_sec": 1036,
    "url": "https://www.youtube.com/watch?v=jlLNXmi4Nmw&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=48",
    "transcript_source": "youtube-auto",
    "phase": 5,
    "phase_label": "05 \u00b7 Linear DS & Games"
  },
  {
    "num": 49,
    "id": "4s1Tcvm00pA",
    "title": "Binary Trees Tutorial - Introduction + Traversals + Code | Binary Search Trees (BST)",
    "duration_sec": 10363,
    "url": "https://www.youtube.com/watch?v=4s1Tcvm00pA&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=49",
    "transcript_source": "youtube-auto",
    "phase": 6,
    "phase_label": "06 \u00b7 Trees, Heaps & HashMaps"
  },
  {
    "num": 50,
    "id": "CVA85JuJEn0",
    "title": "AVL Trees Tutorial | Self Balancing Binary Search Trees",
    "duration_sec": 3974,
    "url": "https://www.youtube.com/watch?v=CVA85JuJEn0&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=50",
    "transcript_source": "youtube-auto",
    "phase": 6,
    "phase_label": "06 \u00b7 Trees, Heaps & HashMaps"
  },
  {
    "num": 51,
    "id": "ciHThtTVNto",
    "title": "Segment Trees Tutorial | Range Queries | Interview Questions",
    "duration_sec": 4403,
    "url": "https://www.youtube.com/watch?v=ciHThtTVNto&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=51",
    "transcript_source": "youtube-auto",
    "phase": 6,
    "phase_label": "06 \u00b7 Trees, Heaps & HashMaps"
  },
  {
    "num": 52,
    "id": "YFZai3fPUQI",
    "title": "StringBuffer in Java | Data Formatting | Working With Large Data",
    "duration_sec": 2181,
    "url": "https://www.youtube.com/watch?v=YFZai3fPUQI&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=52",
    "transcript_source": "youtube-auto",
    "phase": 6,
    "phase_label": "06 \u00b7 Trees, Heaps & HashMaps"
  },
  {
    "num": 53,
    "id": "lHtoypC-4Ps",
    "title": "BigInteger & BigDecimal - Handling Large Numbers in Java",
    "duration_sec": 2097,
    "url": "https://www.youtube.com/watch?v=lHtoypC-4Ps&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=53",
    "transcript_source": "youtube-auto",
    "phase": 6,
    "phase_label": "06 \u00b7 Trees, Heaps & HashMaps"
  },
  {
    "num": 54,
    "id": "b35mlSPOlJg",
    "title": "File Handling in Java Complete Course",
    "duration_sec": 3664,
    "url": "https://www.youtube.com/watch?v=b35mlSPOlJg&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=54",
    "transcript_source": "youtube-auto",
    "phase": 6,
    "phase_label": "06 \u00b7 Trees, Heaps & HashMaps"
  },
  {
    "num": 55,
    "id": "9D-vP-jcc-Y",
    "title": "Binary Tree Questions for Technical Interviews - Google, Facebook, Amazon, Microsoft",
    "duration_sec": 18111,
    "url": "https://www.youtube.com/watch?v=9D-vP-jcc-Y&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=55",
    "transcript_source": "youtube-auto",
    "phase": 6,
    "phase_label": "06 \u00b7 Trees, Heaps & HashMaps"
  },
  {
    "num": 56,
    "id": "Qf-TDPr0nYw",
    "title": "Introduction to Heap Data Structure + Priority Queue + Heapsort Tutorial",
    "duration_sec": 4267,
    "url": "https://www.youtube.com/watch?v=Qf-TDPr0nYw&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=56",
    "transcript_source": "youtube-auto",
    "phase": 6,
    "phase_label": "06 \u00b7 Trees, Heaps & HashMaps"
  },
  {
    "num": 57,
    "id": "XLbvmMz8Fr8",
    "title": "Introduction to HashMap & HashTable in Java",
    "duration_sec": 5986,
    "url": "https://www.youtube.com/watch?v=XLbvmMz8Fr8&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=57",
    "transcript_source": "youtube-auto",
    "phase": 6,
    "phase_label": "06 \u00b7 Trees, Heaps & HashMaps"
  },
  {
    "num": 58,
    "id": "swciWFPq3NE",
    "title": "Karp-Rabin String Matching Algorithm | Substring Search Pattern",
    "duration_sec": 1441,
    "url": "https://www.youtube.com/watch?v=swciWFPq3NE&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=58",
    "transcript_source": "youtube-auto",
    "phase": 7,
    "phase_label": "07 \u00b7 FAANG Hard & Greedy"
  },
  {
    "num": 59,
    "id": "FOo820lJV1Y",
    "title": "Count Sort Algorithm - Theory + Code",
    "duration_sec": 1244,
    "url": "https://www.youtube.com/watch?v=FOo820lJV1Y&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=59",
    "transcript_source": "youtube-auto",
    "phase": 7,
    "phase_label": "07 \u00b7 FAANG Hard & Greedy"
  },
  {
    "num": 60,
    "id": "mLi6VQDqAOs",
    "title": "Radix Sort Algorithm - Theory + Code",
    "duration_sec": 1882,
    "url": "https://www.youtube.com/watch?v=mLi6VQDqAOs&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=60",
    "transcript_source": "youtube-auto",
    "phase": 7,
    "phase_label": "07 \u00b7 FAANG Hard & Greedy"
  },
  {
    "num": 61,
    "id": "XLfgeaYHinM",
    "title": "Huffman Coding Greedy Algorithm | Text Compression",
    "duration_sec": 2966,
    "url": "https://www.youtube.com/watch?v=XLfgeaYHinM&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=61",
    "transcript_source": "youtube-auto",
    "phase": 7,
    "phase_label": "07 \u00b7 FAANG Hard & Greedy"
  },
  {
    "num": 62,
    "id": "U4YmISZViSs",
    "title": "Easily Solve Range Query Interview Problems with Square Root Decomposition/Mo's Algorithm",
    "duration_sec": 2357,
    "url": "https://www.youtube.com/watch?v=U4YmISZViSs&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=62",
    "transcript_source": "youtube-auto",
    "phase": 7,
    "phase_label": "07 \u00b7 FAANG Hard & Greedy"
  },
  {
    "num": 63,
    "id": "LFGBTFxHJII",
    "title": "Binary Tree from Preorder & Inorder Traversal - Advance Tree Questions",
    "duration_sec": 1692,
    "url": "https://www.youtube.com/watch?v=LFGBTFxHJII&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=63",
    "transcript_source": "youtube-auto",
    "phase": 7,
    "phase_label": "07 \u00b7 FAANG Hard & Greedy"
  },
  {
    "num": 64,
    "id": "Qdr3ohMSxBo",
    "title": "Vertical Order Traversal of a Binary Tree - Google Interview Question",
    "duration_sec": 1349,
    "url": "https://www.youtube.com/watch?v=Qdr3ohMSxBo&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=64",
    "transcript_source": "youtube-auto",
    "phase": 7,
    "phase_label": "07 \u00b7 FAANG Hard & Greedy"
  },
  {
    "num": 65,
    "id": "2odLxQWYDi0",
    "title": "Word Ladder - LeetCode Hard - Google Phone Screen Interview Question",
    "duration_sec": 1065,
    "url": "https://www.youtube.com/watch?v=2odLxQWYDi0&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=65",
    "transcript_source": "youtube-auto",
    "phase": 7,
    "phase_label": "07 \u00b7 FAANG Hard & Greedy"
  },
  {
    "num": 66,
    "id": "oB1EIXIDS8s",
    "title": "Two Sum IV - Google, Amazon, Facebook Interview Question",
    "duration_sec": 518,
    "url": "https://www.youtube.com/watch?v=oB1EIXIDS8s&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=66",
    "transcript_source": "youtube-auto",
    "phase": 7,
    "phase_label": "07 \u00b7 FAANG Hard & Greedy"
  },
  {
    "num": 67,
    "id": "guzgnCSafg4",
    "title": "Kth Smallest Element in a BST - Google, Amazon, Facebook Interview Question",
    "duration_sec": 862,
    "url": "https://www.youtube.com/watch?v=guzgnCSafg4&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=67",
    "transcript_source": "youtube-auto",
    "phase": 7,
    "phase_label": "07 \u00b7 FAANG Hard & Greedy"
  },
  {
    "num": 68,
    "id": "kNZ5VIkqReU",
    "title": "Convert Binary Tree to Doubly Linked List - FAANG Interview Question",
    "duration_sec": 636,
    "url": "https://www.youtube.com/watch?v=kNZ5VIkqReU&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=68",
    "transcript_source": "youtube-auto",
    "phase": 7,
    "phase_label": "07 \u00b7 FAANG Hard & Greedy"
  },
  {
    "num": 69,
    "id": "CxNRKTp6_9s",
    "title": "Correct Binary Tree That Has Two Nodes Swapped - FAANG Interview Question",
    "duration_sec": 632,
    "url": "https://www.youtube.com/watch?v=CxNRKTp6_9s&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=69",
    "transcript_source": "youtube-auto",
    "phase": 7,
    "phase_label": "07 \u00b7 FAANG Hard & Greedy"
  }
];

export const RAG_DEMOS: RagDemo[] = [
  {
    "id": "binary-search-mid",
    "short_label": "Binary search midpoint",
    "query": "Why does Kunal use start + (end - start) / 2 instead of (start + end) / 2 in Binary Search?",
    "mode": "Standard Search (k=4)",
    "sub_queries": [
      "Why start + (end - start) / 2 in Binary Search Java int overflow"
    ],
    "answer": "Adding start + end directly can exceed Java's Integer.MAX_VALUE when both indices are large, overflowing into negative indices. Computing start + (end - start) / 2 yields the exact same midpoint algebraically without ever overflowing 32-bit int.",
    "excerpts": [
      {
        "video_title": "Binary Search Interview Questions - Google, Facebook, Amazon",
        "video_id": "W9QJ8HaRvJQ",
        "start_sec": 2366,
        "timestamp": "39:26",
        "url": "https://www.youtube.com/watch?v=W9QJ8HaRvJQ&t=2366s",
        "score": 0.81,
        "snippet": "because the condition is violated, end is now smaller than start. So, we need to find a floor, you return end, if you need to find the start, you return ceiling. Okay, let us code this. Now, for the last time, if you are having any doubts related to hey Kunal, why is it..."
      },
      {
        "video_title": "Binary Search Algorithm - Theory + Code",
        "video_id": "f6UU7V3szVw",
        "start_sec": 1949,
        "timestamp": "32:29",
        "url": "https://www.youtube.com/watch?v=f6UU7V3szVw&t=1949s",
        "score": 0.802,
        "snippet": "case you will get some error. So are you able to understand what the problem is over here? If you do start plus end for very large numbers, together when we add these two numbers it might exceed the range of integer, hence it may give you some error. In that case better..."
      },
      {
        "video_title": "Binary Search Interview Questions - Google, Facebook, Amazon",
        "video_id": "W9QJ8HaRvJQ",
        "start_sec": 3642,
        "timestamp": "1:00:42",
        "url": "https://www.youtube.com/watch?v=W9QJ8HaRvJQ&t=3642s",
        "score": 0.793,
        "snippet": "so no need to return the middle value. And this will shall be just be start is equal to mid plus one. That is it. In the end, we just need to return the character over here, right? So character. Here, this check will be removed. Because this will already be covered in t..."
      },
      {
        "video_title": "Recursion - Array Questions (Theory + Code + Tips)",
        "video_id": "sTdiMLom00U",
        "start_sec": 4543,
        "timestamp": "1:15:43",
        "url": "https://www.youtube.com/watch?v=sTdiMLom00U&t=4543s",
        "score": 0.792,
        "snippet": "end like the second half. In that case, I can just say return search in the second half. So, basically I can say start is equal to mid plus one and will be remaining as it is. Okay? one. Otherwise, this is not working, then only option remaining now is the left hand sid..."
      }
    ]
  },
  {
    "id": "avl-rotations",
    "short_label": "LR rotation in AVL trees",
    "query": "Explain AVL tree balance factors and the four rotation cases with code logic and time complexity",
    "mode": "Deep Search (RRF \u00b7 4 Sub-Queries)",
    "sub_queries": [
      "Explain AVL tree balance factors and the four rotation cases with time complexity",
      "AVL tree balance factor definition and calculation Java",
      "AVL tree LL LR RR RL rotation cases code implementation Java",
      "AVL tree insertion and deletion rebalancing logic with time complexity analysis"
    ],
    "answer": "AVL trees keep height(left) - height(right) within [-1, +1] at every node. An insertion imbalance across Parent (P), Child (C), and Grandchild triggers one of four cases: LL (rightRotate(P)), RR (leftRotate(P)), LR (leftRotate(C) then rightRotate(P)), or RL (rightRotate(C) then leftRotate(P)). Fixing an imbalance takes at most two O(1) rotations while height stays logarithmic, so insertion remains O(log n).",
    "excerpts": [
      {
        "video_title": "AVL Trees Tutorial | Self Balancing Binary Search Trees",
        "video_id": "CVA85JuJEn0",
        "start_sec": 2460,
        "timestamp": "41:00",
        "url": "https://www.youtube.com/watch?v=CVA85JuJEn0&t=2460s",
        "score": 0.835,
        "snippet": "let me talk about the important part time complexity time complexity let's say we talk about for adding because that's a performance function we are performing so time complexity because at all the times 3 will be balanced so it will be log of n okay log of n can you te..."
      },
      {
        "video_title": "AVL Trees Tutorial | Self Balancing Binary Search Trees",
        "video_id": "CVA85JuJEn0",
        "start_sec": 2527,
        "timestamp": "42:07",
        "url": "https://www.youtube.com/watch?v=CVA85JuJEn0&t=2527s",
        "score": 0.821,
        "snippet": "X maximum two rotations which is constant so total complexity comes out to be o of log n okay now we can code all right let's start with the coding part uh you can check out the link to my code sample in the description below that is going to be nice because then you ca..."
      },
      {
        "video_title": "AVL Trees Tutorial | Self Balancing Binary Search Trees",
        "video_id": "CVA85JuJEn0",
        "start_sec": 2303,
        "timestamp": "38:23",
        "url": "https://www.youtube.com/watch?v=CVA85JuJEn0&t=2303s",
        "score": 0.808,
        "snippet": "so this is left right case first left rotate child then right rotate p left rotate child right rotate p so left rotate on five then right rotate on 10 right routine not a problem at all very simple okay similarly now this case insert 15 is added over here okay is it mak..."
      }
    ]
  },
  {
    "id": "cyclic-sort",
    "short_label": "Cyclic sort 1..N proof",
    "query": "In Cyclic Sort, how does index mapping work for numbers 1 to N and why is time complexity O(N)?",
    "mode": "Deep Search (RRF \u00b7 4 Sub-Queries)",
    "sub_queries": [
      "Cyclic Sort index mapping formula 1 to N Java",
      "Cyclic Sort while loop time complexity O(N) explanation",
      "Cyclic Sort Amazon Google Microsoft interview patterns"
    ],
    "answer": "For values in range 1..N, every number v belongs at index (v - 1). Rather than incrementing i unconditionally, the loop swaps arr[i] directly to its target slot arr[i] - 1 until arr[i] matches its index. In the worst case at most (N - 1) swaps plus N checks execute, yielding O(N) total time and O(1) auxiliary space.",
    "excerpts": [
      {
        "video_title": "Maths for Data Structures & Algorithms",
        "video_id": "lmSpZ0bjCyQ",
        "start_sec": 3889,
        "timestamp": "1:04:49",
        "url": "https://www.youtube.com/watch?v=lmSpZ0bjCyQ&t=3889s",
        "score": 0.818,
        "snippet": "you're actually storing like the square root of n divided by two, like half numbers. So, it's That's why the complexity is square root of n because constants do not matter in big O notation. We have already learned that. So, the first ones, these first ones will already..."
      },
      {
        "video_title": "Insertion Sort Algorithm - Theory + Code",
        "video_id": "By_5-RRqVeE",
        "start_sec": 970,
        "timestamp": "16:10",
        "url": "https://www.youtube.com/watch?v=By_5-RRqVeE&t=970s",
        "score": 0.817,
        "snippet": "i minus two only, because I'm taking j plus one. Okay, that is basically how this thing works. Alright, let's talk about the complexity analysis. So complexity, you know, in the worst case, it's giving o of n squared, n is the number of elements. Why in the worst case c..."
      },
      {
        "video_title": "Introduction to Heap Data Structure + Priority Queue + Heapsort Tutorial",
        "video_id": "Qf-TDPr0nYw",
        "start_sec": 4107,
        "timestamp": "1:08:27",
        "url": "https://www.youtube.com/watch?v=Qf-TDPr0nYw&t=4107s",
        "score": 0.812,
        "snippet": "complexity is O of two raised to power k. Which is equal to O of n. So, it is not O of n log n. It is O of n. That was a little confusing, but I think if I dive too much into the mathematics, it's also something they won't ask you in your interviews that much because it..."
      },
      {
        "video_title": "Introduction to Heap Data Structure + Priority Queue + Heapsort Tutorial",
        "video_id": "Qf-TDPr0nYw",
        "start_sec": 432,
        "timestamp": "7:12",
        "url": "https://www.youtube.com/watch?v=Qf-TDPr0nYw&t=432s",
        "score": 0.812,
        "snippet": "But there's a problem here which is very obvious. Inserting an element is taking O of n time. Why? Because in the worst case scenario you insert an item, then you have to sort the array or whatever. Or actually not O of n time. Um O of n log n time. Yeah. O of n log n...."
      }
    ]
  },
  {
    "id": "n-queens",
    "short_label": "N-Queens backtracking",
    "query": "How does Kunal solve the N-Queens problem with backtracking and check board conflicts?",
    "mode": "Deep Search (RRF \u00b7 3 Sub-Queries)",
    "sub_queries": [
      "N-Queens backtracking board recursion base case Java",
      "N-Queens isSafe vertical left diagonal right diagonal check",
      "N-Queens time complexity recurrence relation Java"
    ],
    "answer": "Place queens row-by-row from top to bottom. Because each row receives only one queen and rows below are still empty, isSafe only scans vertically upward, diagonally up-left (min(row, col) steps), and diagonally up-right (min(row, board.length - col - 1) steps). When row == board.length, print a valid board and backtrack cleanly.",
    "excerpts": [
      {
        "video_title": "N-Queens, N-Knights, Sudoku Solver (LeetCode) - Backtracking Questions",
        "video_id": "nC1rbW2YSz0",
        "start_sec": 1189,
        "timestamp": "19:49",
        "url": "https://www.youtube.com/watch?v=nC1rbW2YSz0&t=1189s",
        "score": 0.803,
        "snippet": "covered like multiple times. I can even mention the videos in which I explained in detail. Permutations video over there I explained the for loop in detail. But, the maze problems that we did in the previous video should be more than enough to understand this. Let's cod..."
      },
      {
        "video_title": "N-Queens, N-Knights, Sudoku Solver (LeetCode) - Backtracking Questions",
        "video_id": "nC1rbW2YSz0",
        "start_sec": 2205,
        "timestamp": "36:45",
        "url": "https://www.youtube.com/watch?v=nC1rbW2YSz0&t=2205s",
        "score": 0.797,
        "snippet": "you know, added your queen, you can make it even more complicated. Some people are like, I will I like to make things complicated. Kunal, why did you do like this? We love complicated stuff. We don't like your uh straightforward small code method. We want things to be c..."
      },
      {
        "video_title": "N-Queens, N-Knights, Sudoku Solver (LeetCode) - Backtracking Questions",
        "video_id": "nC1rbW2YSz0",
        "start_sec": 42,
        "timestamp": "0:42",
        "url": "https://www.youtube.com/watch?v=nC1rbW2YSz0&t=42s",
        "score": 0.792,
        "snippet": "previous video that I did was dedicated on backtracking, what it is, why we are doing it, tips and tricks, and patterns, and everything. All the things were covered in that. And now it's time to build on top of those questions and those concepts and do some questions. S..."
      }
    ]
  },
  {
    "id": "karp-rabin",
    "short_label": "Karp-Rabin rolling hash",
    "query": "How does Karp-Rabin rolling hash achieve O(1) window shifts for substring matching?",
    "mode": "Standard Search (k=4)",
    "sub_queries": [
      "Karp-Rabin rolling hash substring matching formula"
    ],
    "answer": "Karp-Rabin hashes the needle pattern and slides a matching window across the haystack. Shifting one character right subtracts the outgoing leftmost term, divides/shifts power terms, and adds the incoming character in O(1) time\u2014verifying character equality only on a hash match.",
    "excerpts": [
      {
        "video_title": "Karp-Rabin String Matching Algorithm | Substring Search Pattern",
        "video_id": "swciWFPq3NE",
        "start_sec": 663,
        "timestamp": "11:03",
        "url": "https://www.youtube.com/watch?v=swciWFPq3NE&t=663s",
        "score": 0.838,
        "snippet": "these are the false positive this one this case but the probability of that happening is very low so we'll go ahead and we'll do the normal carp and Reon algorithm okay so very simple stuff um what do I need I need a hash function I need a way to change the hash when I..."
      },
      {
        "video_title": "Karp-Rabin String Matching Algorithm | Substring Search Pattern",
        "video_id": "swciWFPq3NE",
        "start_sec": 702,
        "timestamp": "11:42",
        "url": "https://www.youtube.com/watch?v=swciWFPq3NE&t=702s",
        "score": 0.828,
        "snippet": "this so delete previous character add new character okay when I move forward by one not a problem I can do that so I'll create new file car rebin do Java okay car ran. Java what I'm going to do is for this rolling hash this is known as rolling hash function rolling hash..."
      },
      {
        "video_title": "Karp-Rabin String Matching Algorithm | Substring Search Pattern",
        "video_id": "swciWFPq3NE",
        "start_sec": 859,
        "timestamp": "14:19",
        "url": "https://www.youtube.com/watch?v=swciWFPq3NE&t=859s",
        "score": 0.828,
        "snippet": "hash I will give it the previous hash value I will give it the old character I will give it the new new character and I will give it the pattern length Okay I'm going to give it the length so the pattern that we are searching for so previous hash so this a I have to rem..."
      }
    ]
  },
  {
    "id": "hashmap-collisions",
    "short_label": "HashMap chaining & load factor",
    "query": "How do HashMaps handle collisions using chaining and rehash on load factor?",
    "mode": "Deep Search (RRF \u00b7 3 Sub-Queries)",
    "sub_queries": [
      "HashMap hash function compression chaining linked list Java",
      "HashMap load factor 0.5 0.75 doubling capacity amortized O(1)",
      "HashMap treeify red black tree Java 8 collision handling"
    ],
    "answer": "Keys pass through hashCode() and modulo compression into fixed buckets. When two keys collide on a bucket index, chaining stores entries in a linked list (upgrading to a balanced tree past threshold in Java 8+). Once size / capacity exceeds load factor (e.g., 0.5 or 0.75), the array doubles and rehashes all entries for O(1) amortized lookups.",
    "excerpts": [
      {
        "video_title": "Introduction to HashMap & HashTable in Java",
        "video_id": "XLbvmMz8Fr8",
        "start_sec": 1560,
        "timestamp": "26:00",
        "url": "https://www.youtube.com/watch?v=XLbvmMz8Fr8&t=1560s",
        "score": 0.834,
        "snippet": "function is uh just modulo by the aray size okay but there are multiple hash functions that we'll we'll look at we'll look into it right now so Collision two ways to resolve Collision way number one is chaining and way number two is open addressing okay sounds good so w..."
      },
      {
        "video_title": "Introduction to HashMap & HashTable in Java",
        "video_id": "XLbvmMz8Fr8",
        "start_sec": 2930,
        "timestamp": "48:50",
        "url": "https://www.youtube.com/watch?v=XLbvmMz8Fr8&t=2930s",
        "score": 0.827,
        "snippet": "become M by4 then half the size now this is O of1 amortized time okay sounds good easy let's move forward okay now we looked at chaining one of the ways to prevent collisions another way to prevent Collision is known as open addressing again I have not looked at the cod..."
      },
      {
        "video_title": "Introduction to HashMap & HashTable in Java",
        "video_id": "XLbvmMz8Fr8",
        "start_sec": 2973,
        "timestamp": "49:33",
        "url": "https://www.youtube.com/watch?v=XLbvmMz8Fr8&t=2973s",
        "score": 0.816,
        "snippet": "collisions using open addressing it means no chaining so we will use all the indices or elements like slots in the table only we will not create any link list or whatever okay so idea here is only one item per slot okay so the size should be greater than equal to the nu..."
      }
    ]
  }
];
