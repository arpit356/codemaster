import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import { Sparkles, CheckCircle2, Play, Lock, AlertTriangle, ArrowRight, X, Compass, ExternalLink } from 'lucide-react';

/**
 * Roadmap3DSpace
 * Visually engaging 3D pathway through cosmic space for learning milestones:
 * Programming Basics -> Arrays -> Strings -> Recursion -> Linked Lists -> Trees -> Graphs -> Dynamic Programming
 */
const ROADMAP_NODES = [
  { id: 'basics', title: 'Programming Basics', topic: 'Basics', order: 1, defaultStatus: 'completed', problems: ['Two Sum', 'Valid Palindrome'], desc: 'Core control flow, time complexity (Big-O), pointers, and fundamental syntax.' },
  { id: 'arrays', title: 'Arrays', topic: 'Arrays', order: 2, defaultStatus: 'completed', problems: ['Maximum Subarray', 'Container With Most Water', 'Two Sum'], desc: 'Linear memory structures, sliding window, prefix sums, and two-pointer paradigms.' },
  { id: 'strings', title: 'Strings', topic: 'Strings', order: 3, defaultStatus: 'completed', problems: ['Valid Anagram', 'Longest Substring Without Repeating Characters'], desc: 'String manipulation, hashing, frequency maps, and string search algorithms.' },
  { id: 'recursion', title: 'Recursion', topic: 'Recursion', order: 4, defaultStatus: 'in_progress', problems: ['Fibonacci Sequence', 'Subsets', 'Permutations'], desc: 'Recursive call stacks, base cases, recursion trees, and backtracking techniques.' },
  { id: 'linked_lists', title: 'Linked Lists', topic: 'Linked Lists', order: 5, defaultStatus: 'locked', problems: ['Reverse Linked List', 'Merge Two Sorted Lists'], desc: 'Node reference manipulation, fast & slow pointers, and cycle detection.' },
  { id: 'trees', title: 'Trees', topic: 'Trees', order: 6, defaultStatus: 'locked', problems: ['Maximum Depth of Binary Tree', 'Binary Tree Inorder Traversal'], desc: 'Hierarchical data, DFS (pre/in/post-order), BFS level traversal, and BST properties.' },
  { id: 'graphs', title: 'Graphs', topic: 'Graphs', order: 7, defaultStatus: 'locked', problems: ['Number of Islands', 'Clone Graph'], desc: 'Adjacency lists, topological sort, Dijkstra, and connected component algorithms.' },
  { id: 'dp', title: 'Dynamic Programming', topic: 'Dynamic Programming', order: 8, defaultStatus: 'locked', problems: ['Climbing Stairs', 'Coin Change', 'Longest Increasing Subsequence'], desc: 'Optimal substructure, overlapping subproblems, memoization, and bottom-up tabulation.' },
];

