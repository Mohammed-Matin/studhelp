import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';

const PARTICLE_COUNT = 90;

const createSoftParticleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.25)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
};

const ThreeBackground = ({ intensity = 1, className = '' }) => {
    const containerRef = useRef(null);
    const { theme } = useTheme();

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const isLight = theme === 'light';
        const texture = createSoftParticleTexture();

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
        camera.position.z = 60;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const colors = isLight
            ? [0x7c3aed, 0x0891b2]
            : [0x22d3ee, 0xa855f7];

        const layers = colors.map((color, layerIndex) => {
            const particles = [];
            const positions = new Float32Array(PARTICLE_COUNT * 3);

            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const x = (Math.random() - 0.5) * 100;
                const y = (Math.random() - 0.5) * 100;
                const z = (Math.random() - 0.5) * 40 - layerIndex * 10;
                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;
                particles.push({
                    x, y, z,
                    vx: (Math.random() - 0.5) * 0.012,
                    vy: (Math.random() - 0.5) * 0.012,
                    vz: (Math.random() - 0.5) * 0.008,
                });
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const material = new THREE.PointsMaterial({
                color,
                map: texture,
                size: isLight ? 2.2 : 2.8,
                transparent: true,
                opacity: (isLight ? 0.18 : 0.28) * intensity,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                sizeAttenuation: true,
            });

            const system = new THREE.Points(geometry, material);
            scene.add(system);

            return { particles, geometry, material, system };
        });

        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);

            layers.forEach(({ particles, geometry, system }, layerIndex) => {
                const pos = geometry.attributes.position.array;

                for (let i = 0; i < PARTICLE_COUNT; i++) {
                    const p = particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.z += p.vz;

                    if (Math.abs(p.x) > 50) p.vx *= -1;
                    if (Math.abs(p.y) > 50) p.vy *= -1;
                    if (Math.abs(p.z) > 25) p.vz *= -1;

                    pos[i * 3] = p.x;
                    pos[i * 3 + 1] = p.y;
                    pos[i * 3 + 2] = p.z;
                }

                geometry.attributes.position.needsUpdate = true;
                system.rotation.y += 0.00008 * (layerIndex + 1);
            });

            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            texture.dispose();
            renderer.dispose();
            layers.forEach(({ geometry, material }) => {
                geometry.dispose();
                material.dispose();
            });
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [theme, intensity]);

    return (
        <div
            ref={containerRef}
            className={`three-bg fixed inset-0 pointer-events-none z-0 ${className}`}
            aria-hidden="true"
        />
    );
};

export default ThreeBackground;
