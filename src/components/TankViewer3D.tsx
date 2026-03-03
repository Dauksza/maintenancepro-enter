/**
 * TankViewer3D
 * 3-D rendering of an asphalt storage tank using Three.js.
 * Supports vertical cylinder, horizontal cylinder, and rectangular shapes.
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { TankShape } from '@/lib/types'

export interface TankViewer3DProps {
  tankShape?: TankShape
  /** For cylinders: diameter (ft).  For rectangles: width (ft). */
  diameterFt: number
  /** Cylinder height (ft) OR rectangular height (ft). */
  heightFt: number
  /** Horizontal cylinder / rectangular length (ft). */
  lengthFt?: number
  /** Rectangular width (ft) — use diameterFt for width if absent. */
  widthFt?: number
  /** 0–100 */
  fillPercent: number
  isLow: boolean
  temperatureF: number
  /** CSS class applied to the outer container */
  className?: string
}

/** Liquid colour varies with temperature and alert state */
function liquidHex(tempF: number, isLow: boolean): number {
  if (isLow) return 0xcc2200
  if (tempF > 375) return 0xff4400
  if (tempF > 340) return 0xe07010
  return 0x8b5c1a
}

/** Build a Three.js scene for the given tank parameters */
function buildScene(props: TankViewer3DProps, width: number, height: number) {
  const {
    tankShape = 'Vertical Cylinder',
    diameterFt,
    heightFt,
    lengthFt,
    widthFt,
    fillPercent,
    isLow,
    temperatureF,
  } = props

  // ── Scene / Camera / Renderer ─────────────────────────────────────────────
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x111827)

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 200)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  renderer.shadowMap.enabled = true

  // ── Lighting ──────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.55))
  const sun = new THREE.DirectionalLight(0xffffff, 1.1)
  sun.position.set(6, 12, 8)
  sun.castShadow = true
  scene.add(sun)
  const fill = new THREE.DirectionalLight(0x8888ff, 0.35)
  fill.position.set(-6, 4, -6)
  scene.add(fill)

  // ── Geometry helpers ──────────────────────────────────────────────────────
  const group = new THREE.Group()
  scene.add(group)

  const shellMat = new THREE.MeshPhongMaterial({
    color: 0x8a9bb0,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    shininess: 60,
  })
  const capMat = new THREE.MeshPhongMaterial({
    color: 0x607080,
    side: THREE.DoubleSide,
    shininess: 40,
  })
  const liquidMat = new THREE.MeshPhongMaterial({
    color: liquidHex(temperatureF, isLow),
    transparent: true,
    opacity: 0.88,
    shininess: 80,
  })
  const surfaceMat = new THREE.MeshPhongMaterial({
    color: liquidHex(temperatureF, isLow),
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    shininess: 120,
  })
  const wireMat = new THREE.LineBasicMaterial({ color: 0x4a6080, transparent: true, opacity: 0.55 })

  // Normalise fill to 0..1
  const fill01 = Math.max(0, Math.min(1, fillPercent / 100))

  // ── Build by shape ────────────────────────────────────────────────────────
  if (tankShape === 'Vertical Cylinder') {
    const r = 1
    const h = heightFt > 0 && diameterFt > 0 ? (heightFt / diameterFt) * 2 : 2

    // Shell
    const shellG = new THREE.CylinderGeometry(r, r, h, 64, 1, true)
    group.add(new THREE.Mesh(shellG, shellMat))
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(r, r, h, 32, 1, false)), wireMat))
    // Caps
    const capG = new THREE.CircleGeometry(r, 64)
    const top = new THREE.Mesh(capG, capMat); top.rotation.x = -Math.PI / 2; top.position.y = h / 2; group.add(top)
    const bot = new THREE.Mesh(capG, capMat); bot.rotation.x = Math.PI / 2; bot.position.y = -h / 2; group.add(bot)
    // Liquid
    const lh = Math.max(0.001, fill01 * h)
    const liqG = new THREE.CylinderGeometry(r * 0.994, r * 0.994, lh, 64)
    const liq = new THREE.Mesh(liqG, liquidMat)
    liq.position.y = -h / 2 + lh / 2
    group.add(liq)
    // Liquid surface
    const surfG = new THREE.CircleGeometry(r * 0.994, 64)
    const surf = new THREE.Mesh(surfG, surfaceMat)
    surf.rotation.x = -Math.PI / 2
    surf.position.y = -h / 2 + lh
    group.add(surf)

    camera.position.set(r * 3.2, h * 0.6, r * 3.8)
    camera.lookAt(0, 0, 0)

  } else if (tankShape === 'Horizontal Cylinder') {
    const len = lengthFt && diameterFt > 0 ? (lengthFt / diameterFt) * 2 : 3
    const r = 1
    // Shell (cylinder along X)
    const shellG = new THREE.CylinderGeometry(r, r, len, 64, 1, true)
    shellG.rotateZ(Math.PI / 2)
    group.add(new THREE.Mesh(shellG, shellMat))
    const wireG = new THREE.CylinderGeometry(r, r, len, 32, 1, false); wireG.rotateZ(Math.PI / 2)
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(wireG), wireMat))
    // End caps
    const capG = new THREE.CircleGeometry(r, 64)
    const capL = new THREE.Mesh(capG, capMat); capL.rotation.y = Math.PI / 2; capL.position.x = -len / 2; group.add(capL)
    const capR = new THREE.Mesh(capG, capMat); capR.rotation.y = -Math.PI / 2; capR.position.x = len / 2; group.add(capR)
    // Liquid — approximate with partial cylinder height using scaling trick
    const liquidMesh = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.994, r * 0.994, len * 0.994, 64, 1, true), liquidMat)
    liquidMesh.rotation.z = Math.PI / 2
    liquidMesh.scale.y = fill01  // rough visual approximation for partial fill
    liquidMesh.position.y = -r + (fill01 * r)
    group.add(liquidMesh)

    camera.position.set(len * 0.6, r * 2.5, r * 3.5)
    camera.lookAt(0, 0, 0)

  } else {
    // Rectangular
    const w = diameterFt > 0 ? diameterFt : (widthFt ?? diameterFt)
    const l = lengthFt ?? w
    const h = heightFt > 0 ? heightFt : w
    const scale = 2 / Math.max(w, l, h)
    const sw = w * scale, sl = l * scale, sh = h * scale

    // Shell edges
    const boxGeo = new THREE.BoxGeometry(sl, sh, sw)
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo), wireMat))
    // Transparent walls
    const wallMat = shellMat.clone()
    group.add(new THREE.Mesh(boxGeo, wallMat))
    // Liquid fill
    const lh = Math.max(0.001, fill01 * sh)
    const liqG = new THREE.BoxGeometry(sl * 0.99, lh, sw * 0.99)
    const liq = new THREE.Mesh(liqG, liquidMat)
    liq.position.y = -sh / 2 + lh / 2
    group.add(liq)

    camera.position.set(sl * 1.6, sh * 1.2, sw * 2.2)
    camera.lookAt(0, 0, 0)
  }

  // ── Ground / grid ─────────────────────────────────────────────────────────
  const grid = new THREE.GridHelper(10, 20, 0x223344, 0x1a2a38)
  grid.position.y = -2
  scene.add(grid)

  return { scene, camera, renderer, group }
}

// ---------------------------------------------------------------------------

export function TankViewer3D(props: TankViewer3DProps) {
  const { className = 'w-full h-72' } = props
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    const w = el.clientWidth || 400
    const h = el.clientHeight || 288

    const { scene, camera, renderer, group } = buildScene(props, w, h)
    el.appendChild(renderer.domElement)

    let animId: number
    let angle = 0
    const animate = () => {
      animId = requestAnimationFrame(animate)
      angle += 0.006
      group.rotation.y = angle
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const observer = new ResizeObserver(() => {
      const nw = el.clientWidth
      const nh = el.clientHeight
      if (nw === 0 || nh === 0) return
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    })
    observer.observe(el)

    return () => {
      cancelAnimationFrame(animId)
      observer.disconnect()
      renderer.dispose()
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.tankShape,
    props.diameterFt,
    props.heightFt,
    props.lengthFt,
    props.widthFt,
    props.fillPercent,
    props.isLow,
    props.temperatureF,
  ])

  return <div ref={mountRef} className={`${className} rounded-lg overflow-hidden`} />
}
