"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface TemporalShaderCanvasProps {
  theme: "radiant" | "paper";
}

export function TemporalShaderCanvas({ theme }: TemporalShaderCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const themeTargetRef = useRef<number>(theme === "paper" ? 1 : 0);

  useEffect(() => {
    themeTargetRef.current = theme === "paper" ? 1 : 0;
  }, [theme]);

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Camera for helical particle field
    const camera = new THREE.PerspectiveCamera(
      48,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      100
    );
    camera.position.set(0, 0, 8.5);

    // Fullscreen Shader Quad (Ortho Camera Overlay via clip-space quad)
    const bgScene = new THREE.Scene();
    const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.55, 0.45) },
      uResolution: {
        value: new THREE.Vector2(container.clientWidth, container.clientHeight),
      },
      uTheme: { value: themeTargetRef.current },
      uEnergy: { value: 0 },
    };

    const bgMat = new THREE.ShaderMaterial({
      uniforms,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform vec2 uResolution;
        uniform float uTheme;
        uniform float uEnergy;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = rot * p * 2.03 + vec2(1.7, 9.2);
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 aspect = vec2(uResolution.x / max(1.0, uResolution.y), 1.0);
          vec2 st = (vUv - 0.5) * aspect;
          vec2 m = (uMouse - 0.5) * aspect;

          float t = uTime * 0.14;
          vec2 q = vec2(fbm(st * 1.4 + t), fbm(st * 1.4 + vec2(5.2, 1.3) - t * 0.7));
          vec2 r = vec2(fbm(st * 1.6 + 1.8 * q + t * 0.6), fbm(st * 1.5 + 1.5 * q));
          float field = fbm(st * 1.8 + r);

          float distMouse = length(st - m);
          float cursorGlow = exp(-distMouse * distMouse * (2.6 - uEnergy * 0.8));

          // Caustic ribbon concentrated toward right portrait region + cursor halo
          vec2 portraitFocal = vec2(0.32 * aspect.x, 0.02);
          float distPortrait = length(st - portraitFocal);
          float focalHalo = exp(-distPortrait * distPortrait * 2.2);

          float caustic = smoothstep(0.42, 0.82, field) * (0.45 + 0.55 * focalHalo);

          vec3 ember = vec3(1.0, 0.30, 0.04);
          vec3 tungsten = vec3(1.0, 0.64, 0.26);
          vec3 emerald = vec3(0.11, 0.71, 0.49);

          vec3 colRadiant = ember * (caustic * 0.55 + cursorGlow * 0.24 + focalHalo * 0.22)
                          + tungsten * (smoothstep(0.55, 0.9, r.x) * 0.18 + focalHalo * 0.14)
                          + emerald * (smoothstep(0.62, 0.95, q.y) * 0.08);

          float alphaRadiant = clamp(caustic * 0.62 + focalHalo * 0.34 + cursorGlow * 0.28, 0.0, 0.78);

          // Paper mode renders soft warm copper-ochre illumination instead of dark bloom
          vec3 colPaper = ember * (caustic * 0.24 + cursorGlow * 0.14)
                        + tungsten * (focalHalo * 0.18);
          float alphaPaper = clamp(caustic * 0.22 + focalHalo * 0.18 + cursorGlow * 0.16, 0.0, 0.32);

          vec3 finalCol = mix(colRadiant, colPaper, uTheme);
          float finalAlpha = mix(alphaRadiant, alphaPaper, uTheme);

          gl_FragColor = vec4(finalCol, finalAlpha);
        }
      `,
    });

    const bgQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
    bgScene.add(bgQuad);

    // Helical Lecture Frame Constellation (380 particles representing 79.6h timeline)
    const count = 380;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);
    const kind = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const u = i / count;
      const angle = u * Math.PI * 6.5;
      const radius = 2.4 + Math.sin(u * Math.PI * 3.0) * 0.85;
      const x = (u - 0.5) * 14.5;
      const y = Math.sin(angle) * radius * 0.62 - 0.15;
      const z = Math.cos(angle) * radius * 0.9 - 1.2;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      phases[i] = u * Math.PI * 10.0;
      sizes[i] = i % 11 === 0 ? 18.0 : 9.0 + (i % 5) * 2.1;
      kind[i] = i % 17 === 0 ? 2.0 : i % 5 === 0 ? 1.0 : 0.0; // 2=emerald lock, 1=ember, 0=ivory
    }

    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    ptGeo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    ptGeo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    ptGeo.setAttribute("aKind", new THREE.BufferAttribute(kind, 1));

    const ptUniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uTheme: { value: themeTargetRef.current },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    };

    const ptMat = new THREE.ShaderMaterial({
      uniforms: ptUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float aPhase;
        attribute float aSize;
        attribute float aKind;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uPixelRatio;
        varying float vKind;
        varying float vGlow;

        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 0.9 + aPhase) * 0.16;
          pos.z += cos(uTime * 0.7 + aPhase * 0.7) * 0.14;

          // Subtle magnetic pull toward mouse in NDC space
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          vec4 projected = projectionMatrix * mv;
          vec2 ndc = projected.xy / max(0.001, projected.w);
          float dMouse = length(ndc - uMouse);
          float near = smoothstep(0.65, 0.0, dMouse);
          pos.xy += (uMouse - ndc) * near * 0.42;

          vec4 finalMv = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * finalMv;
          gl_PointSize = (aSize + near * 14.0) * uPixelRatio * (5.5 / max(1.0, -finalMv.z));
          vKind = aKind;
          vGlow = 0.45 + 0.55 * near + 0.25 * sin(uTime * 1.4 + aPhase);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTheme;
        varying float vKind;
        varying float vGlow;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float r = length(uv);
          if (r > 0.5) discard;
          float core = exp(-r * r * 18.0);
          float halo = exp(-r * r * 5.0) * 0.55;

          vec3 cIvory = mix(vec3(0.95, 0.93, 0.89), vec3(0.25, 0.23, 0.21), uTheme);
          vec3 cEmber = vec3(1.0, 0.34, 0.06);
          vec3 cEmerald = vec3(0.11, 0.75, 0.50);

          vec3 col = cIvory;
          if (vKind > 1.5) col = cEmerald;
          else if (vKind > 0.5) col = cEmber;

          float intensity = (core + halo) * vGlow * mix(1.0, 0.45, uTheme);
          gl_FragColor = vec4(col, clamp(intensity, 0.0, 1.0));
        }
      `,
    });

    const points = new THREE.Points(ptGeo, ptMat);
    scene.add(points);

    // Connecting glowing hairline curve through primary nodes
    const curvePts: THREE.Vector3[] = [];
    for (let i = 0; i < count; i += 6) {
      curvePts.push(
        new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
      );
    }
    const spline = new THREE.CatmullRomCurve3(curvePts);
    const tubeGeo = new THREE.BufferGeometry().setFromPoints(spline.getPoints(220));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xff4d0a,
      transparent: true,
      opacity: themeTargetRef.current === 1 ? 0.14 : 0.24,
    });
    const ribbonLine = new THREE.Line(tubeGeo, lineMat);
    scene.add(ribbonLine);

    const targetMouse = new THREE.Vector2(0.55, 0.45);
    const curMouse = new THREE.Vector2(0.55, 0.45);
    let lastEnergy = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = 1.0 - (e.clientY - rect.top) / rect.height;
      targetMouse.set(nx, ny);
      lastEnergy = Math.min(1.0, lastEnergy + 0.15);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      if (!renderer || !container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      uniforms.uResolution.value.set(w, h);
    });
    resizeObserver.observe(container);

    renderer.autoClear = false;
    let rafId = 0;
    const startMs = performance.now();

    const tick = () => {
      const elapsed = (performance.now() - startMs) * 0.001;
      curMouse.lerp(targetMouse, 0.06);
      lastEnergy *= 0.94;

      uniforms.uTime.value = elapsed;
      uniforms.uMouse.value.copy(curMouse);
      uniforms.uEnergy.value = lastEnergy;
      uniforms.uTheme.value += (themeTargetRef.current - uniforms.uTheme.value) * 0.08;

      ptUniforms.uTime.value = elapsed;
      ptUniforms.uMouse.value.set(curMouse.x * 2 - 1, curMouse.y * 2 - 1);
      ptUniforms.uTheme.value = uniforms.uTheme.value;
      lineMat.opacity = THREE.MathUtils.lerp(0.24, 0.12, uniforms.uTheme.value);

      points.rotation.y = Math.sin(elapsed * 0.11) * 0.1 + (curMouse.x - 0.5) * 0.14;
      points.rotation.x = (curMouse.y - 0.5) * 0.08;
      ribbonLine.rotation.copy(points.rotation);

      renderer!.clear();
      renderer!.render(bgScene, bgCamera);
      renderer!.clearDepth();
      renderer!.render(scene, camera);

      if (!prefersReduced) {
        rafId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      resizeObserver.disconnect();
      bgQuad.geometry.dispose();
      bgMat.dispose();
      ptGeo.dispose();
      ptMat.dispose();
      tubeGeo.dispose();
      lineMat.dispose();
      renderer?.dispose();
      if (renderer?.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    />
  );
}
