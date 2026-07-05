import React from 'react'

/**
 * MoonStatus — elemento de assinatura visual da plataforma.
 *
 * Em vez de badges/pills genéricos, o status de cada tarefa, projeto ou
 * caso é representado como uma fase da lua — referência direta ao
 * "Crescente" (documento de tarefas da escola) e ao Grupo Luar Sem
 * Limites. A lua cresce conforme a tarefa avança:
 *
 *   nova       → Aberta       (ainda não iniciada)
 *   crescente  → Em andamento (em progresso)
 *   cheia      → Concluída    (finalizada)
 *   eclipse    → Escalada     (requer atenção / encaminhamento externo)
 */

const STATUS_MAP = {
  aberta: { label: 'Aberta', fill: 0, color: '#1B2340' },
  em_andamento: { label: 'Em andamento', fill: 0.5, color: '#D4AF6A' },
  concluida: { label: 'Concluída', fill: 1, color: '#4E7C6F' },
  escalada: { label: 'Escalada', fill: 1, color: '#C15B4A', pulse: true }
}

export default function MoonStatus({ status = 'aberta', size = 20, showLabel = true, className = '' }) {
  const config = STATUS_MAP[status] || STATUS_MAP.aberta
  const r = size / 2 - 1
  const cx = size / 2
  const cy = size / 2
  const shadowOffset = config.fill * (r * 2)
  const clipId = `moon-clip-${status}-${size}`

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative inline-block" style={{ width: size, height: size }} aria-hidden="true">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <clipPath id={clipId}>
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
          </defs>
          <circle cx={cx} cy={cy} r={r} fill="#F7F6F3" stroke="#E4E1D8" strokeWidth="1" />
          <g clipPath={`url(#${clipId})`}>
            <circle cx={cx} cy={cy} r={r} fill={config.color} />
            <circle cx={cx - r + shadowOffset} cy={cy} r={r} fill="#F7F6F3" />
          </g>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E4E1D8" strokeWidth="1" />
        </svg>
        {config.pulse && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ backgroundColor: config.color, opacity: 0.35 }}
          />
        )}
      </span>
      {showLabel && (
        <span className="text-sm font-medium" style={{ color: config.color }}>
          {config.label}
        </span>
      )}
    </span>
  )
}

export const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([value, v]) => ({
  value,
  label: v.label
}))
