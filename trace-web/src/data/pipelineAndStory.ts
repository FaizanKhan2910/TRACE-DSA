export interface TimelineBeat {
  id: string;
  year: string;
  tag: string;
  org: string;
  role: string;
  headline: string;
  summary: string;
  proof: string;
}

export interface VectorClusterMeta {
  phase: number;
  label: string;
  short: string;
  color: string;
  center: [number, number, number];
  sampleQueryId: string;
}

export const TIMELINE_BEATS: TimelineBeat[] = [
  {
    id: "2019",
    year: "2019",
    tag: "v2019.05 // RED HAT GSoC",
    org: "Red Hat Middleware",
    role: "Google Summer of Code Developer",
    headline: "Shipping upstream Kubernetes tooling on fabric8io.",
    summary:
      "While still an undergraduate, Kunal built production Java Kubernetes & OpenShift client features inside Red Hat's upstream fabric8io ecosystem—learning distributed systems at kernel-level rigor before ever hitting record on YouTube.",
    proof: "GSoC '19 Contributor · Java Kubernetes Client",
  },
  {
    id: "2020-cncf",
    year: "2020",
    tag: "v2020.06 // CNCF THANOS & QUARKUS",
    org: "Cloud Native Computing Foundation",
    role: "CNCF Intern & GSoC '20 Mentor",
    headline: "Observability engineering on Thanos & mentoring Quarkus.",
    summary:
      "Interned with the Linux Foundation / CNCF building BlockViewer observability tools inside Thanos (high-availability Prometheus long-term storage), and returned as a GSoC Mentor guiding Gradle tooling on Quarkus.",
    proof: "CNCF Intern · Thanos BlockViewer · Quarkus Mentor",
  },
  {
    id: "2020-mlh",
    year: "2020",
    tag: "v2020.10 // META JEST & MLH",
    org: "Major League Hacking × GitHub",
    role: "MLH Fellow, Coach & GitHub Campus Expert",
    headline: "Contributing to Meta's Jest & unlocking student open source.",
    summary:
      "Shipped test-runner fixes directly to Facebook's Jest framework as an MLH Fellow, stepped up as an MLH Team Leader, and qualified as a GitHub Campus Expert to bring open-source literacy to campuses worldwide.",
    proof: "Meta Jest OSS · MLH Coach · GitHub Campus Expert",
  },
  {
    id: "2021",
    year: "2021",
    tag: "v2021.08 // WEMAKEDEVS & JAVA+DSA",
    org: "WeMakeDevs (ex-Community Classroom)",
    role: "Founder & Chief Educator",
    headline: "Zero-paywall CS: 69 unedited marathons & 24.2K★ open repo.",
    summary:
      "Refusing to put interview prep behind paywalls, Kunal released his entire 79.6-hour Java + DSA syllabus and DSA-Bootcamp-Java open source—growing WeMakeDevs to 200,000+ builders across global workshops and hackathons.",
    proof: "24.2K★ GitHub · 13.6K Forks · 200K+ Community",
  },
  {
    id: "2022",
    year: "2022–24",
    tag: "v2022–24 // CIVO FIELD CTO",
    org: "Civo · CNCF · GitHub Stars",
    role: "Field CTO, CNCF Ambassador & GitHub Star",
    headline: "From student KubeCon scholarship attendee to Field CTO.",
    summary:
      "Spent over four years at Civo leading Developer Relations and serving as Field CTO—shaping cloud-native infrastructure strategy, chairing KubeCon student tracks, and authoring the DevOps-Bootcamp (2.4K★).",
    proof: "Field CTO @ Civo · CNCF Ambassador · GitHub Star",
  },
  {
    id: "2025",
    year: "2025–26",
    tag: "v2025–26 // CAST AI & 79.6H CORPUS",
    org: "CAST AI · TechWithKunal",
    role: "Senior Developer Advocate (EMEA)",
    headline: "940K+ engineers reached—making TRACE essential.",
    summary:
      "Leading EMEA DevRel on Kubernetes AI automation at CAST AI with 940K+ YouTube subscribers (87M+ views). Because his unedited whiteboards pack 5 hours into single videos, TRACE exists so every derivation becomes instantly verifiable.",
    proof: "940K+ Subscribers · 87M+ Views · Sr. DevRel @ CAST AI",
  },
];

export const VECTOR_CLUSTERS: VectorClusterMeta[] = [
  {
    phase: 1,
    label: "01 · Foundations & Java",
    short: "Java & Flow",
    color: "#3B82F6",
    center: [-3.8, 1.8, -1.2],
    sampleQueryId: "binary-search-mid",
  },
  {
    phase: 2,
    label: "02 · Search & Sorting",
    short: "Binary & Cyclic Sort",
    color: "#FF4D0A",
    center: [-1.4, 2.7, 1.9],
    sampleQueryId: "binary-search-mid",
  },
  {
    phase: 3,
    label: "03 · Recursion & Backtracking",
    short: "N-Queens & Subsets",
    color: "#FF9E44",
    center: [2.2, 2.1, 1.6],
    sampleQueryId: "n-queens",
  },
  {
    phase: 4,
    label: "04 · OOP Mastery 1–7",
    short: "OOP & Generics",
    color: "#A78BFA",
    center: [3.6, -0.4, -0.8],
    sampleQueryId: "hashmap-collisions",
  },
  {
    phase: 5,
    label: "05 · Linear DS & Games",
    short: "Lists, Stacks, Queues",
    color: "#38BDF8",
    center: [-2.8, -1.7, 1.4],
    sampleQueryId: "cyclic-sort",
  },
  {
    phase: 6,
    label: "06 · Trees, Heaps & HashMaps",
    short: "AVL, BST & HashMap",
    color: "#1CB67C",
    center: [0.4, -2.3, -1.5],
    sampleQueryId: "avl-rotations",
  },
  {
    phase: 7,
    label: "07 · FAANG Hard & Greedy",
    short: "Karp-Rabin & Graphs",
    color: "#FB7185",
    center: [3.1, -2.2, 2.1],
    sampleQueryId: "karp-rabin",
  },
];