const Roadmap3DSpace = ({ userRoadmap = null }) => {
  const containerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNodeName, setHoveredNodeName] = useState(null);

  // Merge dynamic roadmap status if available
  const roadmapList = userRoadmap?.nodes || userRoadmap?.steps || [];
  const nodes = ROADMAP_NODES.map((n) => {
    if (roadmapList.length > 0) {
      const match = roadmapList.find(
        (s) => s.topic?.toLowerCase() === n.topic?.toLowerCase() || s.title?.toLowerCase() === n.title?.toLowerCase()
      );
      if (match) {
        const probTitles = match.recommended_problems
          ? match.recommended_problems.map((p) => (typeof p === 'string' ? p : p.title))
          : n.problems;
        return {
          ...n,
          status: match.status || n.defaultStatus,
          problems: probTitles,
        };
      }
    }
    return { ...n, status: n.defaultStatus };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070a12, 0.018);

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 120);
    camera.position.set(0, 4.5, 18.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x06b6d4, 3, 30);
    pointLight1.position.set(-6, 8, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x818cf8, 3, 30);
    pointLight2.position.set(6, -4, 5);
    scene.add(pointLight2);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // --- Background Stars ---
    const starCount = 900;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 35;
      starPos[i + 1] = (Math.random() - 0.5) * 25;
      starPos[i + 2] = (Math.random() - 0.5) * 30 - 5;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.8,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // --- Curved 3D Trajectory ---
    // Smooth, well-spaced cosmic constellation from left to right
    const pathPositions = [
      new THREE.Vector3(-8.2, -1.0, 1.2),   // 1: Programming Basics
      new THREE.Vector3(-5.8,  1.1, 0.7),   // 2: Arrays
      new THREE.Vector3(-3.4, -0.9, 0.2),   // 3: Strings
      new THREE.Vector3(-0.8,  1.2, -0.2),  // 4: Recursion (current)
      new THREE.Vector3( 1.8, -0.8, -0.5),  // 5: Linked Lists
      new THREE.Vector3( 4.2,  1.1, -0.8),  // 6: Trees
      new THREE.Vector3( 6.5, -0.7, -1.0),  // 7: Graphs
      new THREE.Vector3( 8.6,  0.9, -1.2),  // 8: DP
    ];

    // Spline curve for the pathway - smooth cyan energy highway
    const curve = new THREE.CatmullRomCurve3(pathPositions);
    const tubeGeo = new THREE.TubeGeometry(curve, 120, 0.05, 12, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const pathwayTube = new THREE.Mesh(tubeGeo, tubeMat);
    rootGroup.add(pathwayTube);

    // Dynamic outer energy pulse tube
    const beamGeo = new THREE.TubeGeometry(curve, 80, 0.09, 8, false);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    rootGroup.add(beam);

    // --- Create 3D Nodes ---
    const createNodeTextSprite = (text, status, stepNum) => {
      const canvas = document.createElement('canvas');
      canvas.width = 440;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');

      // Rounded background pill with high-contrast glassmorphic gradient
      ctx.fillStyle = 'rgba(6, 11, 25, 0.95)';
      ctx.beginPath();
      ctx.roundRect(8, 8, 424, 84, 18);
      ctx.fill();

      let strokeColor = '#475569';
      let textColor = '#cbd5e1';
      let badgeBg = 'rgba(71, 85, 105, 0.3)';
      let badgeTextColor = '#94a3b8';

      if (status === 'completed') {
        strokeColor = '#10b981';
        textColor = '#f0fdf4';
        badgeBg = 'rgba(16, 185, 129, 0.25)';
        badgeTextColor = '#34d399';
      } else if (status === 'in_progress') {
        strokeColor = '#06b6d4';
        textColor = '#f0fdfa';
        badgeBg = 'rgba(6, 182, 212, 0.3)';
        badgeTextColor = '#22d3ee';
      }

      // Border glow
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(8, 8, 424, 84, 18);
      ctx.stroke();

      // Step badge circle
      ctx.fillStyle = badgeBg;
      ctx.beginPath();
      ctx.arc(46, 50, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Step number
      ctx.font = 'bold 20px "Inter", -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = badgeTextColor;
      ctx.fillText(stepNum, 46, 50);

      // Title text
      ctx.font = 'bold 24px "Inter", -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textColor;
      ctx.fillText(text, 82, 50);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(2.6, 0.6, 1);
      return sprite;
    };

    const nodeMeshes = [];
    const pulsingNodes = [];

    nodes.forEach((node, idx) => {
      const pos = pathPositions[idx];
      const nodeGroup = new THREE.Group();
      nodeGroup.position.copy(pos);
      nodeGroup.userData = { nodeData: node, index: idx };

      let coreColor = 0x334155;
      let emissiveColor = 0x0f172a;
      let isGlow = false;

      if (node.status === 'completed') {
        coreColor = 0x10b981;
        emissiveColor = 0x059669;
        isGlow = true;
      } else if (node.status === 'in_progress') {
        coreColor = 0x06b6d4;
        emissiveColor = 0x2563eb;
        isGlow = true;
      }

      // Celestial Planet Sphere
      const geo = new THREE.SphereGeometry(0.48, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: coreColor,
        emissive: emissiveColor,
        emissiveIntensity: isGlow ? 0.9 : 0.2,
        roughness: 0.25,
        metalness: 0.6,
      });
      const station = new THREE.Mesh(geo, mat);
      station.userData = { isClickable: true, nodeData: node };
      nodeGroup.add(station);

      // Status-specific atmospheric effects
      if (node.status === 'completed') {
        // Glowing Planetary Ring
        const ringG = new THREE.RingGeometry(0.65, 0.85, 32);
        const ringM = new THREE.MeshBasicMaterial({
          color: 0x34d399,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        });
        const ring = new THREE.Mesh(ringG, ringM);
        ring.rotation.x = Math.PI / 2.5;
        nodeGroup.add(ring);
        pulsingNodes.push({ obj: ring, type: 'rotate', speed: 0.015 });
      } else if (node.status === 'in_progress') {
        // Pulsing Neon Beacon Atmosphere
        const auraG = new THREE.SphereGeometry(0.68, 20, 20);
        const auraM = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.6,
        });
        const aura = new THREE.Mesh(auraG, auraM);
        nodeGroup.add(aura);
        pulsingNodes.push({ obj: aura, type: 'pulse', speed: 3.5 });
      } else {
        // Locked milestone subtle ring
        const lockRingG = new THREE.RingGeometry(0.6, 0.68, 24);
        const lockRingM = new THREE.MeshBasicMaterial({
          color: 0x475569,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.4,
        });
        const lockRing = new THREE.Mesh(lockRingG, lockRingM);
        lockRing.rotation.x = Math.PI / 2.5;
        nodeGroup.add(lockRing);
      }

      // Sprite Label with clean vertical clearance to eliminate overlap
      const labelSprite = createNodeTextSprite(node.title, node.status, node.order);
      const labelYOffset = idx % 2 === 0 ? -1.5 : 1.5;
      labelSprite.position.set(0, labelYOffset, 0);
      nodeGroup.add(labelSprite);

      rootGroup.add(nodeGroup);
      nodeMeshes.push(station);
    });

    // --- Mouse Parallax & Interaction ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouse.targetX = (x / rect.width) * 2 - 1;
      mouse.targetY = -(y / rect.height) * 2 + 1;
      mouseVec.x = mouse.targetX;
      mouseVec.y = mouse.targetY;
    };

    const handleClick = (e) => {
      raycaster.setFromCamera(mouseVec, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes, true);
      if (intersects.length > 0) {
        const clickedData = intersects[0].object.userData?.nodeData;
        if (clickedData) {
          setSelectedNode(clickedData);
        }
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);

    // Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth camera parallax — gentler on the horizontal S-curve
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      // Limit rotation so leftmost node doesn't disappear off-screen
      rootGroup.rotation.y = mouse.x * 0.15;
      rootGroup.rotation.x = -mouse.y * 0.10;

      stars.rotation.y = time * 0.005;

      // Pulse nodes
      pulsingNodes.forEach((p) => {
        if (p.type === 'rotate') {
          p.obj.rotation.z += p.speed;
        } else if (p.type === 'pulse') {
          const s = 1 + Math.sin(time * p.speed) * 0.15;
          p.obj.scale.set(s, s, s);
        }
      });

      // Raycast hover check
      raycaster.setFromCamera(mouseVec, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes, true);
      if (intersects.length > 0) {
        container.style.cursor = 'pointer';
        setHoveredNodeName(intersects[0].object.userData?.nodeData?.title);
      } else {
        container.style.cursor = 'default';
        setHoveredNodeName(null);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      tubeGeo.dispose();
      beamGeo.dispose();
      starGeo.dispose();
      starMat.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[580px] lg:h-[660px] rounded-3xl overflow-hidden glass-panel-glow shadow-cyber-box border border-cyan-500/30">
      
      {/* 3D Canvas */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top HUD Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-dark-950/85 border border-cyan-500/40 backdrop-blur-md text-xs font-mono text-cyan-300">
          <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
          <span>3D Space Pathway // 8 Algorithmic Constellations</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            {hoveredNodeName ? `Target: ${hoveredNodeName}` : 'Click any node to inspect challenges'}
          </span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-dark-950/85 border border-dark-700 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Completed
            </span>
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" /> Current
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-600" /> Locked
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Holographic Milestone Detail Modal (When Node Clicked) */}
      {selectedNode && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-dark-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-dark-900/95 border border-cyan-500/40 shadow-glow-cyan p-6 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                  selectedNode.status === 'completed'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : selectedNode.status === 'in_progress'
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-glow-cyan'
                    : 'bg-dark-800 border-dark-700 text-slate-500'
                }`}>
                  {selectedNode.status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : selectedNode.status === 'in_progress' ? (
                    <Play className="w-6 h-6 animate-pulse" />
                  ) : (
                    <Lock className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-dark-700 bg-dark-800 text-slate-400">
                      Milestone #{selectedNode.order}
                    </span>
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                      selectedNode.status === 'completed'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : selectedNode.status === 'in_progress'
                        ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                        : 'border-slate-700 bg-slate-800/40 text-slate-500'
                    }`}>
                      {selectedNode.status === 'completed' ? 'Completed' : selectedNode.status === 'in_progress' ? 'Current Focus' : 'Locked'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">{selectedNode.title}</h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {selectedNode.desc}
            </p>

            {/* Recommended Problems */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Targeted Practice Challenges
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedNode.problems?.map((prob, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-dark-850/90 border border-dark-700 text-xs text-slate-200"
                  >
                    <span className="font-medium truncate">{prob}</span>
                    <Link
                      to={`/problems`}
                      className="text-cyan-400 hover:text-cyan-300 ml-2"
                      title="Solve problem"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedNode(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                Close
              </button>
              <Link
                to={`/problems?topic=${encodeURIComponent(selectedNode.topic)}`}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-brand transition-all hover:scale-105"
              >
                <span>Jump into {selectedNode.title}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-dark-950/80 border border-dark-700 backdrop-blur-md text-[11px] font-mono text-slate-400 pointer-events-none flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Drag cursor to orbit cosmic space pathway</span>
      </div>

    </div>
  );
};

export default Roadmap3DSpace;
