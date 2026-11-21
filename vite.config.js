import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// O script js/app.js é um arquivo clássico (sem import/export) para que o site
// também funcione ao abrir o index.html direto do computador. O Vite não
// empacota scripts clássicos, então ele é copiado para dist/js/app.js aqui.
export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'copy-classic-script',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'js/app.js',
          source: readFileSync(new URL('./js/app.js', import.meta.url)),
        });
      },
    },
  ],
});
