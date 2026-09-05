import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * ThreeHeroWorkspace
 * Interactive 3D Developer Workspace and AI Learning Environment.
 * Features:
 * - Rotating 3D cube with code symbols (</>, {}, (), &&, =>, //)
 * - Glowing AI brain / holographic core with wireframe geodesic shells
 * - Floating code windows with realistic code snippets
 * - Floating language badges (Python, C++, Java, Rust, TS)
 * - 1,200+ animated cyber particles
 * - Mouse parallax tilt & raycasting hover/click interaction
 */
const ThreeHeroWorkspace = () => {
  const containerRef = useRef(null);
  const [activeHint, setActiveHint] = useState('Hover or drag to explore 3D space');
  const [hoveredSymbol, setHoveredSymbol] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene, Camera, Renderer ---
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070a12, 0.035);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const cyanPointLight = new THREE.PointLight(0x06b6d4, 4, 25);
    cyanPointLight.position.set(3, 4, 3);
    scene.add(cyanPointLight);

    const purplePointLight = new THREE.PointLight(0x818cf8, 4, 25);
    purplePointLight.position.set(-3, -3, 3);
    scene.add(purplePointLight);

    const coreLight = new THREE.PointLight(0x22d3ee, 5, 12);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    // Group for mouse parallax tilt
    const pivotGroup = new THREE.Group();
    scene.add(pivotGroup);

    // --- Texture Generator for Cube Faces ---
    const createSymbolTexture = (symbol, subtitle, primaryColor, bgColor) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Dark glass background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 512, 512);

      // Grid circuit lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }

      // Neon Border
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 14;
      ctx.strokeRect(18, 18, 476, 476);

      // Corner accent brackets
      ctx.lineWidth = 28;
      ctx.beginPath();
      // Top-left
      ctx.moveTo(18, 90); ctx.lineTo(18, 18); ctx.lineTo(90, 18);
      // Bottom-right
      ctx.moveTo(494, 422); ctx.lineTo(494, 494); ctx.lineTo(422, 494);
      ctx.stroke();

      // Main Code Symbol
      ctx.font = '900 130px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 35;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(symbol, 256, 230);

      // Subtitle
      ctx.font = '600 30px "Inter", sans-serif';
      ctx.shadowBlur = 10;
      ctx.fillStyle = primaryColor;
      ctx.fillText(subtitle, 256, 340);

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 8;
      return texture;
    };

    // --- 1. Rotating 3D Cube with Code Symbols ---
    const cubeMaterials = [
      new THREE.MeshStandardMaterial({
        map: createSymbolTexture('</>', 'SYNTAX', '#22d3ee', '#0b1329'),
        roughness: 0.15,
        metalness: 0.7,
        emissive: 0x06b6d4,
        emissiveIntensity: 0.25,
      }),
      new THREE.MeshStandardMaterial({
        map: createSymbolTexture('{}', 'OBJECTS', '#818cf8', '#0e112e'),
        roughness: 0.15,
        metalness: 0.7,
        emissive: 0x6366f1,
        emissiveIntensity: 0.25,
      }),
      new THREE.MeshStandardMaterial({
        map: createSymbolTexture('()', 'FUNCTIONS', '#34d399', '#091c1b'),
        roughness: 0.15,
        metalness: 0.7,
        emissive: 0x10b981,
        emissiveIntensity: 0.25,
      }),
      new THREE.MeshStandardMaterial({
        map: createSymbolTexture('&&', 'LOGIC', '#f59e0b', '#20160a'),
        roughness: 0.15,
        metalness: 0.7,
        emissive: 0xd97706,
        emissiveIntensity: 0.25,
      }),
      new THREE.MeshStandardMaterial({
        map: createSymbolTexture('=>', 'ASYNC', '#ec4899', '#240d21'),
        roughness: 0.15,
        metalness: 0.7,
        emissive: 0xdb2777,
        emissiveIntensity: 0.25,
      }),
      new THREE.MeshStandardMaterial({
        map: createSymbolTexture('//', 'COMMENTS', '#a855f7', '#1b0d2d'),
        roughness: 0.15,
        metalness: 0.7,
        emissive: 0x9333ea,
        emissiveIntensity: 0.25,
      }),
    ];

    const cubeGeo = new THREE.BoxGeometry(2.1, 2.1, 2.1);
    const mainCube = new THREE.Mesh(cubeGeo, cubeMaterials);
    mainCube.userData = { isCube: true, name: 'Core Code Matrix' };
    pivotGroup.add(mainCube);

    // Cube Outer Wireframe cage
    const wireGeo = new THREE.BoxGeometry(2.3, 2.3, 2.3);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireCube = new THREE.Mesh(wireGeo, wireMat);
    mainCube.add(wireCube);

    // --- 2. Glowing AI Brain / Digital Assistant Core ---
    const aiCoreGroup = new THREE.Group();
    pivotGroup.add(aiCoreGroup);

    // Outer Geodesic Icosahedron Ring
    const icoGeo = new THREE.IcosahedronGeometry(1.65, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const icoMesh = new THREE.Mesh(icoGeo, icoMat);
    aiCoreGroup.add(icoMesh);

    // Inner Glowing Plasma Sphere
    const innerSphereGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const innerSphereMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: false,
    });
    const innerSphere = new THREE.Mesh(innerSphereGeo, innerSphereMat);
    aiCoreGroup.add(innerSphere);

    // Orbiting Neon Rings around AI Core
    const ringGeo1 = new THREE.TorusGeometry(2.7, 0.025, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.6 });
    const orbitRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    orbitRing1.rotation.x = Math.PI / 3;
    pivotGroup.add(orbitRing1);

    const ringGeo2 = new THREE.TorusGeometry(3.1, 0.025, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.5 });
    const orbitRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    orbitRing2.rotation.y = Math.PI / 4;
    pivotGroup.add(orbitRing2);

    // --- 3. Floating 3D Code Windows ---
    const createCodeSnippetTexture = (title, codeLines, statusText, statusColor) => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');

      // Glass dark backdrop
      ctx.fillStyle = 'rgba(10, 16, 30, 0.94)';
      ctx.fillRect(0, 0, 640, 360);

      // Window top bar
      ctx.fillStyle = 'rgba(23, 34, 59, 0.95)';
      ctx.fillRect(0, 0, 640, 48);

      // Window dots
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(28, 24, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(52, 24, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(76, 24, 7, 0, Math.PI * 2); ctx.fill();

      // Title
      ctx.font = '600 20px "Fira Code", monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(title, 110, 31);

      // Status pill
      ctx.font = 'bold 16px "Inter", sans-serif';
      ctx.fillStyle = statusColor;
      ctx.textAlign = 'right';
      ctx.fillText(statusText, 610, 31);
      ctx.textAlign = 'left';

      // Code Lines
      ctx.font = '500 20px "Fira Code", monospace';
      codeLines.forEach((line, idx) => {
        const y = 90 + idx * 36;
        if (line.includes('def') || line.includes('function') || line.includes('class')) {
          ctx.fillStyle = '#f472b6';
        } else if (line.includes('return') || line.includes('if') || line.includes('for')) {
          ctx.fillStyle = '#60a5fa';
        } else if (line.includes('//') || line.includes('#')) {
          ctx.fillStyle = '#64748b';
        } else {
          ctx.fillStyle = '#e2e8f0';
        }
        ctx.fillText(line, 36, y);
      });

      // Border outline
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.lineWidth = 6;
      ctx.strokeRect(0, 0, 640, 360);

      return new THREE.CanvasTexture(canvas);
    };

    const windowData = [
      {
        title: 'binary_search.py',
        lines: [
          'def search(nums, target):',
          '    left, right = 0, len(nums) - 1',
          '    while left <= right:',
          '        mid = (left + right) // 2',
          '        if nums[mid] == target: return mid',
          '    return -1 # O(log n)'
        ],
        status: 'Optimal O(log n)',
        color: '#34d399',
        pos: [-4.0, 1.4, 0.4],
        rot: [0.1, 0.35, -0.05],
      },
      {
        title: 'dp_memo.cpp',
        lines: [
          'int solveDP(int n, vector<int>& memo) {',
          '    if (n <= 1) return n;',
          '    if (memo[n] != -1) return memo[n];',
          '    return memo[n] = solveDP(n-1) + solveDP(n-2);',
          '} // AI Verified: 100% Correct'
        ],
        status: 'AI Complexity: O(N)',
        color: '#22d3ee',
        pos: [4.1, -1.1, 0.6],
        rot: [-0.1, -0.4, 0.05],
      },
      {
        title: 'diagnostic_score.ai',
        lines: [
          'const skills = {',
          '  arrays: "95% [Mastery]",',
          '  dp: "72% [Proficient]",',
          '  trees: "88% [Strong]"',
          '};'
        ],
        status: 'Diagnostic Active',
        color: '#a855f7',
        pos: [3.8, 2.3, -1.0],
        rot: [0.15, -0.3, -0.1],
      }
    ];

    const floatingWindows = [];
    const windowPlaneGeo = new THREE.PlaneGeometry(3.0, 1.7);

    windowData.forEach((w, index) => {
      const texture = createCodeSnippetTexture(w.title, w.lines, w.status, w.color);
      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        roughness: 0.2,
        metalness: 0.4,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(windowPlaneGeo, mat);
      mesh.position.set(...w.pos);
      mesh.rotation.set(...w.rot);
      mesh.userData = { 
        isWindow: true, 
        initialY: w.pos[1], 
        speed: 0.8 + index * 0.3,
        name: w.title,
      };
      pivotGroup.add(mesh);
      floatingWindows.push(mesh);
    });

    // --- 4. Floating Programming Language Nodes ---
    const createLanguageBadgeTexture = (langName, iconChar, glowColor) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Circular glowing pill
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(128, 128, 115, 0, Math.PI * 2); ctx.fill();

      // Border
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 10;
      ctx.stroke();

      // Icon/Letter
      ctx.font = 'bold 70px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 25;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(iconChar, 128, 105);

      // Name
      ctx.font = '600 24px "Inter", sans-serif';
      ctx.shadowBlur = 5;
      ctx.fillStyle = glowColor;
      ctx.fillText(langName, 128, 175);

      return new THREE.CanvasTexture(canvas);
    };

    const languages = [
      { name: 'Python', char: 'Py', color: '#38bdf8', pos: [-3.2, -2.2, 0.8] },
      { name: 'C++', char: 'C++', color: '#818cf8', pos: [2.5, -2.6, 1.2] },
      { name: 'Java', char: '☕', color: '#fb923c', pos: [-2.2, 2.7, -0.5] },
      { name: 'Rust', char: '🦀', color: '#f87171', pos: [2.1, 2.9, 0.2] },
      { name: 'JS/TS', char: 'TS', color: '#fbbf24', pos: [-4.6, 0.1, -1.2] },
    ];

    const badgeGeo = new THREE.CircleGeometry(0.55, 32);
    const floatingBadges = [];

    languages.forEach((lang, i) => {
      const tex = createLanguageBadgeTexture(lang.name, lang.char, lang.color);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const badge = new THREE.Mesh(badgeGeo, mat);
      badge.position.set(...lang.pos);
      badge.userData = {
        isBadge: true,
        initialY: lang.pos[1],
        speed: 1.2 + i * 0.25,
        name: lang.name,
      };
      pivotGroup.add(badge);
      floatingBadges.push(badge);
    });

    // --- 5. 1,200+ Animated Cyber Particles ---
    const particleCount = 1400;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const palette = [
      new THREE.Color(0x22d3ee), // Cyan
      new THREE.Color(0x818cf8), // Indigo
      new THREE.Color(0x34d399), // Emerald
      new THREE.Color(0xa855f7), // Purple
      new THREE.Color(0xffffff), // White
    ];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 26;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 20;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 22;

      const col = palette[Math.floor(Math.random() * palette.length)];
      particleColors[i3] = col.r;
      particleColors[i3 + 1] = col.g;
      particleColors[i3 + 2] = col.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- Mouse Parallax & Raycasting ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      mouse.targetX = (clientX / rect.width) * 2 - 1;
      mouse.targetY = -(clientY / rect.height) * 2 + 1;

      mouseVector.x = mouse.targetX;
      mouseVector.y = mouse.targetY;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Interactive Click on Cube
    let cubeSpinBoost = 0;
    const handleClick = () => {
      raycaster.setFromCamera(mouseVector, camera);
      const intersects = raycaster.intersectObjects(pivotGroup.children, true);
      if (intersects.length > 0) {
        cubeSpinBoost = 0.35;
        coreLight.intensity = 12;
        setTimeout(() => { coreLight.intensity = 5; }, 400);
      }
    };
    container.addEventListener('click', handleClick);

    // --- Resize Handler ---
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // --- Animation Loop ---
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse parallax lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      pivotGroup.rotation.y = mouse.x * 0.45;
      pivotGroup.rotation.x = -mouse.y * 0.35;
      camera.position.x = mouse.x * 0.6;
      camera.position.y = 1.2 + mouse.y * 0.4;
      camera.lookAt(0, 0, 0);

      // Rotate Main Cube
      const baseRotation = 0.006 + cubeSpinBoost;
      mainCube.rotation.x += baseRotation;
      mainCube.rotation.y += baseRotation * 1.3;
      if (cubeSpinBoost > 0) {
        cubeSpinBoost *= 0.94; // Decay boost smoothly
      }

      // Rotate Wireframe Box
      wireCube.rotation.x -= 0.003;
      wireCube.rotation.y -= 0.005;

      // Rotate AI Core
      icoMesh.rotation.x -= 0.012;
      icoMesh.rotation.y += 0.015;
      const pulseScale = 1 + Math.sin(elapsedTime * 3) * 0.08;
      innerSphere.scale.set(pulseScale, pulseScale, pulseScale);
      coreLight.intensity = 4 + Math.sin(elapsedTime * 4) * 1.5;

      // Orbit Rings
      orbitRing1.rotation.z += 0.008;
      orbitRing2.rotation.x += 0.007;

      // Bob floating code windows
      floatingWindows.forEach((mesh) => {
        mesh.position.y = mesh.userData.initialY + Math.sin(elapsedTime * mesh.userData.speed) * 0.18;
        mesh.rotation.z = Math.sin(elapsedTime * 0.5) * 0.03;
      });

      // Bob floating badges and face camera
      floatingBadges.forEach((badge) => {
        badge.position.y = badge.userData.initialY + Math.cos(elapsedTime * badge.userData.speed) * 0.15;
        badge.lookAt(camera.position);
      });

      // Drift Particles slowly
      particles.rotation.y = elapsedTime * 0.02;
      particles.rotation.x = Math.sin(elapsedTime * 0.01) * 0.05;

      // Raycast check for hover indicator
      raycaster.setFromCamera(mouseVector, camera);
      const intersects = raycaster.intersectObjects([mainCube, ...floatingWindows, ...floatingBadges], true);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.name) {
          setHoveredSymbol(hit.userData.name);
        } else {
          setHoveredSymbol('Matrix Core: Active');
        }
      } else {
        setHoveredSymbol(null);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      cubeGeo.dispose();
      wireGeo.dispose();
      icoGeo.dispose();
      innerSphereGeo.dispose();
      ringGeo1.dispose();
      ringGeo2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[540px] lg:h-[640px] rounded-3xl overflow-hidden glass-panel-glow shadow-cyber-box border border-brand-500/30">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Top Glass HUD Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-950/80 border border-brand-500/30 backdrop-blur-md text-[11px] font-mono text-cyan-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>3D Workspace // Neural Matrix V3.2</span>
        </div>

        <div className="px-3 py-1.5 rounded-full bg-dark-950/80 border border-cyan-500/30 backdrop-blur-md text-[11px] font-mono text-slate-300">
          {hoveredSymbol ? (
            <span className="text-cyan-400 font-bold flex items-center gap-1.5">
              ✦ {hoveredSymbol}
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1.5">
              ⟡ Move cursor to orbit scene
            </span>
          )}
        </div>
      </div>

      {/* Bottom Floating Controls Pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-dark-950/85 border border-dark-700/80 backdrop-blur-md text-xs font-mono text-slate-400 pointer-events-none flex items-center gap-4 z-20 shadow-lg">
        <span className="flex items-center gap-1.5 text-cyan-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          Interactive 3D Engine
        </span>
        <span className="hidden sm:inline text-slate-600">|</span>
        <span className="hidden sm:inline text-slate-300">
          Click cube to boost energy pulse
        </span>
      </div>
    </div>
  );
};

export default ThreeHeroWorkspace;
