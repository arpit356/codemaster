import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * AIMentorOrb3D
 * Holographic 3D Digital Assistant Orb.
 * Renders an interactive, futuristic AI neural core with rotating wireframes,
 * plasma inner sphere, and responsive energy pulses.
 */
const AIMentorOrb3D = ({ 
  isThinking = false, 
  size = 180, 
  accentColor = '#22d3ee',
  statusText = 'CodeMentor AI Core' 
}) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const pointLight = new THREE.PointLight(0x06b6d4, 4, 10);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    // Group
    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // Outer Geodesic Wireframe
    const outerGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    orbGroup.add(outerMesh);

    // Inner Glowing Core
    const innerGeo = new THREE.SphereGeometry(0.7, 32, 32);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    orbGroup.add(innerMesh);

    // Orbiting Rings
    const ringGeo1 = new THREE.TorusGeometry(1.6, 0.02, 16, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.7 });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    orbGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(1.8, 0.015, 16, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.6 });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    orbGroup.add(ring2);

    // Micro Particles
    const particleCount = 120;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 3.5;
      pPos[i + 1] = (Math.random() - 0.5) * 3.5;
      pPos[i + 2] = (Math.random() - 0.5) * 3.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    orbGroup.add(particles);

    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const speedMult = isThinking ? 2.5 : 1.0;

      orbGroup.rotation.y += 0.01 * speedMult;
      outerMesh.rotation.x -= 0.008 * speedMult;
      ring1.rotation.z += 0.012 * speedMult;
      ring2.rotation.x -= 0.009 * speedMult;
      particles.rotation.y -= 0.005 * speedMult;

      const pulse = 1 + Math.sin(time * (isThinking ? 6 : 2.5)) * (isThinking ? 0.15 : 0.05);
      innerMesh.scale.set(pulse, pulse, pulse);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      outerGeo.dispose();
      innerGeo.dispose();
      ringGeo1.dispose();
      ringGeo2.dispose();
      pGeo.dispose();
    };
  }, [isThinking, size]);

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div 
        ref={mountRef} 
        style={{ width: size, height: size }} 
        className="relative flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(6,182,212,0.45)]"
      />
      {statusText && (
        <div className="flex items-center gap-1.5 px-3 py-1 -mt-2 rounded-full bg-dark-900/90 border border-brand-500/30 text-[10px] font-mono text-cyan-300 shadow-sm">
          <span className={`w-1.5 h-1.5 rounded-full ${isThinking ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
          <span>{statusText}</span>
        </div>
      )}
    </div>
  );
};

export default AIMentorOrb3D;
