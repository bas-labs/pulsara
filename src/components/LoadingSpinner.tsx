import { motion } from 'framer-motion'

export default function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex justify-center py-20 ${className}`}
    >
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </motion.div>
  )
}
