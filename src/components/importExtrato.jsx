import React, { useState, useRef } from 'react'
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'

export function ImportExtrato({ onImport, user }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const transacoes = results.data
            .filter(row => row.valor && row.descricao)
            .map(row => ({
              descricao: row.descricao || row.Descrição || row.Descricao,
              valor: parseFloat(String(row.valor || row.Valor).replace(',', '.')) || 0,
              data: row.data || row.Data || new Date().toLocaleDateString('en-CA'),
              tipo: row.tipo || 'gasto_diario',
              categoria: row.categoria || 'Outros',
              pago: row.pago === 'true' || row.pago === 'sim' || false
            }))
          resolve(transacoes)
        },
        error: reject
      })
    })
  }

  const parseOFX = async (file) => {
    // Placeholder - implementar com ofx-parser se necessário
    return new Promise((resolve, reject) => {
      reject(new Error('Parser OFX ainda não implementado'))
    })
  }

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      let transacoes = []
      if (file.name.endsWith('.csv')) {
        transacoes = await parseCSV(file)
      } else if (file.name.endsWith('.ofx')) {
        transacoes = await parseOFX(file)
      } else {
        throw new Error('Formato não suportado. Use CSV ou OFX.')
      }

      if (transacoes.length === 0) {
        throw new Error('Nenhuma transação encontrada no arquivo.')
      }

      setPreview(transacoes)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmImport = async () => {
    if (!preview || preview.length === 0) return

    setLoading(true)
    try {
      await onImport(preview)
      setPreview(null)
      setIsOpen(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setPreview(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
            <Upload size={14} className="text-slate-600" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-gray-400 uppercase">Importar extrato</p>
            <p className="text-[11px] font-bold text-gray-700">CSV ou OFX</p>
          </div>
        </div>
        <FileText size={14} className="text-gray-300" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-800">Importar Extrato</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {!preview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-slate-400 transition-colors"
                >
                  <Upload size={28} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-gray-400 uppercase">Clique para selecionar</p>
                  <p className="text-[9px] text-gray-300 mt-1">CSV ou OFX</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.ofx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-emerald-50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span className="text-[10px] font-black text-emerald-700">
                        {preview.length} transações encontradas
                      </span>
                    </div>
                    <button onClick={handleCancel} className="text-[9px] text-gray-400 hover:text-gray-600">
                      Cancelar
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {preview.slice(0, 5).map((tx, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-2 text-[10px]">
                        <p className="font-bold text-gray-700">{tx.descricao}</p>
                        <p className="text-gray-400">R$ {tx.valor.toFixed(2)} · {tx.data}</p>
                      </div>
                    ))}
                    {preview.length > 5 && (
                      <p className="text-center text-[8px] text-gray-300">+ {preview.length - 5} outras</p>
                    )}
                  </div>

                  <button
                    onClick={handleConfirmImport}
                    disabled={loading}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-40 active:scale-95 transition-all"
                  >
                    {loading ? 'Importando...' : `Importar ${preview.length} transações`}
                  </button>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-rose-50 rounded-xl p-3">
                  <AlertCircle size={12} className="text-rose-500" />
                  <p className="text-[9px] font-bold text-rose-600">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}