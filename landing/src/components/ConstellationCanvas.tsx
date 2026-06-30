'use client'

import { useEffect, useRef } from 'react'

interface ConstellationProps {
  count?: number
  speed?: number
  connectDist?: number
  dotColor?: string
  lineOpacity?: number
  className?: string
  style?: React.CSSProperties
}

export default function ConstellationCanvas({
  count = 55,
  speed = 0.22,
  connectDist = 140,
  dotColor = '180,155,100',
  lineOpacity = 0.15,
  className = '',
  style,
}: ConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctxRaw = canvas.getContext('2d')
    if (!ctxRaw) return
    const ctx = ctxRaw
    const c = canvas

    interface Node {
      x: number
      y: number
      r: number
      a: number
      vx: number
      vy: number
      pulse: number
    }

    let W = 0
    let H = 0
    let nodes: Node[] = []
    let animId: number
    let frame = 0

    function resize() {
      const parent = c.parentElement
      if (!parent) return
      W = c.width = Math.round(parent.getBoundingClientRect().width)
      H = c.height = Math.round(parent.offsetHeight)
    }

    function spawn() {
      nodes = []
      const n = Math.max(count, Math.floor((W * H) / 9000))
      for (let i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.9 + Math.random() * 1.7,
          a: 0.1 + Math.random() * 0.3,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          pulse: Math.random() * Math.PI * 2,
        })
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      frame++

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < connectDist) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(${dotColor},${(1 - dist / connectDist) * lineOpacity})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      for (const d of nodes) {
        const tw = d.a * (0.6 + 0.4 * Math.sin(frame * 0.013 + d.pulse))
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${dotColor},${tw})`
        ctx.fill()

        d.x += d.vx
        d.y += d.vy
        if (d.x < -4) d.x = W + 4
        if (d.x > W + 4) d.x = -4
        if (d.y < -4) d.y = H + 4
        if (d.y > H + 4) d.y = -4
      }

      animId = requestAnimationFrame(draw)
    }

    function handleResize() {
      resize()
      spawn()
    }

    resize()
    spawn()
    draw()
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [count, speed, connectDist, dotColor, lineOpacity])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={style}
    />
  )
}
