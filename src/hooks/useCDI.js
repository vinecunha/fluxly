import { useState, useEffect } from 'react'

export function useCDI() {
  const [taxaAnual, setTaxaAnual] = useState(0.1315) // Fallback (13.15%)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCDI() {
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