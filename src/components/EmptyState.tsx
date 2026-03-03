import { motion } from 'framer-motion'
import { scaleIn } from '@/lib/animations'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <motion.div variants={scaleIn} initial="hidden" animate="visible">
          <Icon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500 text-lg mb-1">{title}</p>
          {description && <p className="text-zinc-400 text-sm mb-4">{description}</p>}
          {action && <div className="mt-4">{action}</div>}
        </motion.div>
      </CardContent>
    </Card>
  )
}
