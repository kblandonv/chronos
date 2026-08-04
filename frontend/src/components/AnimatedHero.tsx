import { useEffect, useRef } from "react"

interface Point {
  x: number
  y: number
  vx: number
  vy: number
}

/** A drifting particle network, canvas-based, resizes with its parent and
 * adapts colors to light/dark. Purely decorative -- no interaction. */
export default function AnimatedHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    let width = 0
    let height = 0
    let points: Point[] = []
    let frameId = 0

    const prefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches

    function resize() {
      const parent = canvas!.parentElement
      if (!parent) return
      width = parent.clientWidth
      height = parent.clientHeight
      canvas!.width = width * devicePixelRatio
      canvas!.height = height * devicePixelRatio
      ctx!.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)

      const count = Math.min(90, Math.round((width * height) / 16000))
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
      }))
    }

    function tick() {
      ctx!.clearRect(0, 0, width, height)
      const dark = prefersDark()
      const lineRgb = dark ? "196, 181, 253" : "124, 58, 237"
      const dotColor = dark ? "rgba(216, 180, 254, 0.9)" : "rgba(109, 40, 217, 0.85)"

      for (const p of points) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1
      }

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i]
          const b = points[j]
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (dist < 130) {
            ctx!.strokeStyle = `rgba(${lineRgb}, ${0.18 * (1 - dist / 130)})`
            ctx!.lineWidth = 1
            ctx!.beginPath()
            ctx!.moveTo(a.x, a.y)
            ctx!.lineTo(b.x, b.y)
            ctx!.stroke()
          }
        }
      }

      ctx!.fillStyle = dotColor
      for (const p of points) {
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, 1.7, 0, Math.PI * 2)
        ctx!.fill()
      }

      frameId = requestAnimationFrame(tick)
    }

    resize()
    tick()
    window.addEventListener("resize", resize)
    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(frameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
}
