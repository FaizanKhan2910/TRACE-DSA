"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Compass, RotateCcw, Sparkles, Zap, ArrowUpRight } from "lucide-react";
import { PLAYLIST_VIDEOS, LectureVideo } from "@/data/verifiedData";
import { VECTOR_CLUSTERS } from "@/data/pipelineAndStory";

interface VectorSpace3DProps {
  theme: "radiant" | "paper";
  onQueryTopic: (query: string, mode?: "standard" | "deep") => void;
}

function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

export function VectorSpace3D({ theme, onQueryTopic }: VectorSpace3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activePhase, setActivePhase] = useState<number | null>(6); // Default focus: Trees, AVL & HashMaps
  const [selectedLecture, setSelectedLecture] = useState<LectureVideo>(
    () => PLAYLIST_VIDEOS.find((v) => v.num === 50) || PLAYLIST_VIDEOS[49]
  );
  const [hoveredLecture, setHoveredLecture] = useState<LectureVideo | null>(null);
  const [laserCount, setLaserCount] = useState<number>(6);
  const [webglReady, setWebglReady] = useState<boolean>(true);

  const activePhaseRef = useRef<number | null>(activePhase);
  const selectedNumRef = useRef<number>(selectedLecture.num);
  const themeRef = useRef<"radiant" | "paper">(theme);
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, -0.5, 0));

  useEffect(() => {
    activePhaseRef.current = activePhase;
    const cluster = VECTOR_CLUSTERS.find((c) => c.phase === activePhase);
    if (cluster) {
      cameraTargetRef.current.set(
        cluster.center[0] * 0.48,
        cluster.center[1] * 0.48,
        cluster.center[2] * 0.48
      );
    } else {
      cameraTargetRef.current.set(0, 0, 0);
    }
  }, [activePhase]);

  useEffect(() => {
    selectedNumRef.current = selectedLecture.num;
  }, [selectedLecture]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      queueMicrotask(() => setWebglReady(false));
      return;
    }

    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, w / h, 0.1, 100);

    // Spherical orbit controls (lightweight custom damped spring rig)
    let theta = 0.55;
    let phi = 1.24;
    const radius = 10.6;
    let targetTheta = 0.55;
    let targetPhi = 1.24;
    const lookTarget = new THREE.Vector3(0, 0, 0);

    // Subtle spatial reference grid ring
    const ringGeo = new THREE.RingGeometry(4.8, 4.83, 96);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff4d0a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
    });
    const eqRing = new THREE.Mesh(ringGeo, ringMat);
    eqRing.rotation.x = Math.PI / 2;
    scene.add(eqRing);

    const outerRingGeo = new THREE.RingGeometry(6.4, 6.42, 96);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x1cb67c,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.14,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = Math.PI / 2.4;
    scene.add(outerRing);

    // Central Query Origin Emitter Core
    const coreGroup = new THREE.Group();
    const coreOcta = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.42, 0),
      new THREE.MeshBasicMaterial({
        color: 0xff4d0a,
        wireframe: true,
        transparent: true,
        opacity: 0.9,
      })
    );
    const coreInner = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xff9e44 })
    );
    coreGroup.add(coreOcta);
    coreGroup.add(coreInner);
    scene.add(coreGroup);

    // Pre-compute deterministic 3D coordinates for all 69 real lectures + 950 ambient chunk satellites
    const lectureCoords: THREE.Vector3[] = PLAYLIST_VIDEOS.map((lec, idx) => {
      const cluster =
        VECTOR_CLUSTERS.find((c) => c.phase === lec.phase) || VECTOR_CLUSTERS[0];
      const u1 = seededUnit(idx * 3 + 1) - 0.5;
      const u2 = seededUnit(idx * 3 + 2) - 0.5;
      const u3 = seededUnit(idx * 3 + 3) - 0.5;
      const marathonSpread = lec.duration_sec > 5400 ? 1.45 : 1.0;
      return new THREE.Vector3(
        cluster.center[0] + u1 * 2.1 * marathonSpread,
        cluster.center[1] + u2 * 1.75 * marathonSpread,
        cluster.center[2] + u3 * 2.1 * marathonSpread
      );
    });

    // Ambient background semantic cloud (~950 points simulating the 7,055 vector density)
    const cloudCount = 960;
    const cloudPos = new Float32Array(cloudCount * 3);
    const cloudCol = new Float32Array(cloudCount * 3);
    const cloudSize = new Float32Array(cloudCount);

    for (let i = 0; i < cloudCount; i++) {
      const cluster = VECTOR_CLUSTERS[i % VECTOR_CLUSTERS.length];
      const c = new THREE.Color(cluster.color);
      const r1 = (seededUnit(i * 7 + 11) - 0.5) * 3.1;
      const r2 = (seededUnit(i * 7 + 13) - 0.5) * 2.6;
      const r3 = (seededUnit(i * 7 + 17) - 0.5) * 3.1;
      cloudPos[i * 3] = cluster.center[0] + r1;
      cloudPos[i * 3 + 1] = cluster.center[1] + r2;
      cloudPos[i * 3 + 2] = cluster.center[2] + r3;
      cloudCol[i * 3] = c.r;
      cloudCol[i * 3 + 1] = c.g;
      cloudCol[i * 3 + 2] = c.b;
      cloudSize[i] = 5.0 + seededUnit(i + 99) * 7.5;
    }

    const cloudGeo = new THREE.BufferGeometry();
    cloudGeo.setAttribute("position", new THREE.BufferAttribute(cloudPos, 3));
    cloudGeo.setAttribute("aColor", new THREE.BufferAttribute(cloudCol, 3));
    cloudGeo.setAttribute("aSize", new THREE.BufferAttribute(cloudSize, 1));

    const cloudMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec3 aColor;
        attribute float aSize;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        void main() {
          vColor = aColor;
          vec3 p = position;
          p.y += sin(uTime * 0.75 + p.x * 1.3) * 0.08;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uPixelRatio * (6.2 / max(1.0, -mv.z));
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        void main() {
          float r = length(gl_PointCoord - vec2(0.5));
          if (r > 0.5) discard;
          float glow = exp(-r * r * 12.0) * 0.55;
          gl_FragColor = vec4(vColor, glow);
        }
      `,
    });
    const cloudPoints = new THREE.Points(cloudGeo, cloudMat);
    scene.add(cloudPoints);

    // 69 Primary Interactive Lecture Nodes (Raycast-clickable!)
    const lecPos = new Float32Array(PLAYLIST_VIDEOS.length * 3);
    const lecCol = new Float32Array(PLAYLIST_VIDEOS.length * 3);
    const lecSize = new Float32Array(PLAYLIST_VIDEOS.length);

    PLAYLIST_VIDEOS.forEach((lec, idx) => {
      const p = lectureCoords[idx];
      const cluster =
        VECTOR_CLUSTERS.find((c) => c.phase === lec.phase) || VECTOR_CLUSTERS[0];
      const col = new THREE.Color(lec.duration_sec > 5400 ? "#FF4D0A" : cluster.color);
      lecPos[idx * 3] = p.x;
      lecPos[idx * 3 + 1] = p.y;
      lecPos[idx * 3 + 2] = p.z;
      lecCol[idx * 3] = col.r;
      lecCol[idx * 3 + 1] = col.g;
      lecCol[idx * 3 + 2] = col.b;
      lecSize[idx] = lec.duration_sec > 5400 ? 34.0 : 21.0;
    });

    const lecGeo = new THREE.BufferGeometry();
    lecGeo.setAttribute("position", new THREE.BufferAttribute(lecPos, 3));
    lecGeo.setAttribute("aColor", new THREE.BufferAttribute(lecCol, 3));
    lecGeo.setAttribute("aSize", new THREE.BufferAttribute(lecSize, 1));

    const lecMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
        uSelectedIndex: { value: selectedNumRef.current - 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec3 aColor;
        attribute float aSize;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vPulse;

        void main() {
          vColor = aColor;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float breathe = 1.0 + 0.15 * sin(uTime * 2.1 + float(gl_VertexID));
          gl_PointSize = aSize * breathe * uPixelRatio * (7.2 / max(1.0, -mv.z));
          vPulse = breathe;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vPulse;
        void main() {
          float r = length(gl_PointCoord - vec2(0.5));
          if (r > 0.5) discard;
          float core = exp(-r * r * 28.0);
          float halo = exp(-r * r * 6.5) * 0.72;
          vec3 hot = mix(vColor, vec3(1.0), core * 0.75);
          gl_FragColor = vec4(hot, clamp((core + halo) * vPulse, 0.0, 1.0));
        }
      `,
    });

    const lecPoints = new THREE.Points(lecGeo, lecMat);
    scene.add(lecPoints);

    // Dynamic Selection Marker Halo Sphere + Cosine Laser Beams to Top Cluster Neighbors
    const lockHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.31, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff4d0a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      })
    );
    scene.add(lockHalo);

    const beamPositions = new Float32Array(2 * 8 * 3); // up to 8 laser vectors
    const beamGeo = new THREE.BufferGeometry();
    beamGeo.setAttribute("position", new THREE.BufferAttribute(beamPositions, 3));
    const beamMat = new THREE.LineBasicMaterial({
      color: 0xff4d0a,
      transparent: true,
      opacity: 0.85,
    });
    const laserLines = new THREE.LineSegments(beamGeo, beamMat);
    scene.add(laserLines);

    // Pointer interaction: Drag to orbit + Raycast to pick exact lectures
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.34;
    const pointer = new THREE.Vector2(-99, -99);
    let isDragging = false;
    let dragDistance = 0;
    let lastX = 0;
    let lastY = 0;

    const updateBeams = (selIdx: number, phaseFilter: number | null) => {
      const targetPos = lectureCoords[selIdx] || new THREE.Vector3();
      lockHalo.position.copy(targetPos);

      // Connect origin -> selected lecture, plus 6 semantic neighbor beams in same phase
      const neighbors = PLAYLIST_VIDEOS.map((v, idx) => ({ v, idx }))
        .filter((x) => (phaseFilter ? x.v.phase === phaseFilter : x.v.phase === PLAYLIST_VIDEOS[selIdx].phase))
        .slice(0, 7);

      let ptr = 0;
      beamPositions[ptr++] = 0;
      beamPositions[ptr++] = 0;
      beamPositions[ptr++] = 0;
      beamPositions[ptr++] = targetPos.x;
      beamPositions[ptr++] = targetPos.y;
      beamPositions[ptr++] = targetPos.z;

      for (const n of neighbors) {
        if (ptr >= beamPositions.length - 5) break;
        const np = lectureCoords[n.idx];
        beamPositions[ptr++] = targetPos.x;
        beamPositions[ptr++] = targetPos.y;
        beamPositions[ptr++] = targetPos.z;
        beamPositions[ptr++] = np.x;
        beamPositions[ptr++] = np.y;
        beamPositions[ptr++] = np.z;
      }
      while (ptr < beamPositions.length) {
        beamPositions[ptr++] = 0;
      }
      beamGeo.attributes.position.needsUpdate = true;
    };

    updateBeams(selectedNumRef.current - 1, activePhaseRef.current);

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragDistance = 0;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        dragDistance += Math.abs(dx) + Math.abs(dy);
        lastX = e.clientX;
        lastY = e.clientY;
        targetTheta -= dx * 0.007;
        targetPhi = THREE.MathUtils.clamp(targetPhi - dy * 0.006, 0.35, 2.65);
        return;
      }

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(lecPoints);
      if (hits.length > 0 && typeof hits[0].index === "number") {
        const vid = PLAYLIST_VIDEOS[hits[0].index];
        if (vid) {
          setHoveredLecture(vid);
          container.style.cursor = "pointer";
          return;
        }
      }
      setHoveredLecture(null);
      container.style.cursor = isDragging ? "grabbing" : "grab";
    };

    const onPointerUp = () => {
      if (isDragging && dragDistance < 8) {
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObject(lecPoints);
        if (hits.length > 0 && typeof hits[0].index === "number") {
          const vid = PLAYLIST_VIDEOS[hits[0].index];
          if (vid) {
            setSelectedLecture(vid);
            setActivePhase(vid.phase);
            setLaserCount((c) => c + 1);
          }
        }
      }
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);

    const resizeObserver = new ResizeObserver(() => {
      if (!renderer || !container) return;
      const cw = Math.max(1, container.clientWidth);
      const ch = Math.max(1, container.clientHeight);
      renderer.setSize(cw, ch);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    let rafId = 0;
    const startMs = performance.now();

    const animate = () => {
      const elapsed = (performance.now() - startMs) * 0.001;
      if (!isDragging && !prefersReduced) {
        targetTheta += 0.0018;
      }

      theta += (targetTheta - theta) * 0.07;
      phi += (targetPhi - phi) * 0.07;
      lookTarget.lerp(cameraTargetRef.current, 0.06);

      camera.position.set(
        lookTarget.x + radius * Math.sin(phi) * Math.sin(theta),
        lookTarget.y + radius * Math.cos(phi),
        lookTarget.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(lookTarget);

      coreOcta.rotation.y = elapsed * 0.55;
      coreOcta.rotation.x = elapsed * 0.32;
      eqRing.rotation.z = elapsed * 0.08;
      outerRing.rotation.z = -elapsed * 0.06;

      cloudMat.uniforms.uTime.value = elapsed;
      lecMat.uniforms.uTime.value = elapsed;

      updateBeams(selectedNumRef.current - 1, activePhaseRef.current);
      lockHalo.lookAt(camera.position);
      const scaleHalo = 1.0 + 0.22 * Math.sin(elapsed * 4.2);
      lockHalo.scale.setScalar(scaleHalo);

      renderer!.render(scene, camera);

      if (!prefersReduced) {
        rafId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      domEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      resizeObserver.disconnect();
      ringGeo.dispose();
      ringMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      coreOcta.geometry.dispose();
      (coreOcta.material as THREE.Material).dispose();
      coreInner.geometry.dispose();
      (coreInner.material as THREE.Material).dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      lecGeo.dispose();
      lecMat.dispose();
      lockHalo.geometry.dispose();
      (lockHalo.material as THREE.Material).dispose();
      beamGeo.dispose();
      beamMat.dispose();
      renderer?.dispose();
      if (domEl.parentNode === container) {
        container.removeChild(domEl);
      }
    };
  }, []);

  const handleClusterClick = (phase: number | null) => {
    setActivePhase(phase);
    if (phase !== null) {
      const match =
        PLAYLIST_VIDEOS.find((v) => v.phase === phase && v.duration_sec > 3600) ||
        PLAYLIST_VIDEOS.find((v) => v.phase === phase);
      if (match) setSelectedLecture(match);
    }
    setLaserCount((c) => c + 1);
  };

  const displayLecture = hoveredLecture || selectedLecture;
  const clusterMeta =
    VECTOR_CLUSTERS.find((c) => c.phase === displayLecture.phase) || VECTOR_CLUSTERS[0];

  return (
    <section
      id="manifold"
      className="relative border-y border-[var(--hairline)] py-20 lg:py-24 overflow-hidden"
    >
      <div className="mx-auto w-[96vw] max-w-[2700px] px-5 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-[var(--hairline)] pb-7">
          <div>
            <div className="font-mono-tech text-lg uppercase tracking-[0.16em] text-[var(--ember)] flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--ember)] shadow-[0_0_12px_var(--ember)]" />
              01 // EXPLORE THE LECTURES
            </div>
            <h2 className="font-display text-[clamp(2rem,4vw,3.35rem)] font-bold tracking-[-0.04em] leading-[1.03] mt-3">
              See how the lessons fit together{" "}
              <span className="font-serif-editorial italic font-normal text-[var(--tungsten)]">
                by topic.
              </span>
            </h2>
          </div>
          <p className="max-w-md text-xl sm:text-xl leading-relaxed text-[var(--ink-secondary)]">
            Each point represents one of the <strong>69 lessons</strong> in{" "}
            <code className="font-mono-tech text-xl px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--hairline)]">
              kunal_java_dsa
            </code>
            . Drag to explore, then choose a topic or point to find a lesson.
          </p>
        </div>

        {/* Cluster Filter Strip */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleClusterClick(null)}
            className={`font-mono-tech text-lg px-3 py-1.5 rounded-sm border transition cursor-pointer ${
              activePhase === null
                ? "bg-[var(--ember)] text-[#090a0d] border-[var(--ember)] font-semibold shadow-[0_0_20px_var(--glow-ember)]"
                : "bg-[var(--bg-card)] text-[var(--ink-secondary)] border-[var(--hairline)] hover:border-[var(--ember)]"
            }`}
          >
            ALL 7 CLUSTERS (69)
          </button>
          {VECTOR_CLUSTERS.map((c) => {
            const active = activePhase === c.phase;
            return (
              <button
                key={c.phase}
                type="button"
                onClick={() => handleClusterClick(c.phase)}
                className={`font-mono-tech text-lg px-3 py-1.5 rounded-sm border transition flex items-center gap-2 cursor-pointer ${
                  active
                    ? "bg-[var(--bg-elevated)] text-[var(--ink-primary)] border-[var(--ember)] shadow-[0_0_22px_rgba(255,77,10,0.28)]"
                    : "bg-[var(--bg-card)] text-[var(--ink-secondary)] border-[var(--hairline)] hover:border-[var(--hairline-strong)]"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: c.color,
                    boxShadow: active ? `0 0 10px ${c.color}` : "none",
                  }}
                />
                {c.short}
              </button>
            );
          })}
        </div>

        {/* Interactive Three.js Viewport Frame */}
        <div className="relative mt-5 rounded-md border border-[var(--hairline-strong)] bg-[#06080c] overflow-hidden shadow-[0_32px_90px_-20px_rgba(0,0,0,0.85)]">
          {/* Subtle top telemetry overlay */}
          <div className="pointer-events-none absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 text-[#f4f0e8]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#0b0d12]/85 border border-white/10 backdrop-blur-md font-mono-tech text-lg tracking-[0.08em]">
              <Compass className="w-3.5 h-3.5 text-[#ff4d0a]" />
              <span>DRAG TO ORBIT · CLICK NODE TO LOCK BEAM</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#0b0d12]/85 border border-emerald-500/30 backdrop-blur-md font-mono-tech text-lg text-[#34d399]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1cb67c] animate-pulse" />
              <span>RAYCASTER READY · BEAMS FIRED: {laserCount}</span>
            </div>
          </div>

          {/* 3D Canvas Host */}
          {webglReady ? (
            <div
              ref={mountRef}
              className="w-full h-[430px] sm:h-[500px] lg:h-[clamp(540px,65svh,820px)] touch-none"
              aria-label="Interactive Three.js 3D Qdrant Vector Manifold"
            />
          ) : (
            <div className="h-[340px] flex flex-col items-center justify-center p-8 text-center text-[#c4c0b7]">
              <Sparkles className="w-8 h-8 text-[#ff4d0a] mb-3" />
              <p className="font-mono-tech text-xl">
                WebGL disabled in this browser — select a cluster tab above to explore verified lectures.
              </p>
            </div>
          )}

          {/* Selected Node Floating Inspection HUD */}
          <div className="relative lg:absolute lg:bottom-4 lg:left-4 lg:right-4 z-10 border-t lg:border border-white/15 bg-[#0c0f16]/90 backdrop-blur-xl rounded-none lg:rounded-md p-4 sm:p-5 text-[#f4f0e8] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2 font-mono-tech text-lg tracking-[0.1em]">
                <span
                  className="px-2 py-0.5 rounded-sm font-semibold text-[#060709]"
                  style={{ backgroundColor: clusterMeta.color }}
                >
                  {clusterMeta.label.toUpperCase()}
                </span>
                <span className="text-[#c4c0b7]">
                  LECTURE #{String(displayLecture.num).padStart(2, "0")} ·{" "}
                  {fmtDuration(displayLecture.duration_sec)}
                </span>
                <span className="text-[#34d399] uppercase">
                  ● {displayLecture.transcript_source}
                </span>
              </div>
              <h3 className="font-display text-xl sm:text-xl font-bold tracking-tight text-white truncate">
                {displayLecture.title}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleClusterClick(null)}
                className="font-mono-tech text-lg px-3 py-2 rounded-sm border border-white/15 bg-white/5 hover:border-white/35 transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset View
              </button>
              <a
                href={displayLecture.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono-tech text-lg px-3 py-2 rounded-sm border border-white/20 bg-white/5 hover:border-[#ff4d0a] hover:text-[#ff9e44] transition inline-flex items-center gap-1"
              >
                Watch Lecture
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() =>
                  onQueryTopic(
                    `Explain ${displayLecture.title.split(" - ")[0]} concepts and time complexity from Kunal's lecture`,
                    "deep"
                  )
                }
                className="btn-ember-glow font-mono-tech text-lg px-4 py-2 rounded-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                Query Node Live
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
