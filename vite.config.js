import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/fluxly/',
  build: {
    // Aumentar o limite de aviso para 1000 kB (opcional)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Estratégia manual de chunking para reduzir tamanho inicial
        manualChunks: (id) => {
          // React core e bibliotecas principais ficam em um chunk separado
          if (id.includes('node_modules')) {
            if (id.includes('react') || 
                id.includes('react-dom') || 
                id.includes('scheduler')) {
              return 'vendor-react'
            }
            
            if (id.includes('@supabase') || id.includes('supabase')) {
              return 'vendor-supabase'
            }
            
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            
            if (id.includes('tailwind') || 
                id.includes('clsx') || 
                id.includes('tailwind-merge')) {
              return 'vendor-styles'
            }
            
            // Demais dependências
            return 'vendor-others'
          }
          
          // Componentes pesados carregados sob demanda já estão com lazy loading
          return null
        },
        
        // Otimizar nomes dos arquivos
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    // Minificação mais agressiva (padrão já é 'esbuild')
    minify: 'esbuild',
    // Gerar sourcemaps apenas em desenvolvimento
    sourcemap: false,
    // Remover console.log em produção (opcional)
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})