import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import type { Variants, Transition } from 'framer-motion'

/* ─── Easing Curves ─── */
export const smooth = [0.22, 1, 0.36, 1] as [number, number, number, number]
export const bounce = [0.34, 1.56, 0.64, 1] as [number, number, number, number]
export const snappy = [0.16, 1, 0.3, 1] as [number, number, number, number]

/* ─── Variants ─── */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: smooth },
  }),
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease: smooth },
  }),
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: bounce },
  },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: smooth },
  },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: smooth },
  },
}

/* ─── Parent Stagger Variants ─── */
export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

export const staggerFast: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

/* ─── Page Transition ─── */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: smooth },
  },
}

/* ─── Spring Config ─── */
export const springHover: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 17,
}

/* ─── Animated Counter Hook ─── */
export function useCountUp(target: number, duration: number = 2) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const step = target / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [isInView, target, duration])

  return { count, ref }
}
