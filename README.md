# LuxeCafe — Cafe Order & Management System (Frontend)

LuxeCafe, kafe ve restoran işletmelerinin günlük sipariş ve masa yönetim süreçlerini uçtan uca dijitalleştirmek amacıyla geliştirilmiş modern ve responsive bir web arayüzüdür.

## Öne Çıkan Özellikler
- Dinamik Masa Takibi: Restoran içindeki masaların doluluk, boşluk ve rezerve durumlarının anlık olarak izlenmesi.
- Hızlı Sipariş ve Adisyon Yönetimi: Masalara sipariş ekleme, adisyon bölme, hesap kapatma ve anlık tutar hesaplama.
- Dijital Menü ve Kategori Yönetimi: Yiyecek ve içeceklerin kategorilere göre filtrelenmesi ve hızlı ürün arama.
- Personel ve Yönetici Dostu Arayüz: Tablet, POS cihazları ve masaüstü ekranlara tam uyumlu modern kullanıcı deneyimi.

## Teknolojiler
- React / Next.js
- TypeScript
- Tailwind CSS
- REST API Entegrasyonu
- Vercel (Canlı Dağıtım)
- 
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
