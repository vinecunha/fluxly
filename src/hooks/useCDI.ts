import { useState, useEffect } from 'react'

interface UseCDIReturn {
  taxaAnual: number
  loading: boolean
}

export function useCDI(): UseCDIReturn {
  const [taxaAnual, setTaxaAnual] = useState(0.1315)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCDI(): Promise<void> {
      try {
        const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json')
        const data = await response.json()
        
        if (data && data[0]) {
          const valorDiario = parseFloat(data[0].valor)
          const anual = (Math.pow(1 + (valorDiario / 100), 252) - 1)
          setTaxaAnual(anual)
        }
      } catch (error) {
        console.error("Erro ao buscar CDI real:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCDI()
  }, [])

  return { taxaAnual, loading }
}