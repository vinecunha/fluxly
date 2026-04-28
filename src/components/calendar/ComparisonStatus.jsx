import React from 'react'
import { Minus, TrendingUp as TrendUp, TrendingDown as TrendDown } from 'lucide-react'

function ComparisonStatus({ percentual, isMelhor, isGasto }) {
  const absPercent = Math.abs(percentual)
  
  const getStatusConfig = () => {
    if (absPercent < 5) {
      return { 
        text: 'Na média', 
        color: 'text-gray-500', 
        bg: 'bg-gray-100', 
        icon: <Minus size={10} /> 
      }
    }
    
    if (isMelhor) {
      return { 
        text: `${absPercent.toFixed(0)}% melhor`, 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-100', 
        icon: <TrendUp size={10} /> 
      }
    }
    
    return { 
      text: `${absPercent.toFixed(0)}% pior`, 
      color: 'text-rose-600', 
      bg: 'bg-rose-100', 
      icon: <TrendDown size={10} /> 
    }
  }
  
  const status = getStatusConfig()
  
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${status.bg}`}>
      {status.icon}
      <span className={`text-[8px] font-black ${status.color}`}>{status.text}</span>
    </div>
  )
}

export default ComparisonStatus
