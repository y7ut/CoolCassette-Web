import { Check, Eye, Hammer } from 'lucide-react'

interface StatusBadgeProps {
  status: 'built' | 'preview_ready' | 'not_built'
  size?: 'sm' | 'md'
}

const STATUS_CONFIG = {
  built: {
    Icon: Check,
    label: 'BUILT',
    className: 'bg-accent/15 text-accent border-accent/30',
  },
  preview_ready: {
    Icon: Eye,
    label: 'PREVIEW',
    className: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  not_built: {
    Icon: Hammer,
    label: 'NOT BUILT',
    className: 'bg-dim/10 text-dim border-dim/30',
  },
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const { Icon, label, className } = STATUS_CONFIG[status]
  const iconSize = size === 'md' ? 16 : 12
  const padding = size === 'md' ? 'px-3 py-1' : 'px-2 py-0.5'
  const textSize = size === 'md' ? 'text-xs' : 'text-[10px]'

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${padding} ${textSize} font-mono tracking-wider border ${className}`}
    >
      <Icon size={iconSize} strokeWidth={2} />
      {label}
    </span>
  )
}
