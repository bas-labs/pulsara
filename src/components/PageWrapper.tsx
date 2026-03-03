import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/animations'
import type { ReactNode } from 'react'

export default function PageWrapper({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}
