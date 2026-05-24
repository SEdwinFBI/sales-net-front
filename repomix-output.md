This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
.gitignore
components.json
eslint.config.js
index.html
package.json
public/favicon.svg
public/icons.svg
README.md
src/App.tsx
src/assets/react.svg
src/assets/vite.svg
src/components/motion/RotateHover.tsx
src/components/motion/SlideVertical.tsx
src/components/navbar/NavBarDesktop.tsx
src/components/page-template/PageMeta.tsx
src/components/page-template/PageTabs.tsx
src/components/page-template/PageTemplate.tsx
src/components/page-template/PageTemplateSimple.tsx
src/components/route/ProtectedRoute.tsx
src/components/route/RedirectIndex.tsx
src/components/shared/product/ProductItemEdit.tsx
src/components/shared/product/SkeletonProductCard.tsx
src/components/ui/badge.tsx
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/combobox.tsx
src/components/ui/dialog.tsx
src/components/ui/drawer.tsx
src/components/ui/field.tsx
src/components/ui/input-group.tsx
src/components/ui/input.tsx
src/components/ui/label.tsx
src/components/ui/separator.tsx
src/components/ui/skeleton.tsx
src/components/ui/textarea.tsx
src/features/auth/components/index.tsx
src/features/auth/components/LoginForm.tsx
src/features/auth/hooks/useLoginMutation.ts
src/features/auth/index.tsx
src/features/auth/pages/LoginPage.tsx
src/features/auth/routes.tsx
src/features/auth/services/auth-service.ts
src/features/auth/types/auth.ts
src/features/auth/types/form.ts
src/features/auth/utils/schema.ts
src/features/catalog/index.tsx
src/features/catalog/pages/ProductsCategories.tsx
src/features/catalog/pages/ProductsList.tsx
src/features/catalog/routes.tsx
src/features/core/hooks/useDesktopMediaQuery.ts
src/features/core/hooks/useMediaQuery.ts
src/features/core/index.tsx
src/features/core/pages/ErrorPage.tsx
src/features/core/pages/UnauthorizePage.tsx
src/features/core/routes.tsx
src/features/core/store/auth-store.ts
src/features/sales/components/CartButton.tsx
src/features/sales/components/CartDrawer.tsx
src/features/sales/components/CartItemComponent.tsx
src/features/sales/components/CheckoutDialog.tsx
src/features/sales/components/ClearCartDialog.tsx
src/features/sales/components/CustomerSelect.tsx
src/features/sales/components/index.tsx
src/features/sales/components/ListProduct.tsx
src/features/sales/components/ProductCard.tsx
src/features/sales/components/ProductItem.tsx
src/features/sales/components/VariantSelectionDrawer.tsx
src/features/sales/hooks/useCreateSale.ts
src/features/sales/hooks/useProduct.ts
src/features/sales/index.tsx
src/features/sales/mocks/productos.ts
src/features/sales/pages/PosPage.tsx
src/features/sales/routes.tsx
src/features/sales/services/products-service.ts
src/features/sales/store/useSalesStore.ts
src/features/sales/types/sales.ts
src/features/sales/utils/utilsSales.ts
src/features/usuarios/hooks/useCustomers.ts
src/features/usuarios/index.tsx
src/features/usuarios/mocks/customers.ts
src/features/usuarios/services/customers-service.ts
src/features/usuarios/types/customers-types.ts
src/helpers/money.ts
src/index.css
src/layouts/login/LoginLayout.tsx
src/layouts/main/DesktopSidebar.tsx
src/layouts/main/LayoutHeader.tsx
src/layouts/main/MainLayout.tsx
src/layouts/main/MobileSidebar.tsx
src/lib/api.ts
src/lib/app-routes.tsx
src/lib/motion.ts
src/lib/query-keys.ts
src/lib/utils.ts
src/main.tsx
src/routes/routes.tsx
tsconfig.app.json
tsconfig.json
tsconfig.node.json
vite.config.ts
```

# Files

## File: .gitignore
````
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

.qwen
.agents
skills-lock.json
````

## File: components.json
````json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
````

## File: eslint.config.js
````javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
````

## File: index.html
````html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>sales-net</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
````

## File: package.json
````json
{
  "name": "sales-net-front",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "gen-feature": "powershell -NoProfile -ExecutionPolicy Bypass -Command \"$n = $env:npm_config_name; if ($n) { $p = \\\"src/features/$n\\\"; 'components','services','hooks','types','utils' | ForEach-Object { New-Item -Path \\\"$p/$_\\\" -ItemType Directory -Force }; New-Item -Path \\\"$p/index.tsx\\\" -ItemType File -Force } else { Write-Error 'Debes usar --name=nombre' }\""
  },
  "dependencies": {
    "@base-ui/react": "^1.4.1",
    "@fontsource-variable/geist": "^5.2.8",
    "@hookform/resolvers": "^5.2.2",
    "@tailwindcss/vite": "^4.2.2",
    "@tanstack/react-query": "^5.96.1",
    "@tanstack/react-table": "^8.21.3",
    "axios": "^1.14.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "currency.js": "^2.0.4",
    "date-fns": "^4.1.0",
    "jwt-decode": "^4.0.0",
    "lucide-react": "^1.7.0",
    "motion": "^12.38.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-helmet-async": "^3.0.0",
    "react-hook-form": "^7.72.0",
    "react-modal-sheet": "^5.6.0",
    "react-router": "^7.14.0",
    "react-to-print": "^3.3.0",
    "recharts": "^3.8.1",
    "shadcn": "^4.1.2",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "tailwindcss": "^4.2.2",
    "tw-animate-css": "^1.4.0",
    "vaul": "^1.1.2",
    "zod": "^4.3.6",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "@babel/core": "^7.29.0",
    "@eslint/js": "^9.39.4",
    "@rolldown/plugin-babel": "^0.2.1",
    "@types/babel__core": "^7.20.5",
    "@types/node": "^24.12.2",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "babel-plugin-react-compiler": "^1.0.0",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.4.0",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.57.0",
    "vite": "^8.0.1"
  }
}
````

## File: public/favicon.svg
````xml
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="46" fill="none" viewBox="0 0 48 46"><path fill="#863bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" style="fill:#863bff;fill:color(display-p3 .5252 .23 1);fill-opacity:1"/><mask id="a" width="48" height="46" x="0" y="0" maskUnits="userSpaceOnUse" style="mask-type:alpha"><path fill="#000" d="M25.842 44.938c-.664.844-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.183c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.498 0-3.579-1.842-3.579H1.133c-.92 0-1.456-1.04-.92-1.787L9.91.473c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.578 1.842 3.578h11.377c.943 0 1.473 1.088.89 1.832L25.843 44.94z" style="fill:#000;fill-opacity:1"/></mask><g mask="url(#a)"><g filter="url(#b)"><ellipse cx="5.508" cy="14.704" fill="#ede6ff" rx="5.508" ry="14.704" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -4.47 31.516)"/></g><g filter="url(#c)"><ellipse cx="10.399" cy="29.851" fill="#ede6ff" rx="10.399" ry="29.851" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -39.328 7.883)"/></g><g filter="url(#d)"><ellipse cx="5.508" cy="30.487" fill="#7e14ff" rx="5.508" ry="30.487" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.814 -25.913 -14.639)scale(1 -1)"/></g><g filter="url(#e)"><ellipse cx="5.508" cy="30.599" fill="#7e14ff" rx="5.508" ry="30.599" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.814 -32.644 -3.334)scale(1 -1)"/></g><g filter="url(#f)"><ellipse cx="5.508" cy="30.599" fill="#7e14ff" rx="5.508" ry="30.599" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -34.34 30.47)"/></g><g filter="url(#g)"><ellipse cx="14.072" cy="22.078" fill="#ede6ff" rx="14.072" ry="22.078" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="rotate(93.35 24.506 48.493)scale(-1 1)"/></g><g filter="url(#h)"><ellipse cx="3.47" cy="21.501" fill="#7e14ff" rx="3.47" ry="21.501" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.009 28.708 47.59)scale(-1 1)"/></g><g filter="url(#i)"><ellipse cx="3.47" cy="21.501" fill="#7e14ff" rx="3.47" ry="21.501" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.009 28.708 47.59)scale(-1 1)"/></g><g filter="url(#j)"><ellipse cx=".387" cy="8.972" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(39.51 .387 8.972)"/></g><g filter="url(#k)"><ellipse cx="47.523" cy="-6.092" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 47.523 -6.092)"/></g><g filter="url(#l)"><ellipse cx="41.412" cy="6.333" fill="#47bfff" rx="5.971" ry="9.665" style="fill:#47bfff;fill:color(display-p3 .2799 .748 1);fill-opacity:1" transform="rotate(37.892 41.412 6.333)"/></g><g filter="url(#m)"><ellipse cx="-1.879" cy="38.332" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 -1.88 38.332)"/></g><g filter="url(#n)"><ellipse cx="-1.879" cy="38.332" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 -1.88 38.332)"/></g><g filter="url(#o)"><ellipse cx="35.651" cy="29.907" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 35.651 29.907)"/></g><g filter="url(#p)"><ellipse cx="38.418" cy="32.4" fill="#47bfff" rx="5.971" ry="15.297" style="fill:#47bfff;fill:color(display-p3 .2799 .748 1);fill-opacity:1" transform="rotate(37.892 38.418 32.4)"/></g></g><defs><filter id="b" width="60.045" height="41.654" x="-19.77" y="16.149" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="c" width="90.34" height="51.437" x="-54.613" y="-7.533" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="d" width="79.355" height="29.4" x="-49.64" y="2.03" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="e" width="79.579" height="29.4" x="-45.045" y="20.029" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="f" width="79.579" height="29.4" x="-43.513" y="21.178" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="g" width="74.749" height="58.852" x="15.756" y="-17.901" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="h" width="61.377" height="25.362" x="23.548" y="2.284" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="i" width="61.377" height="25.362" x="23.548" y="2.284" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="j" width="56.045" height="63.649" x="-27.636" y="-22.853" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="k" width="54.814" height="64.646" x="20.116" y="-38.415" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="l" width="33.541" height="35.313" x="24.641" y="-11.323" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="m" width="54.814" height="64.646" x="-29.286" y="6.009" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="n" width="54.814" height="64.646" x="-29.286" y="6.009" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="o" width="54.814" height="64.646" x="8.244" y="-2.416" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="p" width="39.409" height="43.623" x="18.713" y="10.588" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter></defs></svg>
````

## File: public/icons.svg
````xml
<svg xmlns="http://www.w3.org/2000/svg">
  <symbol id="bluesky-icon" viewBox="0 0 16 17">
    <g clip-path="url(#bluesky-clip)"><path fill="#08060d" d="M7.75 7.735c-.693-1.348-2.58-3.86-4.334-5.097-1.68-1.187-2.32-.981-2.74-.79C.188 2.065.1 2.812.1 3.251s.241 3.602.398 4.13c.52 1.744 2.367 2.333 4.07 2.145-2.495.37-4.71 1.278-1.805 4.512 3.196 3.309 4.38-.71 4.987-2.746.608 2.036 1.307 5.91 4.93 2.746 2.72-2.746.747-4.143-1.747-4.512 1.702.189 3.55-.4 4.07-2.145.156-.528.397-3.691.397-4.13s-.088-1.186-.575-1.406c-.42-.19-1.06-.395-2.741.79-1.755 1.24-3.64 3.752-4.334 5.099"/></g>
    <defs><clipPath id="bluesky-clip"><path fill="#fff" d="M.1.85h15.3v15.3H.1z"/></clipPath></defs>
  </symbol>
  <symbol id="discord-icon" viewBox="0 0 20 19">
    <path fill="#08060d" d="M16.224 3.768a14.5 14.5 0 0 0-3.67-1.153c-.158.286-.343.67-.47.976a13.5 13.5 0 0 0-4.067 0c-.128-.306-.317-.69-.476-.976A14.4 14.4 0 0 0 3.868 3.77C1.546 7.28.916 10.703 1.231 14.077a14.7 14.7 0 0 0 4.5 2.306q.545-.748.965-1.587a9.5 9.5 0 0 1-1.518-.74q.191-.14.372-.293c2.927 1.369 6.107 1.369 8.999 0q.183.152.372.294-.723.437-1.52.74.418.838.963 1.588a14.6 14.6 0 0 0 4.504-2.308c.37-3.911-.63-7.302-2.644-10.309m-9.13 8.234c-.878 0-1.599-.82-1.599-1.82 0-.998.705-1.82 1.6-1.82.894 0 1.614.82 1.599 1.82.001 1-.705 1.82-1.6 1.82m5.91 0c-.878 0-1.599-.82-1.599-1.82 0-.998.705-1.82 1.6-1.82.893 0 1.614.82 1.599 1.82 0 1-.706 1.82-1.6 1.82"/>
  </symbol>
  <symbol id="documentation-icon" viewBox="0 0 21 20">
    <path fill="none" stroke="#aa3bff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.35" d="m15.5 13.333 1.533 1.322c.645.555.967.833.967 1.178s-.322.623-.967 1.179L15.5 18.333m-3.333-5-1.534 1.322c-.644.555-.966.833-.966 1.178s.322.623.966 1.179l1.534 1.321"/>
    <path fill="none" stroke="#aa3bff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.35" d="M17.167 10.836v-4.32c0-1.41 0-2.117-.224-2.68-.359-.906-1.118-1.621-2.08-1.96-.599-.21-1.349-.21-2.848-.21-2.623 0-3.935 0-4.983.369-1.684.591-3.013 1.842-3.641 3.428C3 6.449 3 7.684 3 10.154v2.122c0 2.558 0 3.838.706 4.726q.306.383.713.671c.76.536 1.79.64 3.581.66"/>
    <path fill="none" stroke="#aa3bff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.35" d="M3 10a2.78 2.78 0 0 1 2.778-2.778c.555 0 1.209.097 1.748-.047.48-.129.854-.503.982-.982.145-.54.048-1.194.048-1.749a2.78 2.78 0 0 1 2.777-2.777"/>
  </symbol>
  <symbol id="github-icon" viewBox="0 0 19 19">
    <path fill="#08060d" fill-rule="evenodd" d="M9.356 1.85C5.05 1.85 1.57 5.356 1.57 9.694a7.84 7.84 0 0 0 5.324 7.44c.387.079.528-.168.528-.376 0-.182-.013-.805-.013-1.454-2.165.467-2.616-.935-2.616-.935-.349-.91-.864-1.143-.864-1.143-.71-.48.051-.48.051-.48.787.051 1.2.805 1.2.805.695 1.194 1.817.857 2.268.649.064-.507.27-.857.49-1.052-1.728-.182-3.545-.857-3.545-3.87 0-.857.31-1.558.8-2.104-.078-.195-.349-1 .077-2.078 0 0 .657-.208 2.14.805a7.5 7.5 0 0 1 1.946-.26c.657 0 1.328.092 1.946.26 1.483-1.013 2.14-.805 2.14-.805.426 1.078.155 1.883.078 2.078.502.546.799 1.247.799 2.104 0 3.013-1.818 3.675-3.558 3.87.284.247.528.714.528 1.454 0 1.052-.012 1.896-.012 2.156 0 .208.142.455.528.377a7.84 7.84 0 0 0 5.324-7.441c.013-4.338-3.48-7.844-7.773-7.844" clip-rule="evenodd"/>
  </symbol>
  <symbol id="social-icon" viewBox="0 0 20 20">
    <path fill="none" stroke="#aa3bff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.35" d="M12.5 6.667a4.167 4.167 0 1 0-8.334 0 4.167 4.167 0 0 0 8.334 0"/>
    <path fill="none" stroke="#aa3bff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.35" d="M2.5 16.667a5.833 5.833 0 0 1 8.75-5.053m3.837.474.513 1.035c.07.144.257.282.414.309l.93.155c.596.1.736.536.307.965l-.723.73a.64.64 0 0 0-.152.531l.207.903c.164.715-.213.991-.84.618l-.872-.52a.63.63 0 0 0-.577 0l-.872.52c-.624.373-1.003.094-.84-.618l.207-.903a.64.64 0 0 0-.152-.532l-.723-.729c-.426-.43-.289-.864.306-.964l.93-.156a.64.64 0 0 0 .412-.31l.513-1.034c.28-.562.735-.562 1.012 0"/>
  </symbol>
  <symbol id="x-icon" viewBox="0 0 19 19">
    <path fill="#08060d" fill-rule="evenodd" d="M1.893 1.98c.052.072 1.245 1.769 2.653 3.77l2.892 4.114c.183.261.333.48.333.486s-.068.089-.152.183l-.522.593-.765.867-3.597 4.087c-.375.426-.734.834-.798.905a1 1 0 0 0-.118.148c0 .01.236.017.664.017h.663l.729-.83c.4-.457.796-.906.879-.999a692 692 0 0 0 1.794-2.038c.034-.037.301-.34.594-.675l.551-.624.345-.392a7 7 0 0 1 .34-.374c.006 0 .93 1.306 2.052 2.903l2.084 2.965.045.063h2.275c1.87 0 2.273-.003 2.266-.021-.008-.02-1.098-1.572-3.894-5.547-2.013-2.862-2.28-3.246-2.273-3.266.008-.019.282-.332 2.085-2.38l2-2.274 1.567-1.782c.022-.028-.016-.03-.65-.03h-.674l-.3.342a871 871 0 0 1-1.782 2.025c-.067.075-.405.458-.75.852a100 100 0 0 1-.803.91c-.148.172-.299.344-.99 1.127-.304.343-.32.358-.345.327-.015-.019-.904-1.282-1.976-2.808L6.365 1.85H1.8zm1.782.91 8.078 11.294c.772 1.08 1.413 1.973 1.425 1.984.016.017.241.02 1.05.017l1.03-.004-2.694-3.766L7.796 5.75 5.722 2.852l-1.039-.004-1.039-.004z" clip-rule="evenodd"/>
  </symbol>
</svg>
````

## File: README.md
````markdown
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

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

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

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
````

## File: src/App.tsx
````typescript
import { RouterProvider } from 'react-router'
import { router } from '@/routes/routes'

export default function App() {
  return <RouterProvider router={router} />
}
````

## File: src/assets/react.svg
````xml
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="35.93" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 228"><path fill="#00D8FF" d="M210.483 73.824a171.49 171.49 0 0 0-8.24-2.597c.465-1.9.893-3.777 1.273-5.621c6.238-30.281 2.16-54.676-11.769-62.708c-13.355-7.7-35.196.329-57.254 19.526a171.23 171.23 0 0 0-6.375 5.848a155.866 155.866 0 0 0-4.241-3.917C100.759 3.829 77.587-4.822 63.673 3.233C50.33 10.957 46.379 33.89 51.995 62.588a170.974 170.974 0 0 0 1.892 8.48c-3.28.932-6.445 1.924-9.474 2.98C17.309 83.498 0 98.307 0 113.668c0 15.865 18.582 31.778 46.812 41.427a145.52 145.52 0 0 0 6.921 2.165a167.467 167.467 0 0 0-2.01 9.138c-5.354 28.2-1.173 50.591 12.134 58.266c13.744 7.926 36.812-.22 59.273-19.855a145.567 145.567 0 0 0 5.342-4.923a168.064 168.064 0 0 0 6.92 6.314c21.758 18.722 43.246 26.282 56.54 18.586c13.731-7.949 18.194-32.003 12.4-61.268a145.016 145.016 0 0 0-1.535-6.842c1.62-.48 3.21-.974 4.76-1.488c29.348-9.723 48.443-25.443 48.443-41.52c0-15.417-17.868-30.326-45.517-39.844Zm-6.365 70.984c-1.4.463-2.836.91-4.3 1.345c-3.24-10.257-7.612-21.163-12.963-32.432c5.106-11 9.31-21.767 12.459-31.957c2.619.758 5.16 1.557 7.61 2.4c23.69 8.156 38.14 20.213 38.14 29.504c0 9.896-15.606 22.743-40.946 31.14Zm-10.514 20.834c2.562 12.94 2.927 24.64 1.23 33.787c-1.524 8.219-4.59 13.698-8.382 15.893c-8.067 4.67-25.32-1.4-43.927-17.412a156.726 156.726 0 0 1-6.437-5.87c7.214-7.889 14.423-17.06 21.459-27.246c12.376-1.098 24.068-2.894 34.671-5.345a134.17 134.17 0 0 1 1.386 6.193ZM87.276 214.515c-7.882 2.783-14.16 2.863-17.955.675c-8.075-4.657-11.432-22.636-6.853-46.752a156.923 156.923 0 0 1 1.869-8.499c10.486 2.32 22.093 3.988 34.498 4.994c7.084 9.967 14.501 19.128 21.976 27.15a134.668 134.668 0 0 1-4.877 4.492c-9.933 8.682-19.886 14.842-28.658 17.94ZM50.35 144.747c-12.483-4.267-22.792-9.812-29.858-15.863c-6.35-5.437-9.555-10.836-9.555-15.216c0-9.322 13.897-21.212 37.076-29.293c2.813-.98 5.757-1.905 8.812-2.773c3.204 10.42 7.406 21.315 12.477 32.332c-5.137 11.18-9.399 22.249-12.634 32.792a134.718 134.718 0 0 1-6.318-1.979Zm12.378-84.26c-4.811-24.587-1.616-43.134 6.425-47.789c8.564-4.958 27.502 2.111 47.463 19.835a144.318 144.318 0 0 1 3.841 3.545c-7.438 7.987-14.787 17.08-21.808 26.988c-12.04 1.116-23.565 2.908-34.161 5.309a160.342 160.342 0 0 1-1.76-7.887Zm110.427 27.268a347.8 347.8 0 0 0-7.785-12.803c8.168 1.033 15.994 2.404 23.343 4.08c-2.206 7.072-4.956 14.465-8.193 22.045a381.151 381.151 0 0 0-7.365-13.322Zm-45.032-43.861c5.044 5.465 10.096 11.566 15.065 18.186a322.04 322.04 0 0 0-30.257-.006c4.974-6.559 10.069-12.652 15.192-18.18ZM82.802 87.83a323.167 323.167 0 0 0-7.227 13.238c-3.184-7.553-5.909-14.98-8.134-22.152c7.304-1.634 15.093-2.97 23.209-3.984a321.524 321.524 0 0 0-7.848 12.897Zm8.081 65.352c-8.385-.936-16.291-2.203-23.593-3.793c2.26-7.3 5.045-14.885 8.298-22.6a321.187 321.187 0 0 0 7.257 13.246c2.594 4.48 5.28 8.868 8.038 13.147Zm37.542 31.03c-5.184-5.592-10.354-11.779-15.403-18.433c4.902.192 9.899.29 14.978.29c5.218 0 10.376-.117 15.453-.343c-4.985 6.774-10.018 12.97-15.028 18.486Zm52.198-57.817c3.422 7.8 6.306 15.345 8.596 22.52c-7.422 1.694-15.436 3.058-23.88 4.071a382.417 382.417 0 0 0 7.859-13.026a347.403 347.403 0 0 0 7.425-13.565Zm-16.898 8.101a358.557 358.557 0 0 1-12.281 19.815a329.4 329.4 0 0 1-23.444.823c-7.967 0-15.716-.248-23.178-.732a310.202 310.202 0 0 1-12.513-19.846h.001a307.41 307.41 0 0 1-10.923-20.627a310.278 310.278 0 0 1 10.89-20.637l-.001.001a307.318 307.318 0 0 1 12.413-19.761c7.613-.576 15.42-.876 23.31-.876H128c7.926 0 15.743.303 23.354.883a329.357 329.357 0 0 1 12.335 19.695a358.489 358.489 0 0 1 11.036 20.54a329.472 329.472 0 0 1-11 20.722Zm22.56-122.124c8.572 4.944 11.906 24.881 6.52 51.026c-.344 1.668-.73 3.367-1.15 5.09c-10.622-2.452-22.155-4.275-34.23-5.408c-7.034-10.017-14.323-19.124-21.64-27.008a160.789 160.789 0 0 1 5.888-5.4c18.9-16.447 36.564-22.941 44.612-18.3ZM128 90.808c12.625 0 22.86 10.235 22.86 22.86s-10.235 22.86-22.86 22.86s-22.86-10.235-22.86-22.86s10.235-22.86 22.86-22.86Z"></path></svg>
````

## File: src/assets/vite.svg
````xml
<svg xmlns="http://www.w3.org/2000/svg" width="77" height="47" fill="none" aria-labelledby="vite-logo-title" viewBox="0 0 77 47"><title id="vite-logo-title">Vite</title><style>.parenthesis{fill:#000}@media (prefers-color-scheme:dark){.parenthesis{fill:#fff}}</style><path fill="#9135ff" d="M40.151 45.71c-.663.844-2.02.374-2.02-.699V34.708a2.26 2.26 0 0 0-2.262-2.262H24.493c-.92 0-1.457-1.04-.92-1.788l7.479-10.471c1.07-1.498 0-3.578-1.842-3.578H15.443c-.92 0-1.456-1.04-.92-1.788l9.696-13.576c.213-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.472c-1.07 1.497 0 3.578 1.842 3.578h11.376c.944 0 1.474 1.087.89 1.83L40.153 45.712z"/><mask id="a" width="48" height="47" x="14" y="0" maskUnits="userSpaceOnUse" style="mask-type:alpha"><path fill="#000" d="M40.047 45.71c-.663.843-2.02.374-2.02-.699V34.708a2.26 2.26 0 0 0-2.262-2.262H24.389c-.92 0-1.457-1.04-.92-1.788l7.479-10.472c1.07-1.497 0-3.578-1.842-3.578H15.34c-.92 0-1.456-1.04-.92-1.788l9.696-13.575c.213-.297.556-.474.92-.474H53.93c.92 0 1.456 1.04.92 1.788L47.37 13.03c-1.07 1.498 0 3.578 1.842 3.578h11.376c.944 0 1.474 1.088.89 1.831L40.049 45.712z"/></mask><g mask="url(#a)"><g filter="url(#b)"><ellipse cx="5.508" cy="14.704" fill="#eee6ff" rx="5.508" ry="14.704" transform="rotate(269.814 20.96 11.29)scale(-1 1)"/></g><g filter="url(#c)"><ellipse cx="10.399" cy="29.851" fill="#eee6ff" rx="10.399" ry="29.851" transform="rotate(89.814 -16.902 -8.275)scale(1 -1)"/></g><g filter="url(#d)"><ellipse cx="5.508" cy="30.487" fill="#8900ff" rx="5.508" ry="30.487" transform="rotate(89.814 -19.197 -7.127)scale(1 -1)"/></g><g filter="url(#e)"><ellipse cx="5.508" cy="30.599" fill="#8900ff" rx="5.508" ry="30.599" transform="rotate(89.814 -25.928 4.177)scale(1 -1)"/></g><g filter="url(#f)"><ellipse cx="5.508" cy="30.599" fill="#8900ff" rx="5.508" ry="30.599" transform="rotate(89.814 -25.738 5.52)scale(1 -1)"/></g><g filter="url(#g)"><ellipse cx="14.072" cy="22.078" fill="#eee6ff" rx="14.072" ry="22.078" transform="rotate(93.35 31.245 55.578)scale(-1 1)"/></g><g filter="url(#h)"><ellipse cx="3.47" cy="21.501" fill="#8900ff" rx="3.47" ry="21.501" transform="rotate(89.009 35.419 55.202)scale(-1 1)"/></g><g filter="url(#i)"><ellipse cx="3.47" cy="21.501" fill="#8900ff" rx="3.47" ry="21.501" transform="rotate(89.009 35.419 55.202)scale(-1 1)"/></g><g filter="url(#j)"><ellipse cx="14.592" cy="9.743" fill="#8900ff" rx="4.407" ry="29.108" transform="rotate(39.51 14.592 9.743)"/></g><g filter="url(#k)"><ellipse cx="61.728" cy="-5.321" fill="#8900ff" rx="4.407" ry="29.108" transform="rotate(37.892 61.728 -5.32)"/></g><g filter="url(#l)"><ellipse cx="55.618" cy="7.104" fill="#00c2ff" rx="5.971" ry="9.665" transform="rotate(37.892 55.618 7.104)"/></g><g filter="url(#m)"><ellipse cx="12.326" cy="39.103" fill="#8900ff" rx="4.407" ry="29.108" transform="rotate(37.892 12.326 39.103)"/></g><g filter="url(#n)"><ellipse cx="12.326" cy="39.103" fill="#8900ff" rx="4.407" ry="29.108" transform="rotate(37.892 12.326 39.103)"/></g><g filter="url(#o)"><ellipse cx="49.857" cy="30.678" fill="#8900ff" rx="4.407" ry="29.108" transform="rotate(37.892 49.857 30.678)"/></g><g filter="url(#p)"><ellipse cx="52.623" cy="33.171" fill="#00c2ff" rx="5.971" ry="15.297" transform="rotate(37.892 52.623 33.17)"/></g></g><path d="M6.919 0c-9.198 13.166-9.252 33.575 0 46.789h6.215c-9.25-13.214-9.196-33.623 0-46.789zm62.424 0h-6.215c9.198 13.166 9.252 33.575 0 46.789h6.215c9.25-13.214 9.196-33.623 0-46.789" class="parenthesis"/><defs><filter id="b" width="60.045" height="41.654" x="-5.564" y="16.92" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17286" stdDeviation="7.659"/></filter><filter id="c" width="90.34" height="51.437" x="-40.407" y="-6.762" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17286" stdDeviation="7.659"/></filter><filter id="d" width="79.355" height="29.4" x="-35.435" y="2.801" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17286" stdDeviation="4.596"/></filter><filter id="e" width="79.579" height="29.4" x="-30.84" y="20.8" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17286" stdDeviation="4.596"/></filter><filter id="f" width="79.579" height="29.4" x="-29.307" y="21.949" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17286" stdDeviation="4.596"/></filter><filter id="g" width="74.749" height="58.852" x="29.961" y="-17.13" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17286" stdDeviation="7.659"/></filter><filter id="h" width="61.377" height="25.362" x="37.754" y="3.055" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17286" stdDeviation="4.596"/></filter><filter id="i" width="61.377" height="25.362" x="37.754" y="3.055" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17286" stdDeviation="4.596"/></filter><filter id="j" width="56.045" height="63.649" x="-13.43" y="-22.082" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17286" stdDeviation="4.596"/></filter><filter id="k" width="54.814" height="64.646" x="34.321" y="-37.644" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17286" stdDeviation="4.596"/></filter><filter id="l" width="33.541" height="35.313" x="38.847" y="-10.552" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17286" stdDeviation="4.596"/></filter><filter id="m" width="54.814" height="64.646" x="-15.081" y="6.78" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17286" stdDeviation="4.596"/></filter><filter id="n" width="54.814" height="64.646" x="-15.081" y="6.78" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17286" stdDeviation="4.596"/></filter><filter id="o" width="54.814" height="64.646" x="22.45" y="-1.645" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17286" stdDeviation="4.596"/></filter><filter id="p" width="39.409" height="43.623" x="32.919" y="11.36" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17286" stdDeviation="4.596"/></filter></defs></svg>
````

## File: src/components/motion/RotateHover.tsx
````typescript
import type { FC, ReactNode } from "react";
import * as motion from 'motion/react-client'


type props = {
    children: ReactNode,
    rotate?: number;
}

/**
 * Para animar la posicion de un elemento al pasar el mouse
 */
const RotateHover: FC<props> = ({ children, rotate = 1 }) => {
    return (
        <motion.div whileHover={{ rotate }} >
            {children}
        </motion.div>
    )
}

export default RotateHover
````

## File: src/components/motion/SlideVertical.tsx
````typescript
import type { FC, ReactNode } from "react";
import * as motion from 'motion/react-client'
import { slideVertical } from "@/lib/motion";



type props = {
    children: ReactNode
}

/**
 * Para animar la entrada inicial al cargar un componente de forma vertical
 */
const SlideVertical: FC<props> = ({ children }) => {
    return (
        <motion.div
            variants={slideVertical}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.6, ease: "easeOut" }}>
            {children}
        </motion.div>
    )
}

export default SlideVertical
````

## File: src/components/navbar/NavBarDesktop.tsx
````typescript
import { NavLink, useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import type { SidebarItem } from '@/lib/app-routes'

type NavBarDesktopProps = {
  items: SidebarItem[]
  expanded?: boolean
  onNavigate?: () => void
  expandedModules?: string[]
  onToggleModule?: (moduleId: string) => void
}

/** Construye la ruta */
function buildFullPath(item: SidebarItem, parentPath?: string): string {
  const currentPath = parentPath ? `${parentPath}/${item.path}` : `/${item.path}`
  return currentPath
}

/** Verifica  */
function isItemOrDescendantActive(item: SidebarItem, currentPathname: string, parentPath?: string): boolean {
  const fullPath = buildFullPath(item, parentPath)
  if (currentPathname === fullPath || currentPathname.startsWith(`${fullPath}/`)) return true
  return item.children.some((child) => isItemOrDescendantActive(child, currentPathname, fullPath))
}

/** Renderiza los hijos*/
function SubItems({
  items,
  expanded,
  onNavigate,
  expandedModules,
  onToggleModule,
  parentPath,
  depth,
}: {
  items: SidebarItem[]
  expanded: boolean
  onNavigate?: () => void
  expandedModules?: string[]
  onToggleModule?: (moduleId: string) => void
  parentPath: string
  depth: number
}) {
  const location = useLocation()
  const guideLeft = `${4 + depth * 12}px`
  const connectorWidth = `${8}px`

  const hasActiveInLevel = items.some((item) => {
    const fullPath = buildFullPath(item, parentPath)
    const isActive = location.pathname === fullPath || location.pathname.startsWith(`${fullPath}/`)
    if (isActive) return true
    if (item.children.length > 0) {
      const checkDesc = (children: SidebarItem[], pp: string): boolean => {
        return children.some((c) => {
          const cp = buildFullPath(c, pp)
          if (location.pathname === cp || location.pathname.startsWith(`${cp}/`)) return true
          return c.children.length > 0 && checkDesc(c.children, cp)
        })
      }
      if (checkDesc(item.children, fullPath)) return true
    }
    return false
  })

  return (
    <div className={cn('relative ml-3', depth > 0 && 'mt-1')}>
      {/* Línea guía vertical */}
      <div
        className={cn(
          'absolute top-0 bottom-0 w-0.5 rounded-full transition-colors duration-200',
          hasActiveInLevel ? 'bg-primary' : 'bg-stone-500',
        )}
        style={{ left: guideLeft }}
      />

      <div className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children.length > 0
          const fullPath = buildFullPath(item, parentPath)
          const isLeaf = !!item.lazy && !hasChildren
          const isItemExpanded = expandedModules?.includes(item.id) ?? false
          const isActiveItem = location.pathname === fullPath || location.pathname.startsWith(`${fullPath}/`)

          const lineClass = isActiveItem ? 'bg-primary' : 'bg-stone-500'
          const dotClass = isActiveItem ? 'bg-primary' : 'bg-stone-300/90'
          const textClass = isActiveItem ? 'text-stone-700 font-semibold text-[0.73rem]' : 'text-stone-500 group-hover:text-stone-600 text-[0.73rem]'
          const iconClass = isActiveItem ? 'text-primary/90' : 'text-stone-400 group-hover:text-stone-500'

          if (isLeaf) {
            return (
              <NavLink
                key={item.id}
                to={fullPath}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group relative border border-s-olive-200 flex items-center gap-1 rounded-lg px-5 py-0.5 transition-all duration-200 ease-out',
                    'bg-stone-100/20',
                    isActive && 'bg-primary/8', textClass

                  )
                }
              >
                {/* Conector horizontal */}
                <div className={cn('absolute top-1/2 h-0.5 rounded-full transition-colors duration-200', lineClass)} style={{ left: guideLeft, width: connectorWidth }} />

                {Icon && (
                  <div className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded transition-colors duration-150',
                    iconClass,
                  )}>
                    <Icon className="size-3" />
                  </div>
                )}
                {!Icon && (
                  <span className={cn(
                    'size-1 shrink-0 rounded-full mt-px transition-colors duration-150',
                    dotClass,
                  )} />
                )}
                <div className="min-w-0 flex-1">
                  <span className={cn(
                    'block truncate transition-colors duration-150',
                    textClass,
                  )}>
                    {item.name}
                  </span>
                  {/* {item.description && depth === 0 && (
                    <span className="block truncate text-[0.63rem] text-stone-400 mt-0.5">
                      {item.description}
                    </span>
                  )} */}
                </div>
              </NavLink>
            )
          }

          // Seccion intermedia
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => onToggleModule?.(item.id)}
                className={cn(
                  'group relative flex border border-stone-200 w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-200 ease-out',
                  'hover:bg-white/3',
                  isActiveItem && 'bg-primary/8',

                )}
              >
                {/* Conector horizontal */}
                <div className={cn('absolute top-1/2 h-0.5 rounded-full transition-colors duration-200', lineClass)} style={{ left: guideLeft, width: connectorWidth }} />

                {Icon && (
                  <div className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded transition-colors duration-150',
                    iconClass,
                  )}>
                    <Icon className="size-3" />
                  </div>
                )}
                {!Icon && (
                  <span className={cn(
                    'size-1 shrink-0 rounded-full mt-px transition-colors duration-150',
                    dotClass,
                  )} />
                )}
                <div className="min-w-0 flex-1 text-left">
                  <span className={cn(
                    'block truncate transition-colors duration-150',
                    textClass,
                  )}>
                    {item.name}
                  </span>
                  {/* {item.description && depth === 0 && (
                    <span className="block truncate text-[0.63rem] text-stone-400 mt-0.5">
                      {item.description}
                    </span>
                  )} */}
                </div>
              </button>

              {isItemExpanded && (
                <SubItems
                  items={item.children}
                  expanded={expanded}
                  onNavigate={onNavigate}
                  expandedModules={expandedModules}
                  onToggleModule={onToggleModule}
                  parentPath={fullPath}
                  depth={depth + 1}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function NavBarDesktop({
  items,
  expanded = false,
  onNavigate,
  expandedModules = [],
  onToggleModule,
}: NavBarDesktopProps) {
  const location = useLocation()

  return (
    <div className="flex h-full flex-col">
      {/* Branding */}
      <div
        className={cn(
          'flex items-center rounded-2xl max-h-15 border border-white/15 bg-linear-to-br from-primary to-primary/85 py-2.5 text-white shadow-[0_4px_16px_-4px_rgba(53,37,205,0.25),0_0_0_1px_rgba(53,37,205,0.1)] transition-all duration-200 ease-out',
          expanded ? 'justify-start gap-3 px-4' : 'justify-center px-3',
        )}
      >
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-black uppercase tracking-widest text-amber-300/90 ring-1 ring-white/5">
          SN
        </div>
        <div
          className={cn(
            'overflow-hidden transition-[width,opacity,transform] duration-200 ease-out',
            expanded ? 'w-32 translate-x-0 opacity-100' : 'w-0 -translate-x-2 opacity-0',
          )}
        >
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-secondary">
            Sales Net
          </p>
          <p className="mt-1 text-xs text-white/60">
            Panel comercial
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-5 flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children.length > 0
          const isModuleExpanded = expandedModules.includes(item.id)
          const isActiveModule = hasChildren && isItemOrDescendantActive(item, location.pathname)
          const showChildren = hasChildren && isModuleExpanded

          // Modulo nivel raiz 
          if (hasChildren) {
            return (
              <div key={item.id} className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => onToggleModule?.(item.id)}
                  className={cn(
                    'flex w-full items-center rounded-2xl border py-1.5 transition-all duration-300 ease-out active:scale-[0.98]',
                    expanded ? 'justify-start gap-3 px-3.5' : 'justify-center gap-0 px-1',
                    isActiveModule
                      ? 'border-primary/20 bg-primary/8 shadow-[0_0_16px_-4px_rgba(99,102,241,0.15)]'
                      : 'border-stone-200 bg-transparent text-stone-500 hover:border-stone-200/60 hover:bg-white/70 hover:text-stone-700 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)]',
                  )}
                >
                  <>
                    <div
                      className={cn(
                        'rounded-xl p-2 transition-all duration-300 ease-out',
                        isActiveModule ? 'bg-primary/12 ring-1 ring-primary/15' : 'bg-stone-100',
                        expanded && 'hover:scale-105',
                      )}
                    >
                      {Icon && <Icon className={cn('size-4', isActiveModule ? 'text-primary' : 'text-stone-500')} />}
                    </div>
                    <div
                      className={cn(
                        'overflow-hidden transition-[width,opacity,transform] duration-300 ease-out',
                        expanded ? 'w-32 translate-x-0 opacity-100' : 'w-0 -translate-x-2 opacity-0',
                      )}
                    >
                      <p className={cn('text-sm font-semibold whitespace-nowrap', isActiveModule ? 'text-primary' : 'text-stone-700')}>
                        {item.name}
                      </p>
                      {item.description && (
                        <p className={cn('text-[0.7rem] whitespace-nowrap', isActiveModule ? 'text-primary/75' : 'text-stone-400')}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </>
                </button>

                {/* Hijos como sub-items */}
                {showChildren && expanded && (
                  <div className="overflow-hidden pl-3">
                    <SubItems
                      items={item.children}
                      expanded={expanded}
                      onNavigate={onNavigate}
                      expandedModules={expandedModules}
                      onToggleModule={onToggleModule}
                      parentPath={`/${item.path}`}
                      depth={0}
                    />
                  </div>
                )}
              </div>
            )
          }

          // Pagina simple 
          return (
            <NavLink
              key={item.id}
              to={`/${item.path}`}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-2xl border py-1.5 transition-all duration-300 ease-out active:scale-[0.98]',
                  expanded ? 'justify-start gap-3 px-3.5' : 'justify-center gap-0 px-1',
                  isActive
                    ? 'border-primary/20 bg-primary/8 shadow-[0_0_16px_-4px_rgba(99,102,241,0.15)]'
                    : 'border-stone-200 bg-transparent text-stone-500 hover:border-stone-200/60 hover:bg-white/70 hover:text-stone-700 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'rounded-xl p-2 transition-all duration-300 ease-out',
                      isActive ? 'bg-primary/12 ring-1 ring-primary/15' : 'bg-stone-100',
                      expanded && 'hover:scale-105',
                    )}
                  >
                    {Icon && <Icon className={cn('size-4', isActive ? 'text-primary' : 'text-stone-500')} />}
                  </div>
                  <div
                    className={cn(
                      'overflow-hidden transition-[width,opacity,transform] duration-300 ease-out',
                      expanded ? 'w-32 translate-x-0 opacity-100' : 'w-0 -translate-x-2 opacity-0',
                    )}
                  >
                    <p className={cn('text-sm font-semibold whitespace-nowrap', isActive ? 'text-primary' : 'text-stone-700')}>
                      {item.name}
                    </p>
                    {item.description && (
                      <p className={cn('text-[0.7rem] whitespace-nowrap', isActive ? 'text-primary/75' : 'text-stone-400')}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
````

## File: src/components/page-template/PageMeta.tsx
````typescript
import { useEffect } from 'react'

type PageMetaProps = {
  title: string
  description: string
}

export default function PageMeta({ title, description }: PageMetaProps) {
  useEffect(() => {
    document.title = `${title} | Sales Net`

    let meta = document.querySelector('meta[name="description"]')

    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }

    meta.setAttribute('content', description)
  }, [description, title])

  return null
}
````

## File: src/components/page-template/PageTabs.tsx
````typescript
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

export type PageTabItem = {
  id: string
  label: string
  to: string
}

type PageTabsProps = {
  tabs: PageTabItem[]
}

export default function PageTabs({ tabs }: PageTabsProps) {
  if (!tabs.length) {
    return null
  }

  return (
    <div className="-mx-6 -mt-2 mb-6 border-b border-secondary px-6 md:hidden">
      <div className="flex gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'border-b-2 px-1 py-3 text-sm transition-colors',
                isActive
                  ? 'border-primary font-semibold text-primary'
                  : 'border-transparent font-medium text-neutral/70',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
````

## File: src/components/page-template/PageTemplate.tsx
````typescript
import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import PageMeta from '@/components/page-template/PageMeta'
import PageTabs, { type PageTabItem } from '@/components/page-template/PageTabs'

type props = {
  title: string
  description: string
  tabs?: PageTabItem[]
  children?: ReactNode
}

export default function PageTemplate({
  title,
  description,
  tabs = [],
  children,
}: props) {
  return (
    <>
      <PageMeta
        title={title}
        description={description}
      />

      <div className="rounded-3xl bg-transparent p-2 text-neutral ">
        <PageTabs tabs={tabs} />
        {children ?? <Outlet />}
      </div>
    </>
  )
}
````

## File: src/components/page-template/PageTemplateSimple.tsx
````typescript
import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import PageMeta from '@/components/page-template/PageMeta'

type Props = {
  title: string
  description: string
  children?: ReactNode
}

export default function PageTemplateSimple({
  title,
  description,
  children,
}: Props) {
  return (
    <>
      <PageMeta
        title={title}
        description={description}
      />

      <div className="rounded-3xl bg-transparent p-2 text-neutral ">
        {children ?? <Outlet />}
      </div>
    </>
  )
}
````

## File: src/components/route/ProtectedRoute.tsx
````typescript
import type { PropsWithChildren } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/features/core/store/auth-store'
import type { AppRole } from '@/features/auth/types/auth'
import { isTokenExpired } from '@/features/core/store/auth-store'

type ProtectedRouteProps = PropsWithChildren<{
  allowedPermissions: AppRole[]
}>

export default function ProtectedRoute({ allowedPermissions, children }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)
  const tokenExpiresAt = useAuthStore((state) => state.tokenExpiresAt)
  const location = useLocation()

  if (!user || isTokenExpired(tokenExpiresAt)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }


  const hasAccess = user.permissions.some((p) => allowedPermissions.includes(p))

  if (!hasAccess) {
    return <Navigate to="/acceso-denegado" replace />
  }

  return children ?? <Outlet />
}
````

## File: src/components/route/RedirectIndex.tsx
````typescript
import { Navigate } from 'react-router'
import { useAuthStore } from '@/features/core/store/auth-store'
import { getHomeRoute } from '@/lib/app-routes'


/**
 * RedirectIndex - Redirige al HOME del usuario según su rol.

 */
export default function RedirectIndex() {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }


  return <Navigate to={getHomeRoute(user.role)} replace />
}
````

## File: src/components/shared/product/ProductItemEdit.tsx
````typescript
import { Button } from '@/components/ui/button';
import { type ComponentType } from 'react'
import ProductItem from '../../../features/sales/components/ProductItem';

type WithAdminActionProps = {
    onEdit: () => void;
}

function withAdminAction<T extends object>(Component: ComponentType<T>) {
    type Props = Omit<T, keyof WithAdminActionProps> & WithAdminActionProps;

    const Wrapped = (props: Props) => {
        const { onEdit, ...rest } = props;

        return <>
            <div className='relative'>
                <Component {...(rest as T)} />
                <Button className="absolute top-0" onClick={onEdit}>edit</Button>
            </div>
        </>
    }

    return Wrapped;


}


const ProductItemEdit = withAdminAction(ProductItem)

export default ProductItemEdit
````

## File: src/components/shared/product/SkeletonProductCard.tsx
````typescript
import { Skeleton } from '@/components/ui/skeleton'

const SkeletonProductCard = () => {
    return (
        <div className="max-h-80 space-y-4 rounded-4xl  bg-gray-100 p-4 shadow-sm animate-pulse">
            <div className="flex mt-40 items-center justify-between gap-2">
                <Skeleton className="h-6 w-24 rounded-full bg-gray-200" />
                <Skeleton className="h-5 w-16 rounded-full bg-gray-200" />
            </div>
            <Skeleton className="h-5 w-3/4 rounded-full bg-gray-200" />
            <Skeleton className="h-5 w-1/2 rounded-full bg-gray-200" />

        </div>
    )
}

export default SkeletonProductCard
````

## File: src/components/ui/badge.tsx
````typescript
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary/90 text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants }
````

## File: src/components/ui/button.tsx
````typescript
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg  bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-primary to-primary-complement text-primary-foreground hover:opacity-90 shadow-[0px_10px_15px_-3px_rgba(28,51,200,0.2)] transition-all",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-15 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        md: "h-12 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
````

## File: src/components/ui/card.tsx
````typescript
import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex  flex-col gap-4 overflow-hidden rounded-[1rem] bg-card py-10 text-sm text-card-foreground  has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl shadow-lg",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-3 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-lg font-semibold  whitespace-break-spaces  group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end ",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-10 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/card:p-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
````

## File: src/components/ui/combobox.tsx
````typescript
"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ChevronDownIcon, XIcon, CheckIcon } from "lucide-react"

const Combobox = ComboboxPrimitive.Root

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children}
      <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
    </ComboboxPrimitive.Trigger>
  )
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      render={<InputGroupButton variant="ghost" size="icon-xs" />}
      className={cn(className)}
      {...props}
    >
      <XIcon className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  )
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean
  showClear?: boolean
}) {
  return (
    <InputGroup className={cn("w-auto", className)}>
      <ComboboxPrimitive.Input
        render={<InputGroupInput disabled={disabled} />}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            render={<ComboboxTrigger />}
            data-slot="input-group-button"
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            disabled={disabled}
          />
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  )
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset" | "anchor"
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn("group/combobox-content relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[chips=true]:min-w-(--anchor-width) data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:border-input/30 *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:shadow-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className)}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        "no-scrollbar max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0",
        className
      )}
      {...props}
    />
  )
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  )
}

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  )
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "hidden w-full justify-center py-2 text-center text-sm text-muted-foreground group-data-empty/combobox-content:flex",
        className
      )}
      {...props}
    />
  )
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
  ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        "flex min-h-8 flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent bg-clip-padding px-2.5 py-1 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 has-data-[slot=combobox-chip]:px-1 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean
}) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-foreground has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0",
        className
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          render={<Button variant="ghost" size="icon-xs" />}
          className="-ml-1 opacity-50 hover:opacity-100"
          data-slot="combobox-chip-remove"
        >
          <XIcon className="pointer-events-none" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  )
}

function ComboboxChipsInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn("min-w-16 flex-1 outline-none", className)}
      {...props}
    />
  )
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null)
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  // eslint-disable-next-line react-refresh/only-export-components
  useComboboxAnchor,
}
````

## File: src/components/ui/dialog.tsx
````typescript
import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-[70] bg-black/20 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-80 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
````

## File: src/components/ui/drawer.tsx
````typescript
import type { ComponentProps } from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'

import { cn } from '@/lib/utils'
import { useDesktopMediaQuery } from '@/features/core/hooks/useDesktopMediaQuery'


function Drawer({
  shouldScaleBackground = true,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Root>) {
  const { isDesktop, isTablet } = useDesktopMediaQuery()
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      direction={isDesktop || isTablet ? 'right' : "bottom"}
      shouldScaleBackground={shouldScaleBackground}
      {...props}
    />
  )
}

function DrawerTrigger(props: ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal(props: ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose(props: ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn('fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]', className)}
      {...props}
    />
  )
}

type DrawerContentProps = ComponentProps<typeof DrawerPrimitive.Content> & {
  overlayClassName?: string
  showHandle?: boolean
}

function DrawerContent({
  className,
  children,
  overlayClassName,
  showHandle = true,
  ...props
}: DrawerContentProps) {
  const { isDesktop, isTablet } = useDesktopMediaQuery()
  return (
    <DrawerPortal >
      <DrawerOverlay className={overlayClassName} />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          isDesktop || isTablet ?
            'fixed right-0 top-0  z-50  flex min-h-screen max-w-[35vw] flex-col rounded-l-[28px] border border-border/50 bg-background outline-none' :
            'fixed right-0 bottom-0 left-0 z-50 mt-24 flex max-h-[85vh] flex-col rounded-t-[28px] border border-border/50 bg-background outline-none',
          className,
        )}
        {...props}
      >
        {showHandle ? (
          <div
            aria-hidden
            className="mx-auto mt-10 mb-2 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/25 "
          />
        ) : null}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn('flex flex-col gap-1.5 px-4 pt-2 pb-4', className)}
      {...props}
    />
  )
}

function DrawerBody({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-body"
      className={cn('min-h-0 flex-1 overflow-y-auto px-4 pb-4', className)}
      {...props}
    />
  )
}

function DrawerFooter({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('mt-auto flex items-center gap-3 border-t border-border/60 px-4 py-4', className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-lg text-center font-semibold text-foreground', className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
}
````

## File: src/components/ui/field.tsx
````typescript
import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className
      )}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-1.5 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
        className
      )}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4",
        className
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  "group/field flex w-full gap-2 data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex flex-1 flex-col gap-0.5 leading-snug",
        className
      )}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border *:data-[slot=field]:p-2.5 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-left text-sm leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5",
        "last:mt-0 nth-last-2:-mt-1",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        className
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ]

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-sm font-normal text-destructive", className)}
      {...props}
    >
      {content}
    </div>
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
}
````

## File: src/components/ui/input-group.tsx
````typescript
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex h-8 w-full min-w-0 items-center rounded-lg border border-input transition-colors outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-disabled:bg-input/50 has-disabled:opacity-50 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto dark:bg-input/30 dark:has-disabled:bg-input/80 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5",
        className
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start":
          "order-first pl-2 has-[>button]:ml-[-0.3rem] has-[>kbd]:ml-[-0.15rem]",
        "inline-end":
          "order-last pr-2 has-[>button]:mr-[-0.3rem] has-[>kbd]:mr-[-0.15rem]",
        "block-start":
          "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
        "block-end":
          "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus()
      }}
      {...props}
    />
  )
}

const inputGroupButtonVariants = cva(
  "flex items-center gap-2 text-sm shadow-none",
  {
    variants: {
      size: {
        xs: "h-6 gap-1 rounded-[calc(var(--radius)-3px)] px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
        sm: "",
        "icon-xs":
          "size-6 rounded-[calc(var(--radius)-3px)] p-0 has-[>svg]:p-0",
        "icon-sm": "size-8 p-0 has-[>svg]:p-0",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  }
)

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "type"> &
  VariantProps<typeof inputGroupButtonVariants> & {
    type?: "button" | "submit" | "reset"
  }) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
````

## File: src/components/ui/input.tsx
````typescript
import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
````

## File: src/components/ui/label.tsx
````typescript
import * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
````

## File: src/components/ui/separator.tsx
````typescript
"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
````

## File: src/components/ui/skeleton.tsx
````typescript
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
````

## File: src/components/ui/textarea.tsx
````typescript
import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
````

## File: src/features/auth/components/index.tsx
````typescript
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import LoginForm from '@/features/auth/components/LoginForm'
import { useAuthStore } from '@/features/core/store/auth-store'
import { useLoginMutation } from '../hooks/useLoginMutation'
import type { LoginFormValues } from '../types/form'


export default function LoginFeature() {

  const toastId = 'login-request'
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const applySession = useAuthStore((state) => state.login)
  const { mutateAsync: login, isPending } = useLoginMutation()

  const performLogin = async (values: LoginFormValues) => {
    if (isPending) {
      return
    }

    try {
      toast.loading('Validando credenciales...', { id: toastId })

      const session = await login({
        username: values.username.trim(),
        password: values.password,
      })

      applySession(session)
      toast.success('Sesion iniciada', { id: toastId })
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(String(error), {
        id: toastId,
      })
    }
  }


  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [navigate, user])

  return (
    <LoginForm onSubmit={performLogin} />
  )
}
````

## File: src/features/auth/components/LoginForm.tsx
````typescript
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { LoginFormValues } from '../types/form'
import { loginSchema } from '../utils/schema'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Eye, EyeOff, LockKeyhole, Mail, MoveRight } from 'lucide-react'
import SlideVertical from '@/components/motion/SlideVertical'
import RotateHover from '@/components/motion/RotateHover'




type LoginFormProps = {
  onSubmit: (values: LoginFormValues) => Promise<void>
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',

    },
  })


  const handleFormSubmit = handleSubmit(onSubmit)

  return (
    <>

      <SlideVertical
      >
        <Card>
          <CardHeader>
            <CardTitle>
              Iniciar Sesion
            </CardTitle>
            <CardDescription>
              Ingrese sus credenciales para acceder
            </CardDescription>
          </CardHeader>
          <CardContent>

            <form className="mt-8 space-y-5 " onSubmit={handleFormSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="username">Email Address</FieldLabel>
                  <InputGroup >
                    <InputGroupInput
                      {...register('username')}
                      id="username"
                      type="text"
                      placeholder="admin@tailadmin.com"
                      aria-invalid={!!errors.username} />
                    <InputGroupAddon>
                      <Mail />
                    </InputGroupAddon>

                  </InputGroup>
                  {errors.username ?
                    <FieldDescription className="text-sm text-(--color-danger)">{errors.username.message}
                    </FieldDescription> : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <InputGroup >
                    <InputGroupInput
                      {...register('password')}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      aria-invalid={!!errors.password} />
                    <InputGroupAddon>
                      <LockKeyhole />
                    </InputGroupAddon>
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        className={"hover:bg-transparent hover:shadow-none active:bg-transparent active:scale-100 transition-none"}
                        aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>

                  {errors.password ? <FieldDescription className="text-sm text-(--color-danger)">{errors.password.message}</FieldDescription> : null}
                </Field>
              </FieldGroup>
              <RotateHover rotate={0.7}>
                <Button className={"w-full font-bold!"} type='submit' size={'lg'} disabled={isSubmitting}>
                  {isSubmitting ? 'Iniciando...' : 'Login'} <MoveRight />
                </Button>
              </RotateHover>

            </form>
          </CardContent>
        </Card>
      </SlideVertical>
    </>
  )
}
````

## File: src/features/auth/hooks/useLoginMutation.ts
````typescript
import { useMutation } from '@tanstack/react-query'
import { loginService } from '@/features/auth/services/auth-service'
import type { AuthCredentials, AuthSession } from '@/features/auth/types/auth'


export function useLoginMutation() {
  return useMutation<AuthSession, Error, AuthCredentials>({
    mutationFn: async (credentials: AuthCredentials) => {
      const session = await loginService(credentials)
      return session;
    },
    retry: false,
  })
}
````

## File: src/features/auth/index.tsx
````typescript
export { authRoutes } from './routes'
````

## File: src/features/auth/pages/LoginPage.tsx
````typescript
import PageMeta from '@/components/page-template/PageMeta'
import LoginFeature from '@/features/auth/components'
import LoginLayout from '@/layouts/login/LoginLayout'

export default function LoginPage() {
  return (
    <LoginLayout>
      <PageMeta
        title="Login"
        description="Acceso Sales Net."
      />
      <LoginFeature />
    </LoginLayout>
  )
}
````

## File: src/features/auth/routes.tsx
````typescript
import type { AppRoute } from '@/lib/app-routes'
import LoginPage from './pages/LoginPage'

export const authRoutes: AppRoute[] = [
  {
    path: '/login',
    element: < LoginPage />,
    meta: {
      name: 'Login',
      hideFromSidebar: true,
    },
  },
]
````

## File: src/features/auth/services/auth-service.ts
````typescript
import { api } from '@/lib/api'
import type { AuthCredentials, AuthSession } from '@/features/auth/types/auth'

const BYPASS_CREDENTIALS: Record<string, AuthSession> = {
  'admin:admin': {
    access: 'bypass-token-admin',
    expiresIn: '9999999999',
    user: {
      fullName: 'Admin Bypass',
      id: 1,
      role: 'admin',
      permissions: ['admin', 'vendedor'],
      username: 'admin',
    },
  },
  'vendedor:vendedor': {
    access: 'bypass-token-vendedor',
    expiresIn: '9999999999',
    user: {
      fullName: 'Vendedor Bypass',
      id: 2,
      role: 'vendedor',
      permissions: ['vendedor'],
      username: 'vendedor',
    },
  },
}

export async function loginService(credentials: AuthCredentials): Promise<AuthSession> {
  const key = `${credentials.username}:${credentials.password}`
  const bypass = BYPASS_CREDENTIALS[key]
  if (bypass) return bypass

  try {
    const { data } = await api.post<AuthSession>('/auth/login/', credentials)

    return data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {

    throw new Error('Error al iniciar sesión. Por favor, intenta de nuevo.')
  }
}
````

## File: src/features/auth/types/auth.ts
````typescript
export type AuthCredentials = {
  username: string
  password: string
}
export type AppRole = 'admin' | 'vendedor'



export type AuthSession = {
  access: string,
  expiresIn: string,
  user: User,
}
export type User = {
  fullName: string,
  id: number,
  role: AppRole,
  permissions: AppRole[],
  username: string
}
````

## File: src/features/auth/types/form.ts
````typescript
import type z from 'zod'
import type { loginSchema } from '@/features/auth/utils/schema'

export type LoginFormValues = z.infer<typeof loginSchema>
````

## File: src/features/auth/utils/schema.ts
````typescript
import z from 'zod'

export const loginSchema = z.object({
  username: z.string().min(4, 'Ingresa un usuario valido'),
  password: z.string().min(4, 'La clave demo requiere minimo 4 caracteres'),
})
````

## File: src/features/catalog/index.tsx
````typescript
export { catalogRoutes } from './routes'
````

## File: src/features/catalog/pages/ProductsCategories.tsx
````typescript
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'

export default function ProductsCategories() {
  return (
    <PageTemplateSimple
      title="Categorías"
      description="Clasificación de productos por categoría."
    >
      <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-4">
        <p className="text-sm font-semibold text-primary">Categorías</p>
      </div>
    </PageTemplateSimple>
  )
}
````

## File: src/features/catalog/pages/ProductsList.tsx
````typescript
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'

export default function ProductsList() {
  return (
    <PageTemplateSimple
      title="Productos"
      description="Listado de productos del catálogo."
    >
      <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-4">
        <p className="text-sm font-semibold text-primary">Listado de productos</p>
      </div>
    </PageTemplateSimple>
  )
}
````

## File: src/features/catalog/routes.tsx
````typescript
import { Package, Tags } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const catalogRoutes: AppRoute[] = [
  {
    path: 'catalogo',
    meta: {
      name: 'Catálogo',
      description: 'Opciones de catálogo',
      icon: Package,
    },
    children: [
      {
        path: 'productos',
        meta: {
          name: 'Productos',
          description: 'Configuración de productos',
          icon: Package,
          permissions: ['admin'],
          lazy: () => import('./pages/ProductsList'),
        },
      },
      {
        path: 'categorias',
        meta: {
          name: 'Categorías',
          description: 'Clasificación de productos',
          icon: Tags,
          permissions: ['admin'],
          lazy: () => import('./pages/ProductsCategories'),
        },
      },
    ],
  },
]
````

## File: src/features/core/hooks/useDesktopMediaQuery.ts
````typescript
import { useMediaQuery } from "./useMediaQuery"


/**
 * Para calcular el tamaño de pantalla segun dispositivos
 * @returns objetos para saber si esta en el rango > 
 */
export function useDesktopMediaQuery() {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const isTablet = useMediaQuery('(min-width: 768px)')

    return {
        isTablet,
        isDesktop,
    }
}
````

## File: src/features/core/hooks/useMediaQuery.ts
````typescript
import { useSyncExternalStore } from 'react'

/**
 * Para el calculo dinamico de pantalla
 * @param query texto tipo css 
 * @returns {boolean} si esta en el rango esperado
 * @example const isDesktop = useMediaQuery('(min-width: 1024px)')
 */
export function useMediaQuery(query: string) {
  const subscribe = (onStoreChange: () => void) => {
    const mediaQuery = window.matchMedia(query)
    mediaQuery.addEventListener('change', onStoreChange)

    return () => mediaQuery.removeEventListener('change', onStoreChange)
  }

  const getSnapshot = () => window.matchMedia(query).matches

  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => false,
  )
}
````

## File: src/features/core/index.tsx
````typescript
import ErrorPage from './pages/ErrorPage'
import UnauthorizePage from './pages/UnauthorizePage'

// eslint-disable-next-line react-refresh/only-export-components
export { coreRoutes, } from './routes'
export { ErrorPage, UnauthorizePage }
````

## File: src/features/core/pages/ErrorPage.tsx
````typescript
import { AlertTriangle } from 'lucide-react'
import { Link, useRouteError } from 'react-router'

export default function ErrorPage() {
  const error = useRouteError() as { statusText?: string; message?: string } | undefined

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-primary) px-4 py-6 text-white">
      <div className="max-w-xl rounded-[36px] border border-white/10 bg-white/8 p-8 text-center shadow-[0_28px_80px_-42px_rgba(0,0,0,0.45)] backdrop-blur">
        <AlertTriangle className="mx-auto size-12 text-(--color-secondary)" />
        <h1 className="mt-6 text-5xl font-semibold">Ruta no disponible</h1>
        <p className="mt-4 text-sm leading-7 text-white/80">
          {error?.statusText ?? error?.message ?? 'La ruta solicitada no existe o fallo durante la carga.'}
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold  transition hover:opacity-90"
        >
          <p className='text-black'>
            Volver al inicio
          </p>
        </Link>
      </div>
    </div>
  )
}
````

## File: src/features/core/pages/UnauthorizePage.tsx
````typescript
import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router'

export default function UnauthorizePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,var(--color-secondary)_0%,#ffffff_100%)] px-4 py-6">
      <div className="max-w-xl rounded-[36px] border border-(--color-secondary) bg-white/95 p-8 text-center shadow-[0_28px_80px_-42px_rgba(53,37,205,0.24)]">
        <ShieldAlert className="mx-auto size-12 text-(--color-danger)" />
        <h1 className="mt-6 text-5xl font-semibold text-(--color-neutral)">
          Acceso denegado
        </h1>
        <p className="mt-4 text-sm leading-7 text-(--color-neutral)/80">
          Tu usuario no tiene permisos para entrar a esta seccion.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex rounded-full bg-(--color-primary) px-5 py-3 text-sm font-semibold transition hover:opacity-90"
          >
            <p className='text-white'>
              Ir al inicio
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
````

## File: src/features/core/routes.tsx
````typescript
import type { AppRoute } from '@/lib/app-routes'
import ErrorPage from './pages/ErrorPage'
import UnauthorizePage from './pages/UnauthorizePage'

export const coreRoutes: AppRoute[] = [
  {
    path: '/acceso-denegado',
    element: <UnauthorizePage />,
    meta: { name: 'Acceso denegado', hideFromSidebar: true },
  },
  {
    path: '/error',
    element: <ErrorPage />,
    meta: { name: 'Error', hideFromSidebar: true },
  },
]
````

## File: src/features/core/store/auth-store.ts
````typescript
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthSession, User } from '@/features/auth/types/auth'
import { jwtDecode } from 'jwt-decode'




export type AuthUser = User

type AuthState = {
  user: AuthUser | null
  token: string | null
  tokenExpiresAt: number | null
  login: (session: AuthSession) => void
  logout: () => void
}


/**
 * Calcula cuándo expira el token.

 */
function computeExpiresAt(session: AuthSession): number | null {
  if (!session.access) return null
  try {
    const decode = jwtDecode<{ exp?: number }>(session.access)
    if (decode.exp) {
      return decode.exp * 1000
    }
  } catch {
    return null
  }

  return Date.now() + 60 * 60 * 1000
}

/** Verifica si el token está expirado. */
export function isTokenExpired(expiresAt: number | null): boolean {
  if (expiresAt === null) return false
  return Date.now() >= expiresAt
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      tokenExpiresAt: null,
      login: (session) => {
        const permissions = session.user.permissions.length > 0
          ? session.user.permissions
          : [session.user.role]

        set({
          token: session.access,
          user: {
            ...session.user,
            permissions,
          },
          tokenExpiresAt: computeExpiresAt(session),
        })
      },
      logout: () => {
        set({
          token: null,
          user: null,
          tokenExpiresAt: null,
        })
      },
    }),
    {
      name: 'sales-net-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        tokenExpiresAt: state.tokenExpiresAt,
      }),
    },
  ),
)
````

## File: src/features/sales/components/CartButton.tsx
````typescript
import { ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { useSalesStore } from '../store/useSalesStore'
import { formatCurrency } from '@/helpers/money'
import { selectTotal, selectTotalItems } from '../utils/utilsSales'




const CartButton = () => {
  const openCart = useSalesStore((state) => state.openCart)

  const totalItems = useSalesStore(selectTotalItems)
  const total = useSalesStore(selectTotal)

  return (
    <>

      <Button
        className="fixed right-0  max-[420px]:inset-x-0  bottom-0 mx-2 mb-10 flex items-center justify-between rounded-[1rem] px-4"
        size="md"
        onClick={openCart}
      >
        <div className="flex items-center gap-3">
          <span className="relative">
            <ShoppingCart className="font-bold" />
            <span className="absolute -top-2 -right-2 rounded-full bg-green-700 px-1.5 text-xs text-white">
              {totalItems}
            </span>
          </span>

          <span>Carrito ({totalItems} items)</span>
        </div>

        <span className="font-semibold">{formatCurrency(total)}</span>
      </Button>
    </>
  )
}

export default CartButton
````

## File: src/features/sales/components/CartDrawer.tsx
````typescript
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

import { useSalesStore } from '../store/useSalesStore'
import { formatCurrency } from '@/helpers/money'
import CartItemComponent from './CartItemComponent'
import { selectTotal, selectTotalItems } from '../utils/utilsSales'


const CartDrawer = () => {
  const cartOpen = useSalesStore((state) => state.cartOpen)
  const items = useSalesStore((state) => state.items)
  const openCart = useSalesStore((state) => state.openCart)
  const closeCart = useSalesStore((state) => state.closeCart)
  const openDialog = useSalesStore((state) => state.openDialog)
  const increaseQty = useSalesStore((state) => state.increaseQty)
  const decreaseQty = useSalesStore((state) => state.decreaseQty)
  const removeItem = useSalesStore((state) => state.removeItem)



  const totalItems = useSalesStore(selectTotalItems)
  const total = useSalesStore(selectTotal)

  return (
    <Drawer
      open={cartOpen}
      onOpenChange={(open) => {
        if (open) {
          openCart()
          return
        }

        closeCart()
      }}
    >
      <DrawerContent className='w-full'>
        <DrawerHeader className="mx-auto w-full max-w-2xl">
          <DrawerTitle>Carrito de Compras</DrawerTitle>
          <DrawerDescription>
            {totalItems > 0
              ? `${totalItems} item${totalItems === 1 ? '' : 's'} en la venta`
              : 'El carrito esta vacio.'}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="mx-auto w-full max-w-2xl pt-2 overflow-y-auto max-h-[calc(100vh-15rem)]">
          {items.length === 0 ? (
            <div className="rounded-[1rem] border border-dashed border-border p-6 text-sm text-muted-foreground">
              Agrega productos para empezar la venta.
            </div>
          ) : (
            <div className="grid gap-2">
              {items.map((item) => (
                <CartItemComponent
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  onIncrease={increaseQty}
                  onDecrease={decreaseQty}
                />
              ))}
            </div>
          )}
        </DrawerBody>

        <DrawerFooter className="mx-auto w-full max-w-2xl justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl  text-primary font-bold">{formatCurrency(total)}</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => openDialog('clear-cart')}
              disabled={items.length === 0}
            >
              Vaciar
            </Button>
            <Button
              onClick={() => openDialog('checkout')}
              disabled={items.length === 0}
            >
              Cobrar
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default CartDrawer
````

## File: src/features/sales/components/CartItemComponent.tsx
````typescript
import type { FC } from "react"
import type { CartItem } from "../types/sales"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/helpers/money"


type CartItemProps = {
    item: CartItem,
    onRemove: (id: string) => void,
    onIncrease: (id: string) => void,
    onDecrease: (id: string) => void,
}

const CartItemComponent: FC<CartItemProps> = ({ item, onRemove, onIncrease, onDecrease }) => {
    return (
        <div
            key={item.id}
            className="grid gap-1 rounded-[1rem] border border-border/60 p-4"
        >
            <div className="flex items-start justify-between gap-1">
                <div>
                    <p className="font-semibold">{item.name} - {item.size}</p>
                    <p className="text-sm text-muted-foreground">
                        {item.category}
                    </p>
                </div>

                <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => onRemove(item.id)}
                >
                    <Trash2 />
                </Button>
            </div>

            <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                    <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => onDecrease(item.id)}
                    >
                        <Minus />
                    </Button>
                    <span className="min-w-8 text-center font-medium">
                        {item.qty}
                    </span>
                    <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => onIncrease(item.id)}
                    >
                        <Plus />
                    </Button>
                </div>

                <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price)} c/u
                    </p>
                    <p className="font-semibold text-primary">
                        {formatCurrency(item.price * item.qty)}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default CartItemComponent;
````

## File: src/features/sales/components/CheckoutDialog.tsx
````typescript
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useSalesStore } from '../store/useSalesStore'
import CustomerSelect from './CustomerSelect'
import { useCustomers } from '@/features/usuarios/hooks/useCustomers'
import { useCreateSale } from '../hooks/useCreateSale'
import { formatCurrency } from '@/helpers/money'
import { toast } from 'sonner'
import { selectTotal, selectTotalItems } from '../utils/utilsSales'
import { useState } from 'react'
import type { PaymentMethod } from '../types/sales'
import { Wallet, CreditCard } from 'lucide-react'


const paymentOptions: { value: PaymentMethod; label: string; icon: typeof Wallet }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: Wallet },
  { value: 'credito', label: 'Crédito', icon: CreditCard },
]

const CheckoutDialog = () => {
  const activeDialog = useSalesStore((state) => state.activeDialog)
  const items = useSalesStore((state) => state.items)
  const clearCart = useSalesStore((state) => state.clearCart)
  const closeCart = useSalesStore((state) => state.closeCart)
  const closeDialog = useSalesStore((state) => state.closeDialog)

  const totalItems = useSalesStore(selectTotalItems)
  const total = useSalesStore(selectTotal)
  const { data: customers } = useCustomers()
  const { mutateAsync: createSale, isPending } = useCreateSale()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')

  const canConfirm = paymentMethod === 'efectivo' || (paymentMethod === 'credito' && selectedCustomerId)

  const handleConfirm = async () => {
    if (!canConfirm) return

    try {
      const result = await createSale({
        id: new Date().getTime().toString(),
        items,
        paymentMethod,
        customerId: selectedCustomerId || undefined,
        total,
      })
      clearCart()
      closeDialog()
      closeCart()
      toast.success(result.message)
    } catch {
      toast.error('Error al registrar la venta')
    }
  }

  return (
    <Dialog
      disablePointerDismissal
      modal
      open={activeDialog === 'checkout'}
      onOpenChange={(open) => {
        if (!open) closeDialog()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar venta</DialogTitle>
          <DialogDescription>
            {totalItems} item{totalItems === 1 ? '' : 's'} por{' '}
            {formatCurrency(total)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6">
          <div>
            <p className="text-sm font-medium mb-2">Cliente</p>
            <CustomerSelect
              customers={customers}
              value={selectedCustomerId}
              onChange={setSelectedCustomerId}
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Método de pago</p>
            <div className="grid grid-cols-2 gap-3">
              {paymentOptions.map((opt) => {
                const selected = paymentMethod === opt.value
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors cursor-pointer ${selected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/30'
                      }`}
                  >
                    <Icon className="size-6" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {paymentMethod === 'credito' && !selectedCustomerId && (
            <p className="text-xs text-amber-600 -mt-3">
              Selecciona un cliente para venta a crédito
            </p>
          )}
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm || isPending}>
            {isPending ? 'Procesando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CheckoutDialog
````

## File: src/features/sales/components/ClearCartDialog.tsx
````typescript
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { useSalesStore } from '../store/useSalesStore'

const ClearCartDialog = () => {
  const activeDialog = useSalesStore((state) => state.activeDialog)
  const clearCart = useSalesStore((state) => state.clearCart)
  const closeDialog = useSalesStore((state) => state.closeDialog)

  return (
    <Dialog
      disablePointerDismissal
      modal
      open={activeDialog === 'clear-cart'}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vaciar carrito</DialogTitle>
          <DialogDescription>
            Esta accion eliminara todos los productos agregados a la venta.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              clearCart()
              closeDialog()
            }}
          >
            Vaciar carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ClearCartDialog
````

## File: src/features/sales/components/CustomerSelect.tsx
````typescript
"use client"

import { useState, useRef, useEffect, type FC } from "react"
import { Search, X, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type Customer = { id: string; name: string; phone: string }

type Props = {
    customers: Customer[]
    value: string
    onChange: (id: string) => void
}

const CustomerSelect: FC<Props> = ({ customers, value, onChange }) => {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [highlighted, setHighlighted] = useState(0)

    const ref = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const selected = customers.find((c) => c.id === value)

    const filtered = query
        ? customers.filter(
            (c) =>
                c.name.toLowerCase().includes(query.toLowerCase()) ||
                c.phone.includes(query)
        )
        : customers

    // cerrar al hacer click fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const toggle = () => {
        setOpen((prev) => {
            const next = !prev
            if (next) {
                setQuery("")
                setHighlighted(0)
                setTimeout(() => inputRef.current?.focus(), 0)
            }
            return next
        })
    }

    const select = (id: string) => {
        onChange(id)
        setOpen(false)
        setQuery("")
    }

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <div
                className={cn(
                    "flex items-center gap-2 rounded-2xl border px-4 py-3 bg-white",
                    open
                        ? "border-primary/50 shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                        : "border-stone-200 hover:border-stone-300"
                )}
                onClick={toggle}
            >
                {/* Icon */}
                <Search className="size-5 text-stone-400 shrink-0" />

                {/* Input */}
                <input
                    ref={inputRef}
                    className="flex-1 bg-transparent outline-none text-sm"
                    placeholder="Buscar cliente..."
                    value={open ? query : selected?.name ?? ""}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setHighlighted(0)
                    }}
                />

                {/* Clear */}
                {value && !open && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onChange("")
                        }}
                        className="text-stone-400 hover:text-stone-600"
                    >
                        <X className="size-4" />
                    </button>
                )}

                {/* Arrow toggle */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        toggle()
                    }}
                    className="text-stone-400"
                >
                    <ChevronDown
                        className={cn(
                            "size-4 transition-transform",
                            open && "rotate-180 text-primary"
                        )}
                    />
                </button>
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-2xl border bg-white shadow-lg">
                    {filtered.length === 0 ? (
                        <div className="p-6 text-center text-sm text-stone-400">
                            Sin coincidencias
                        </div>
                    ) : (
                        <ul className="max-h-56 overflow-y-auto py-1">
                            {filtered.map((c, i) => {
                                const active = i === highlighted
                                const isSelected = c.id === value

                                return (
                                    <li
                                        key={c.id}
                                        onMouseEnter={() => setHighlighted(i)}
                                        onMouseDown={(e) => {
                                            e.preventDefault()
                                            select(c.id)
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 cursor-pointer",
                                            active && "bg-primary/10"
                                        )}
                                    >
                                        <span className="size-7 flex items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                            {c.name
                                                .split(" ")
                                                .map((w) => w[0])
                                                .join("")
                                                .slice(0, 2)}
                                        </span>

                                        <div className="flex-1 text-sm">
                                            <div>{c.name}</div>
                                            <div className="text-xs text-stone-400">
                                                {c.phone}
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <Check className="size-4 text-primary" />
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}

export default CustomerSelect
````

## File: src/features/sales/components/index.tsx
````typescript
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { useProduct } from "../hooks/useProduct"
import CartButton from "./CartButton"
import CartDrawer from "./CartDrawer"
import CheckoutDialog from "./CheckoutDialog"
import ClearCartDialog from "./ClearCartDialog"
import ListProduct from "./ListProduct"


const Sales = () => {
    const { data: dataProducts, isLoading: isLoadingProducts } = useProduct();
    return (
        <>
            <ExampleCombobox />
            <ListProduct data={dataProducts} isLoading={isLoadingProducts} />
            <CartButton />
            <CartDrawer />
            <CheckoutDialog />
            <ClearCartDialog />
        </>
    )
}

export default Sales

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"]

export function ExampleCombobox() {
    return (
        <Combobox items={frameworks}>
            <ComboboxInput placeholder="Select a framework" />
            <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                    {(item) => (
                        <ComboboxItem key={item} value={item}>
                            {item}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    )
}
````

## File: src/features/sales/components/ListProduct.tsx
````typescript
import { useSalesStore } from '../store/useSalesStore'
import type { Product } from '../types/sales'
import ProductItem from '@/features/sales/components/ProductItem'
import SkeletonProductCard from '@/components/shared/product/SkeletonProductCard'


type ListProductProps = {
  data: Product[],
  isLoading?: boolean,
}

const ListProduct = ({ data, isLoading }: ListProductProps) => {
  const addItem = useSalesStore((state) => state.addItem)

  if (isLoading) {
    return <div className="gap-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {
        Array.from({ length: 12 }).map((_, index) => (
          <SkeletonProductCard key={index} />
        ))
      }
    </div>
  }

  return (
    <div className="gap-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {data.map((product) => (
        <ProductItem key={product.id} item={product} onClick={addItem} />
      ))}
    </div>
  )
}

export default ListProduct
````

## File: src/features/sales/components/ProductCard.tsx
````typescript
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { FC } from "react"
import type { Product } from "@/features/sales/types/sales"

type Props = {
    item: Product
    onClick?: () => void
}

const ProductCard: FC<Props> = ({ item, onClick }) => {
    const maxPrice = item.variants.length > 1
        ? Math.max(...item.variants.map(v => v.price))
        : item.variants[0]?.price
    const hasPriceRange = item.variants.length > 1 && item.variants[0]?.price !== maxPrice

    return (
        <Card className="bg-white" onClick={onClick}>
            <img className="h-40 lg:h-50 w-full object-cover object-center" src={item.image} />
            <CardHeader>
                <Badge variant="secondary">{item.category}</Badge>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription className="h-10">
                    <div>
                        <div className="flex items-center gap-2 text-xs">
                            <small className="text-stone-400">
                                Desde Q.{item.variants[0]?.price}
                                {hasPriceRange && <> a Q.{maxPrice} </>}
                                en stock {item.variants.reduce((s, v) => s + v.stock, 0)}
                            </small>
                        </div>
                        <div className="grid grid-cols-4 gap-1 mt-1">
                            {item.variants.map(v => (
                                <Badge key={v.id} variant={v.stock > 0 ? 'default' : 'secondary'}>
                                    {v.size}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardDescription>
            </CardHeader>
        </Card>
    )
}

export default ProductCard
````

## File: src/features/sales/components/ProductItem.tsx
````typescript
import { useState, type FC } from "react"
import { Drawer, DrawerTrigger } from "@/components/ui/drawer"
import type { Product, ProductVariant } from "@/features/sales/types/sales"
import { toast } from "sonner"
import ProductCard from "./ProductCard"
import VariantSelectionDrawer from "./VariantSelectionDrawer"

type Props = {
    onClick: (product: Product, variantId: string) => void
    item: Product
}

const ProductItem: FC<Props> = ({ onClick, item }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [variantSelected, setVariantSelected] = useState<ProductVariant | null>(
        item.variants[0] || null
    )

    const handleAddVariant = () => {
        if (!variantSelected || variantSelected.stock <= 0) return
        onClick(item, variantSelected.id)
        setIsOpen(false)
        toast.info(`se agrego al carrito ${item.name} - ${variantSelected.size}`)
    }

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <ProductCard item={item} />
            </DrawerTrigger>
            <VariantSelectionDrawer
                item={item}
                variantSelected={variantSelected}
                onVariantChange={setVariantSelected}
                onAddToCart={handleAddVariant}
            />
        </Drawer>
    )
}

export default ProductItem
````

## File: src/features/sales/components/VariantSelectionDrawer.tsx
````typescript
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DrawerBody, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import type { Product, ProductVariant } from "@/features/sales/types/sales"
import { ShoppingCart } from "lucide-react"
import type { FC } from "react"

type Props = {
    item: Product
    variantSelected: ProductVariant | null
    onVariantChange: (variant: ProductVariant) => void
    onAddToCart: () => void
}

const VariantSelectionDrawer: FC<Props> = ({ item, variantSelected, onVariantChange, onAddToCart }) => {
    return (
        <DrawerContent className="bg-white w-full">
            <DrawerHeader className="mx-auto w-full max-w-md">
                <DrawerTitle>Elige la variante</DrawerTitle>
                <DrawerDescription className="text-center">
                    Cada variante tiene precio y stock diferente
                </DrawerDescription>
            </DrawerHeader>

            <DrawerBody className="mx-5 rounded-t-[20px] bg-white pt-2">
                <div className='grid grid-cols-2 gap-4'>
                    <div className="rounded-2xl relative overflow-hidden w-full h-50 lg:h-70 flex items-center justify-center bg-white">
                        <div className="absolute inset-0">
                            <img
                                src={item.image}
                                className="w-full h-full object-cover blur-md opacity-90 transform scale-105"
                                alt=""
                            />
                        </div>
                        <img
                            src={item.image}
                            className="relative w-[90%] h-[97%] rounded-3xl object-cover drop-shadow-md z-10"
                            alt="imagen del producto"
                        />
                    </div>
                    <div>
                        <Badge variant="secondary" className="mb-2">{item.category}</Badge>
                        <p className="font-medium text-xl mb-1">{item.name}</p>
                        <div className="h-px bg-stone-200 my-2" />
                        <p className="text-2xl font-medium text-primary">Q{variantSelected?.price}</p>
                        <p className="text-sm text-stone-500">
                            {variantSelected ? `Talla: ${variantSelected.size}` : 'Selecciona una talla'}
                        </p>
                        <p className="text-sm text-stone-500">
                            Stock disponible: {variantSelected?.stock ?? '-'} unidades
                        </p>
                        {variantSelected && variantSelected.stock > 0 && variantSelected.stock <= 3 && (
                            <p className="text-xs text-amber-600 font-medium mt-1">Últimas unidades</p>
                        )}
                        {variantSelected && variantSelected.stock <= 0 && (
                            <p className="text-xs text-red-500 font-medium mt-1">Agotado</p>
                        )}
                    </div>
                </div>

                <div className='grid grid-cols-6 gap-3 w-full justify-center items-center mt-4'>
                    {item.variants.map((variant) => (
                        <Badge
                            className="h-10 w-full cursor-pointer flex items-center justify-center"
                            key={variant.id}
                            aria-disabled={variant.stock <= 0}
                            onClick={() => onVariantChange(variant)}
                            variant={variant.id === variantSelected?.id ? 'secondary' : 'default'}
                        >
                            {variant.size}
                        </Badge>
                    ))}
                </div>
                {item.variants.filter(v => v.stock > 0).length === 0 && (
                    <p className="text-xs text-red-500 text-center mt-2">Ninguna variante disponible. Producto agotado.</p>
                )}
                {item.variants.filter(v => v.stock <= 0).length > 0 && (
                    <p className="text-xs text-stone-400 mt-2">Algunas variantes no tienen stock disponible.</p>
                )}
            </DrawerBody>
            <DrawerFooter className="mx-5 flex flex-col items-center justify-center">
                <Button
                    size={"lg"}
                    className="w-full"
                    disabled={!variantSelected || variantSelected.stock <= 0}
                    onClick={onAddToCart}
                >
                    <ShoppingCart className="w-5! h-10!" size={30} strokeWidth={3} />
                    <p className="font-bold">Agregar al carrito</p>
                </Button>
                <p className="text-xs text-stone-400 text-center mt-2">Revisa la variante y cantidad antes de confirmar</p>
            </DrawerFooter>
        </DrawerContent>
    )
}

export default VariantSelectionDrawer
````

## File: src/features/sales/hooks/useCreateSale.ts
````typescript
import { useMutation } from "@tanstack/react-query"
import { submitSale } from "../services/products-service"
import type { SubmitSalePayload, SubmitSaleResponse } from "../types/sales"


export const useCreateSale = () => {
    return useMutation<SubmitSaleResponse, Error, SubmitSalePayload>({
        mutationFn: submitSale,
        retry: 3,
    })
}
````

## File: src/features/sales/hooks/useProduct.ts
````typescript
import { queryKeys } from "@/lib/query-keys"
import { useQuery } from "@tanstack/react-query"
import { getProducts } from "../services/products-service"
import type { Product } from "../types/sales"

export const useProduct = () => {
    const { data, isLoading, isError } = useQuery<Product[]>(
        {
            queryKey: queryKeys.sales.list(),
            queryFn: getProducts,
            staleTime: 1000 * 60 * 15, // 15 min
        }
    )
    return {
        data: data ?? [],
        isLoading,
        isError
    }
}
````

## File: src/features/sales/index.tsx
````typescript
export { salesRoutes } from './routes'
````

## File: src/features/sales/mocks/productos.ts
````typescript
import image from '@/assets/img.jpg'
import image2 from '@/assets/test.png'
import type { Product } from '../types/sales'



export const products: Product[] = [
    {
        id: 'faja-seda',
        name: 'Faja bordada',
        category: 'Fajas',
        variants: [
            { id: '233', size: '20', stock: 3, price: 120 },
            { id: '2321', size: '40', stock: 8, price: 120 },
            { id: '232234', size: '40', stock: 8, price: 120 },
            { id: '232245', size: '40', stock: 8, price: 120 },
            { id: '232365', size: '50', stock: 5, price: 120 },
            { id: '2324', size: '20', stock: 4, price: 130 },
            { id: '23236', size: '50', stock: 5, price: 120 },
        ],
        image,
    },
    {
        id: 'faja-colombiana',
        name: 'Faja tradicional',
        category: 'Fajas',
        variants: [
            { id: 's', size: 'S', stock: 4, price: 186 },
            { id: 'm', size: 'M', stock: 6, price: 185 },
            { id: 'l', size: 'L', stock: 2, price: 190 },
        ],
        image: image2,
    },
    {
        id: 'blusa-manga-corta',
        name: 'Huipil bordado',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 10, price: 95 },
            { id: 'm', size: 'M', stock: 8, price: 95 },
        ],
        image,
    },
    {
        id: 'legging-control',
        name: 'Corte de Guatemala',
        category: 'Cortes',
        variants: [
            { id: 's', size: 'S', stock: 5, price: 140 },
            { id: 'm', size: 'M', stock: 0, price: 140 },
            { id: 'l', size: 'L', stock: 5, price: 145 },
        ],
        image,
    },
    {
        id: 'top-deportivo',
        name: 'Corte de Xela',
        category: 'Cortes',
        variants: [
            { id: 's', size: 'S', stock: 6, price: 88 },
            { id: 'm', size: 'M', stock: 8, price: 88 },
        ],
        image: image2,
    },
    {
        id: 'body-moldeador',
        name: 'Blusa de corte',
        category: 'Blusas',
        variants: [
            { id: 'xs', size: 'XS', stock: 3, price: 210 },
            { id: 's', size: 'S', stock: 5, price: 210 },
        ],
        image,
    },
    {
        id: 'pantalones-deportivos',
        name: 'Pantalón de manta',
        category: 'Pantalones',
        variants: [
            { id: 's', size: 'S', stock: 7, price: 145 },
            { id: 'm', size: 'M', stock: 10, price: 145 },
            { id: 'l', size: 'L', stock: 4, price: 150 },
        ],
        image: image2,
    },
    {
        id: 'pantalon-culotte',
        name: 'Pantalón tradicional',
        category: 'Pantalones',
        variants: [
            { id: 's', size: 'S', stock: 8, price: 160 },
            { id: 'm', size: 'M', stock: 6, price: 160 },
        ],
        image,
    },
    {
        id: 'vestido-casual',
        name: 'Vestido típico',
        category: 'Vestidos',
        variants: [
            { id: 's', size: 'S', stock: 5, price: 220 },
            { id: 'm', size: 'M', stock: 7, price: 220 },
            { id: 'l', size: 'L', stock: 3, price: 225 },
        ],
        image: image2,
    },
    {
        id: 'camisa-blanca',
        name: 'Camisa bordada',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 12, price: 90 },
            { id: 'm', size: 'M', stock: 14, price: 90 },
            { id: 'l', size: 'L', stock: 6, price: 95 },
        ],
        image,
    },
    {
        id: 'sueter-lana',
        name: 'Suéter de lana',
        category: 'Abrigos',
        variants: [
            { id: 'm', size: 'M', stock: 4, price: 180 },
            { id: 'l', size: 'L', stock: 5, price: 180 },
        ],
        image: image2,
    },
    {
        id: 'chaqueta-cuero',
        name: 'Chaqueta de lana',
        category: 'Abrigos',
        variants: [
            { id: 'm', size: 'M', stock: 2, price: 350 },
            { id: 'l', size: 'L', stock: 3, price: 360 },
        ],
        image,
    },
    {
        id: 'falda-midi',
        name: 'Falda de corte',
        category: 'Faldas',
        variants: [
            { id: 's', size: 'S', stock: 9, price: 130 },
            { id: 'm', size: 'M', stock: 7, price: 130 },
        ],
        image: image2,
    },
    {
        id: 'blusa-encaje',
        name: 'Blusa de encaje',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 6, price: 115 },
            { id: 'm', size: 'M', stock: 5, price: 115 },
        ],
        image,
    },
    {
        id: 'top-largo',
        name: 'Huipil largo',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 10, price: 98 },
            { id: 'm', size: 'M', stock: 12, price: 98 },
        ],
        image: image2,
    },
    {
        id: 'short-running',
        name: 'Falda corta',
        category: 'Faldas',
        variants: [
            { id: 's', size: 'S', stock: 8, price: 110 },
            { id: 'm', size: 'M', stock: 10, price: 110 },
        ],
        image,
    },
    {
        id: 'malla-termica',
        name: 'Cinturón tejido',
        category: 'Accesorios',
        variants: [
            { id: 's', size: 'S', stock: 5, price: 165 },
            { id: 'm', size: 'M', stock: 8, price: 165 },
            { id: 'l', size: 'L', stock: 6, price: 170 },
        ],
        image: image2,
    },
    {
        id: 'body-encaje',
        name: 'Huipil bordado',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 4, price: 190 },
            { id: 'm', size: 'M', stock: 3, price: 190 },
        ],
        image,
    },
    {
        id: 'pantalon-cargo',
        name: 'Pantalón campesino',
        category: 'Pantalones',
        variants: [
            { id: 'm', size: 'M', stock: 7, price: 175 },
            { id: 'l', size: 'L', stock: 5, price: 180 },
        ],
        image: image2,
    },
    {
        id: 'blusa-estampada',
        name: 'Blusa de corte',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 9, price: 105 },
            { id: 'm', size: 'M', stock: 8, price: 105 },
        ],
        image,
    },
    {
        id: 'faja-alta',
        name: 'Faja alta tradicional',
        category: 'Fajas',
        variants: [
            { id: 's', size: 'S', stock: 6, price: 135 },
            { id: 'm', size: 'M', stock: 7, price: 135 },
        ],
        image: image2,
    },
    {
        id: 'faja-media',
        name: 'Faja de corte',
        category: 'Fajas',
        variants: [
            { id: 's', size: 'S', stock: 10, price: 125 },
            { id: 'm', size: 'M', stock: 4, price: 125 },
        ],
        image,
    },
    {
        id: 'corset-clasico',
        name: 'Cinturón bordado',
        category: 'Accesorios',
        variants: [
            { id: 's', size: 'S', stock: 3, price: 240 },
            { id: 'm', size: 'M', stock: 4, price: 240 },
        ],
        image: image2,
    },
    {
        id: 'pantalon-ancho',
        name: 'Pantalón ancho',
        category: 'Pantalones',
        variants: [
            { id: 'm', size: 'M', stock: 5, price: 155 },
            { id: 'l', size: 'L', stock: 6, price: 155 },
        ],
        image,
    },
    {
        id: 'top-espalda',
        name: 'Blusa de espalda',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 11, price: 99 },
            { id: 'm', size: 'M', stock: 9, price: 99 },
        ],
        image: image2,
    },
    {
        id: 'blusa-romantica',
        name: 'Huipil de flores',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 6, price: 120 },
            { id: 'm', size: 'M', stock: 7, price: 120 },
            { id: 'l', size: 'L', stock: 4, price: 125 },
        ],
        image,
    },
]
````

## File: src/features/sales/pages/PosPage.tsx
````typescript
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import Sales from '@/features/sales/components'

export default function PosPage() {
  return (
    <PageTemplateSimple
      title="Punto de venta"
      description="Módulo de punto de venta de Sales Net."
    >
      <Sales />
    </PageTemplateSimple>
  )
}
````

## File: src/features/sales/routes.tsx
````typescript
import { Store } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const salesRoutes: AppRoute[] = [
  {
    path: 'venta',
    meta: {
      name: 'Venta',
      description: 'Operacion de ventas',
      icon: Store,
    },
    children: [
      {
        path: 'punto-de-venta',
        meta: {
          name: 'Punto de venta',
          description: 'Venta de productos',
          icon: Store,
          permissions: ['vendedor'],
          lazy: () => import('./pages/PosPage'),
        },
      },
    ],
  },

]
````

## File: src/features/sales/services/products-service.ts
````typescript
import type { Product, SubmitSalePayload, SubmitSaleResponse, } from '../types/sales'

export const getProducts = async () => {
    try {
        return new Promise<Product[]>(
            (resolve) => setTimeout(() => resolve(import('../mocks/productos').then((module) => module.products)), 2000)
        )
    } catch {
        throw new Error('Error al obtener los productos')
    }
}


export const submitSale = async (payload: SubmitSalePayload): Promise<SubmitSaleResponse> => {
    try {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        if (payload.paymentMethod === 'credito' && !payload.customerId) {
            throw new Error('Venta a crédito requiere un cliente')
        }

        return {
            success: true,
            saleId: `VEN-${Date.now()}`,
            message: `Venta por Q${payload.total.toFixed(2)} registrada exitosamente`,
        }

    } catch {
        throw new Error('Error al registrar la venta: ')
    }

}
````

## File: src/features/sales/store/useSalesStore.ts
````typescript
import { create } from 'zustand';
import type { CartItem, Product, SalesDialog } from '../types/sales';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface SalesState {
  items: CartItem[];
  cartOpen: boolean;
  activeDialog: SalesDialog;
  addItem: (product: Product, variantId: string) => void;
  removeItem: (itemId: string) => void;
  increaseQty: (itemId: string) => void;
  decreaseQty: (itemId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  openDialog: (dialog: Exclude<SalesDialog, null>) => void;
  closeDialog: () => void;
}

function buildCartItemId(productId: string, variantId: string): string {
  return `${productId}::${variantId}`
}

export const useSalesStore = create<SalesState>()(
  persist((set) => ({
    items: [],
    cartOpen: false,
    activeDialog: null,

    addItem: (product, variantId) =>
      set((state) => {
        const cartItemId = buildCartItemId(product.id, variantId)
        const variant = product.variants.find((v) => v.id === variantId)
        if (!variant) return state

        const existing = state.items.find((item) => item.id === cartItemId)
        if (existing) {
          return {
            items: state.items.map((item) =>
              item.id === cartItemId
                ? { ...item, qty: item.qty + 1 }
                : item
            ),
          }
        }

        const newItem: CartItem = {
          id: cartItemId,
          productId: product.id,
          name: product.name,
          category: product.category,
          image: product.image,
          variantId,
          size: variant.size,
          price: variant.price,
          stock: variant.stock,
          qty: 1,
        }
        return { items: [...state.items, newItem] }
      }),

    removeItem: (itemId) =>
      set((state) => ({
        items: state.items.filter((item) => item.id !== itemId),
      })),

    increaseQty: (itemId) =>
      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId
            ? { ...item, qty: item.qty + 1 }
            : item
        ),
      })),

    decreaseQty: (itemId) =>
      set((state) => ({
        items: state.items
          .map((item) => {
            if (item.id === itemId) {
              return { ...item, qty: item.qty - 1 }
            }
            return item
          })
          .filter((item) => item.qty > 0),
      })),

    clearCart: () => set({ items: [] }),

    openCart: () => set({ cartOpen: true }),

    closeCart: () => set({ cartOpen: false }),

    openDialog: (dialogName) =>
      set({
        cartOpen: false,
        activeDialog: dialogName,
      }),

    closeDialog: () =>
      set({
        cartOpen: true,
        activeDialog: null,
      }),
  }),
    {
      name: 'sales-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        cartOpen: state.cartOpen,
      }),
    }
  ))
````

## File: src/features/sales/types/sales.ts
````typescript
export type SalesDialog = 'checkout' | 'clear-cart' | null

export type ProductVariant = {
  id: string
  size: string
  stock: number
  price: number
}

export type Product = {
  id: string
  name: string
  category: string
  variants: ProductVariant[]
  image: string
}

export type CartItem = {
  id: string
  productId: string
  name: string
  category: string
  image: string
  variantId: string
  size: string
  price: number
  stock: number
  qty: number
}
export type PaymentMethod = 'efectivo' | 'credito'

export type SubmitSalePayload = {
  id: string,
  items: CartItem[]
  paymentMethod: PaymentMethod
  customerId?: string
  total: number
}

export type SubmitSaleResponse = {
  success: boolean
  saleId: string
  message: string
}
````

## File: src/features/sales/utils/utilsSales.ts
````typescript
import type { SalesState } from "../store/useSalesStore"

export const selectTotalItems = (state: SalesState) =>
    state.items.reduce((sum, item) => sum + item.qty, 0)

export const selectTotal = (state: SalesState) =>
    state.items.reduce((sum, item) => sum + item.qty * item.price, 0)
````

## File: src/features/usuarios/hooks/useCustomers.ts
````typescript
import { queryKeys } from "@/lib/query-keys"
import { useQuery } from "@tanstack/react-query"
import { getCustomers } from "../services/customers-service"
import type { Customer } from "../types/customers-types"

export const useCustomers = () => {
    const { data, isLoading, isError } = useQuery<Customer[]>(
        {
            queryKey: queryKeys.customers.list(),
            queryFn: getCustomers,
            staleTime: 1000 * 60 * 15,
        }
    )

    return {
        data: data ?? [],
        isLoading,
        isError
    }
}
````

## File: src/features/usuarios/index.tsx
````typescript

````

## File: src/features/usuarios/mocks/customers.ts
````typescript
import type { Customer } from "../types/customers-types";

export const mockCustomers: Customer[] = [
    {
        id: '1',
        name: 'Juan Perez',
        phone: '5545-1234'
    },
    {
        id: '2',
        name: 'María García',
        phone: '5553-5678'
    },
    {
        id: '3',
        name: 'Lix Gonzalez',
        phone: '2311-1234'
    },
    {
        id: '4',
        name: 'Elias tax',
        phone: '5d53-5678'
    },
    {
        id: '5',
        name: 'Carlos Ramirez',
        phone: '5567-8901'
    },
    {
        id: '6',
        name: 'Ana Lopez',
        phone: '5578-9012'
    },
    {
        id: '7',
        name: 'Pedro Martinez',
        phone: '5589-0123'
    },
    {
        id: '8',
        name: 'Sofia Hernandez',
        phone: '5590-1234'
    },
    {
        id: '9',
        name: 'Luis Torres',
        phone: '5601-2345'
    },
    {
        id: '10',
        name: 'Isabella Flores',
        phone: '5612-3456'
    },
    {
        id: '11',
        name: 'Miguel Rivera',
        phone: '5623-4567'
    },
    {
        id: '12',
        name: 'Camila Gomez',
        phone: '5634-5678'
    },
    {
        id: '13',
        name: 'Diego Sanchez',
        phone: '5645-6789'
    },
    {
        id: '14',
        name: 'Valentina Diaz',
        phone: '5656-7890'
    },
    {
        id: '15',
        name: 'Javier Morales',
        phone: '5667-8901'
    },
    {
        id: '16',
        name: 'Lucia Castillo',
        phone: '5678-9012'
    },
    {
        id: '17',
        name: 'Fernando Ortiz',
        phone: '5689-0123'
    },
    {
        id: '18',
        name: 'Gabriela Reyes',
        phone: '5690-1234'
    },
    {
        id: '19',
        name: 'Alejandro Cruz',
        phone: '5701-2345'
    },

]
````

## File: src/features/usuarios/services/customers-service.ts
````typescript
import type { Customer } from '../types/customers-types'


export const getCustomers = async () => {
    try {
        return new Promise<Customer[]>(
            (resolve) => setTimeout(() => resolve(import('../mocks/customers').then((module) => module.mockCustomers)), 500)
        )
    } catch {
        throw new Error('Error al obtener los clientes')
    }

}
````

## File: src/features/usuarios/types/customers-types.ts
````typescript
export interface Customer {
    id: string
    name: string
    phone: string
}
````

## File: src/helpers/money.ts
````typescript
function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ',
    }).format(value)
}

export {
    formatCurrency
}
````

## File: src/index.css
````css
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@fontsource-variable/geist";

@custom-variant dark (&:is(.dark *));

:root {
  color-scheme: light;
  --app-primary: #3525CD;
  --app-primary-complement: #4F46E5;
  --app-primary-nav: #F0F3FF;
  --app-secondary: #DCE2F3;
  --app-danger: #95002B;
  --app-successful: #006C49;
  --app-neutral: #464555;
  --color-primary: var(--app-primary);
  --color-primary-nav: var(--app-primary-nav);
  --color-secondary: var(--app-secondary);
  --color-danger: var(--app-danger);
  --color-successful: var(--app-successful);
  --color-neutral: var(--app-neutral);
  font-family: 'Roboto', 'Segoe UI', sans-serif;
  background: var(--color-secondary);
  color: var(--color-neutral);
  --background: #ffffff;
  --foreground: var(--app-neutral);
  --card: #ffffff;
  --card-foreground: var(--app-neutral);
  --popover: #ffffff;
  --popover-foreground: var(--app-neutral);
  --primary: var(--app-primary);
  --primary-complement: var(--app-primary-complement);
  --primary-foreground: #ffffff;
  --secondary: var(--app-secondary);
  --secondary-foreground: var(--app-neutral);
  --muted: var(--app-primary-nav);
  --muted-foreground: #6a6980;
  --accent: var(--app-primary-nav);
  --accent-foreground: var(--app-primary);
  --destructive: var(--app-danger);
  --border: #ccd4ea;
  --input: #dce2f3;
  --ring: rgb(53 37 205 / 28%);
  --chart-1: var(--app-primary);
  --chart-2: #6d5df2;
  --chart-3: #8a7cf6;
  --chart-4: #a79af9;
  --chart-5: #c3b8fc;
  --radius: 0.20rem;
  --sidebar: #ffffff;
  --sidebar-foreground: var(--app-neutral);
  --sidebar-primary: var(--app-primary);
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: var(--app-primary-nav);
  --sidebar-accent-foreground: var(--app-primary);
  --sidebar-border: #ccd4ea;
  --sidebar-ring: rgb(53 37 205 / 28%);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: var(--color-secondary);
  color: var(--color-neutral);
}

button,
input,
select,
textarea {
  font: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}

#root {
  min-height: 100vh;
}

@theme inline {
  --font-heading: 'Geist Variable', 'Roboto', 'Segoe UI', sans-serif;
  --font-sans: 'Roboto', 'Segoe UI', sans-serif;
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-primary-complement: var(--primary-complement);
  --color-primary-nav: var(--accent);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --color-foreground: var(--foreground);
  --color-background: var(--background);
  --color-neutral: var(--foreground);
  --color-danger: var(--destructive);
  --color-successful: var(--app-successful);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

.dark {
  --background: #161822;
  --foreground: #eef1ff;
  --card: #1f2230;
  --card-foreground: #eef1ff;
  --popover: #1f2230;
  --popover-foreground: #eef1ff;
  --primary: #8f82ff;
  --primary-foreground: #11131a;
  --secondary: #2b3144;
  --secondary-foreground: #eef1ff;
  --muted: #2b3144;
  --muted-foreground: #b1b7d1;
  --accent: #2b3144;
  --accent-foreground: #eef1ff;
  --destructive: #ff8aa3;
  --border: rgb(255 255 255 / 12%);
  --input: rgb(255 255 255 / 16%);
  --ring: rgb(143 130 255 / 36%);
  --chart-1: #8f82ff;
  --chart-2: #6e8dff;
  --chart-3: #60d4c8;
  --chart-4: #ffb86f;
  --chart-5: #ff8aa3;
  --sidebar: #1b1f2b;
  --sidebar-foreground: #eef1ff;
  --sidebar-primary: #8f82ff;
  --sidebar-primary-foreground: #11131a;
  --sidebar-accent: #2b3144;
  --sidebar-accent-foreground: #eef1ff;
  --sidebar-border: rgb(255 255 255 / 12%);
  --sidebar-ring: rgb(143 130 255 / 36%);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply text-foreground;
  }

  html {
    @apply font-sans;
  }
}
````

## File: src/layouts/login/LoginLayout.tsx
````typescript
import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

export default function LoginLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* TODO: Aun por definir tamaño de ancho para cada tipo de pantalla */}
      <div
        className={cn(
          'w-[90%] xs:max-w-[55%] sm:max-w-[55%] md:max-w-[55%] lg:max-w-[35%] xl:max-w-[25%]',
        )}
      >
        <section className=''>
          {children}
        </section>
      </div>
    </div>
  )
}
````

## File: src/layouts/main/DesktopSidebar.tsx
````typescript
import { useState } from 'react'
import NavBarDesktop from "@/components/navbar/NavBarDesktop"
import { cn } from "@/lib/utils"
import type { SidebarItem } from "@/lib/app-routes"

type DesktopSidebarProps = {
    expanded: boolean
    items: SidebarItem[]
    onMouseEnter: () => void
    onMouseLeave: () => void
}

function DesktopSidebar({ expanded, items, onMouseEnter, onMouseLeave }: DesktopSidebarProps) {
    const [expandedModules, setExpandedModules] = useState<string[]>([])

    const toggleModule = (moduleId: string) => {
        setExpandedModules((prev) =>
            prev.includes(moduleId)
                ? prev.filter((id) => id !== moduleId)
                : [...prev, moduleId]
        )
    }

    return (
        <aside
            id="app-sidebar"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={cn(
                'sticky top-4 hidden h-[calc(100vh-2rem)] overflow-hidden rounded-3xl border p-3 backdrop-blur-2xl transition-all duration-300 ease-out lg:block',
                expanded
                    ? 'w-64 border-stone-200/50 bg-gradient-to-b from-stone-50/95 via-white/90 to-zinc-50/85 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_4px_24px_rgba(0,0,0,0.04)]'
                    : 'w-25 border-stone-200/25 bg-white/60 shadow-[0_0_0_1px_rgba(0,0,0,0.01),0_2px_16px_rgba(0,0,0,0.03)]',
            )}
        >
            <NavBarDesktop
                items={items}
                expanded={expanded}
                expandedModules={expandedModules}
                onToggleModule={toggleModule}
            />
        </aside>
    )
}

export default DesktopSidebar
````

## File: src/layouts/main/LayoutHeader.tsx
````typescript
import { cn } from "@/lib/utils"
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react"

type LayoutHeaderProps = {
    hasSidebarNavigation: boolean
    isDesktop: boolean
    isMobileSidebarOpen: boolean
    isSidebarExpanded: boolean
    isSidebarPinned: boolean
    onLogout: () => void
    onSidebarToggle: () => void
}

function LayoutHeader({
    hasSidebarNavigation,
    isDesktop,
    isMobileSidebarOpen,
    isSidebarExpanded,
    isSidebarPinned,
    onLogout,
    onSidebarToggle,
}: LayoutHeaderProps) {
    const sidebarLabel = isDesktop
        ? isSidebarPinned
            ? 'Liberar sidebar'
            : 'Mantener sidebar abierto'
        : isMobileSidebarOpen
            ? 'Cerrar menu lateral'
            : 'Abrir menu lateral'

    return (
        <header className="sticky top-0 z-10 rounded-4xl border border-secondary bg-white/92 px-6 py-3 shadow-[0_24px_60px_-42px_rgba(53,37,205,0.26)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onSidebarToggle}
                        aria-controls="app-sidebar"
                        aria-expanded={isSidebarExpanded}
                        aria-label={sidebarLabel}
                        className={cn(
                            'size-11 items-center justify-center rounded-2xl border border-secondary bg-secondary/58 text-neutral transition hover:bg-secondary',
                            hasSidebarNavigation ? 'inline-flex' : 'hidden',
                        )}
                    >
                        {isDesktop ? (
                            isSidebarPinned ? (
                                <PanelLeftClose className="size-5" />
                            ) : (
                                <PanelLeftOpen className="size-5" />
                            )
                        ) : isMobileSidebarOpen ? (
                            <X className="size-5" />
                        ) : (
                            <PanelLeftOpen className="size-5" />
                        )}
                    </button>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                            Sales Net
                        </p>
                        <p className="text-sm text-neutral/70">
                            Tablero comercial
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center gap-2 rounded-full border border-secondary bg-white px-4 py-2 text-sm font-semibold text-neutral transition hover:bg-secondary"
                >
                    <LogOut className="size-4 text-[--color-danger]" />

                </button>
            </div>
        </header>
    )
}

export default LayoutHeader
````

## File: src/layouts/main/MainLayout.tsx
````typescript
import { useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuthStore } from '@/features/core/store/auth-store'
import { buildSidebarItems } from '@/lib/app-routes'
import { salesRoutes } from '@/features/sales'
import { catalogRoutes } from '@/features/catalog'
import DesktopSidebar from './DesktopSidebar'
import MobileSidebar from './MobileSidebar'
import LayoutHeader from './LayoutHeader'
import { useDesktopMediaQuery } from '@/features/core/hooks/useDesktopMediaQuery'

export default function MainLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const location = useLocation()

  const { isDesktop } = useDesktopMediaQuery()

  const [isSidebarPinned, setIsSidebarPinned] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const hasSidebarNavigation = true

  const isDesktopSidebarExpanded = isSidebarPinned || isSidebarHovered

  // Generar items del sidebar desde las rutas, filtrados por permisos del usuario
  const allFeatureRoutes = [...salesRoutes, ...catalogRoutes]
  const sidebarItems = user
    ? buildSidebarItems(allFeatureRoutes, user.permissions)
    : []

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleSidebarToggle = () => {
    if (!hasSidebarNavigation) return
    if (isDesktop) {
      setIsSidebarPinned((c) => !c)
    } else {
      setIsMobileSidebarOpen((c) => !c)
    }
  }

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false)
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 text-neutral">
      {!isDesktop && (
        <MobileSidebar items={sidebarItems} isOpen={isMobileSidebarOpen} onClose={handleMobileSidebarClose} />
      )}

      <div className="grid min-h-screen grid-cols-1 gap-4 px-1 py-1 md:px-6 md:py-4 lg:grid-cols-[auto_1fr] lg:gap-6 xl:px-8">
        {isDesktop && (
          <DesktopSidebar
            expanded={isDesktopSidebarExpanded}
            items={sidebarItems}
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
          />
        )}

        <div className="flex min-w-0 flex-col">
          <LayoutHeader
            hasSidebarNavigation={hasSidebarNavigation}
            isDesktop={isDesktop}
            isMobileSidebarOpen={isMobileSidebarOpen}
            isSidebarExpanded={isDesktopSidebarExpanded}
            isSidebarPinned={isSidebarPinned}
            onLogout={handleLogout}
            onSidebarToggle={handleSidebarToggle}
          />

          <main className="flex-1 py-2 pb-8">
            <Outlet />
          </main>

          <footer className="pb-4 text-sm text-neutral/75">
            footer
          </footer>
        </div>
      </div>
    </div>
  )
}
````

## File: src/layouts/main/MobileSidebar.tsx
````typescript
import { useState } from 'react'
import NavBarDesktop from "@/components/navbar/NavBarDesktop"
import { cn } from "@/lib/utils"
import type { SidebarItem } from "@/lib/app-routes"

type MobileSidebarProps = {
    items: SidebarItem[]
    isOpen: boolean
    onClose: () => void
}

function MobileSidebar({ items, isOpen, onClose }: MobileSidebarProps) {
    const [expandedModules, setExpandedModules] = useState<string[]>([])

    const toggleModule = (moduleId: string) => {
        setExpandedModules((prev) =>
            prev.includes(moduleId)
                ? prev.filter((id) => id !== moduleId)
                : [...prev, moduleId]
        )
    }

    return (
        <>
            {/* Overlay */}
            <div
                aria-hidden="true"
                onClick={onClose}
                className={cn(
                    'fixed inset-0 z-30 bg-stone-900/30 backdrop-blur-sm transition-opacity duration-300 ease-out lg:hidden',
                    isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
                )}
            />

            {/* Sidebar panel */}
            <aside
                id="app-sidebar"
                className={cn(
                    'fixed inset-y-3 left-3 z-40 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-stone-200/50 bg-gradient-to-b from-stone-50/95 via-white/92 to-zinc-50/85 p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_4px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl transition-transform duration-300 ease-out lg:hidden',
                    isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]',
                )}
            >
                <div className="h-full px-2 pb-2">
                    <NavBarDesktop
                        items={items}
                        expanded
                        onNavigate={onClose}
                        expandedModules={expandedModules}
                        onToggleModule={toggleModule}
                    />
                </div>
            </aside>
        </>
    )
}

export default MobileSidebar
````

## File: src/lib/api.ts
````typescript
import axios from 'axios'
import { useAuthStore, isTokenExpired } from '@/features/core/store/auth-store'
import { toast } from 'sonner'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const { token, tokenExpiresAt } = useAuthStore.getState()

  if (isTokenExpired(tokenExpiresAt)) {
    useAuthStore.getState().logout()
    toast.success(`Tu session a caducado, por favor inicia sesión nuevamente`)
    return Promise.reject(new Error('Token expirado'))
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status

      if (status === 401 || status === 419) {
        useAuthStore.getState().logout()
      }
    }
    return Promise.reject(error)
  },
)
````

## File: src/lib/app-routes.tsx
````typescript
/* eslint-disable react-refresh/only-export-components */
import { type ReactNode, type ComponentType } from 'react'
import { Navigate, Outlet, type RouteObject } from 'react-router'
import { type LucideIcon } from 'lucide-react'

import ProtectedRoute from '@/components/route/ProtectedRoute'
import type { AppRole } from '@/features/auth/types/auth'


export type AppRouteMeta = {
  name: string
  description?: string
  icon?: LucideIcon
  permissions?: AppRole[]

  lazy?: () => Promise<{ default: ComponentType }>
  /** Ocultar de sidebar. */
  hideFromSidebar?: boolean
}



/**
 * @example
 * 
 *export const salesRoutes: AppRoute[] = [
 *{ //Patron: seccion - pagina
 *    path: 'venta',
 *    meta: {
 *      name: 'Venta',
 *      description: 'Operacion de ventas',
 *      icon: Store,
 *      #hideFromSidebar: true, <- oculta toda la rama del sidebar
 *    },
 *    children: [
 *      {
 *        path: 'punto-de-venta',
 *        meta: {
 *          name: 'Punto de venta',
 *          description: 'Venta de productos',
 *          icon: Store,
 *          permissions: ['vendedor'],
 *          lazy: () => import('./pages/PosPage'),
 *        },
 *      },
 *    ],
 *  },
 *  { //Patron: pagina simple
 *    path: 'punto-de-venta2',
 *    meta: {
 *      name: 'Punto de venta2',
 *      description: 'Venta de productos',
 *      icon: Store,
 *      permissions: ['vendedor'],
 *      lazy: () => import('./pages/PosPage'),
 *    },
 *  },
 *  { //Patron: modulo - seccion - pagina
 *    path: 'venta2',
 *    meta: {
 *      name: 'Venta2',
 *      description: 'Operacion de ventas',
 *      icon: Store,
 *    }, //seccion
 *    children: [
 *      {
 *        path: 'punto-de-venta3',
 *        meta: {
 *          name: 'Punto de venta3',
 *          description: 'Venta de productos',
 *          icon: Store,

 *
 *        }, //pagina
 *        children: [
 *          {
 *            path: 'punto-de-venta3',
 *            meta: {
 *              name: 'Punto de venta3',
 *              description: 'Venta de productos',
 *              icon: Store,
 *              permissions: ['vendedor'],
 *              lazy: () => import('./pages/PosPage'),
 *            },
 *          },
 *        ],
 *      },
 *      { //seccion
 *        path: 'punto-de-venta5',
 *        meta: {
 *          name: 'Punto de venta3',
 *          description: 'Venta de productos',
 *          icon: Store,
 *
 *        },//pagina
 *        children: [
 *          {
 *            path: 'punto-de-venta3',
 *            meta: {
 *              name: 'Punto de venta3',
 *              description: 'Venta de productos',
 *              icon: Store,
 *              permissions: ['vendedor'],
 *              lazy: () => import('./pages/PosPage'),
 *            },
 *          },
 *        ],
 *      },
 *    ],
 *  },
 *]
 *
 */

export type AppRoute = {
  path: string
  element?: ReactNode
  children?: AppRoute[]
  meta?: AppRouteMeta
}


export type SidebarItem = {
  id: string
  name: string
  description?: string
  icon?: LucideIcon
  path?: string
  children: SidebarItem[]
  lazy?: () => Promise<{ default: ComponentType }>
}



/** verifica permisos */
function hasAnyPermission(userPermissions: AppRole[], required?: AppRole[]): boolean {
  if (!required || required.length === 0) return true
  return userPermissions.some((p) => required.includes(p))
}


function collectLeaves(routes: AppRoute[]): AppRoute[] {
  const result: AppRoute[] = []

  function walk(route: AppRoute) {
    if (route.meta?.lazy || !route.children?.length) {
      result.push(route)
    }
    route.children?.forEach(walk)
  }

  routes.forEach(walk)
  return result
}

/** algo tiene permisos*/
function treeHasPermission(routes: AppRoute[], userPermissions: AppRole[]): boolean {
  const leaves = collectLeaves(routes)
  return leaves.some((leaf) => hasAnyPermission(userPermissions, leaf.meta?.permissions))
}

/** Construye un SidebarItem  */
function toSidebarItem(route: AppRoute, userPermissions: AppRole[]): SidebarItem | null {
  const isLeaf = !!route.meta?.lazy
  const leafVisible = isLeaf ? hasAnyPermission(userPermissions, route.meta?.permissions) : true

  if (!leafVisible && route.meta?.permissions) return null
  if (route.meta?.hideFromSidebar) return null

  const children = (route.children ?? [])
    .map((child) => toSidebarItem(child, userPermissions))
    .filter((item): item is SidebarItem => item !== null)

  // Si no tiene hijos visibles Y no es visible → ocultar
  if (children.length === 0 && !leafVisible) return null

  return {
    id: route.path,
    name: route.meta?.name ?? route.path,
    description: route.meta?.description,
    icon: route.meta?.icon,
    path: route.path,
    children,
    lazy: route.meta?.lazy,
  }
}



/**
 * Convierte AppRoute[] en RouteObject[] para React Router.
 */
export function buildReactRoutes(routes: AppRoute[]): RouteObject[] {
  return routes.map((route) => buildRouteObject(route))
}

function buildRouteObject(route: AppRoute): RouteObject {

  const hasChildren = (route.children?.length ?? 0) > 0
  const hasLazy = !!route.meta?.lazy
  const hasPermissions = (route.meta?.permissions?.length ?? 0) > 0

  const children: RouteObject[] = []

  // Si tiene hijos pero no es leaf, agregar Navigate al primer hijo
  if (hasChildren && !hasLazy) {
    const firstVisible = route.children!.find(
      (c) => !c.meta?.permissions || c.meta.permissions.length > 0,
    )
    if (firstVisible) {
      children.push({
        index: true,
        element: <Navigate to={firstVisible.path} replace />,
      })
    }
  }


  if (hasChildren) {
    children.push(...route.children!.map(buildRouteObject))
  }


  if (hasLazy && hasChildren) {
    const lazyFn = route.meta!.lazy!
    const perms = route.meta!.permissions

    children.push({
      index: true,
      lazy: async () => {
        const mod = await lazyFn()
        const Component = mod.default
        return {
          Component: perms?.length
            ? () => (
              <ProtectedRoute allowedPermissions={perms}>
                <Component />
              </ProtectedRoute>
            )
            : Component,
        }
      },
    })
  }

  // Leaf con lazy y sin hijos 
  if (hasLazy && !hasChildren) {
    const lazyFn = route.meta!.lazy!
    return {
      path: route.path,
      lazy: async () => {
        const mod = await lazyFn()
        const Component = mod.default
        return {
          Component: hasPermissions
            ? () => (
              <ProtectedRoute allowedPermissions={route.meta!.permissions!}>
                <Component />
              </ProtectedRoute>
            )
            : Component,
        }
      },
    }
  }

  return {
    path: route.path,
    element: hasPermissions ? (
      <ProtectedRoute allowedPermissions={route.meta!.permissions!}>
        {route.element ?? <OutletWrapper />}
      </ProtectedRoute>
    ) : (
      route.element ?? <OutletWrapper />
    ),
    children,
  }
}

/** Wrapper simple para Outlet. */
export function OutletWrapper() {
  return <Outlet />
}

/**
 * Genera los ítems del sidebar filtrados por permisos del usuario.
 *
 * @param userPermissions - Permisos del usuario  ['admin', 'vendedor']
 */
export function buildSidebarItems(routes: AppRoute[], userPermissions: AppRole[]): SidebarItem[] {

  const response = routes
    .filter((route) => {
      const filtered = treeHasPermission([route], userPermissions);

      return filtered;
    })
    .map((route) => {
      const mapped = toSidebarItem(route, userPermissions);

      return mapped;
    })
    .filter((item): item is SidebarItem => item !== null)

  return response;
}



type RoleConfig = {
  homeRoute: string

}

export const ROLE_CONFIG: Record<AppRole, RoleConfig> = {
  admin: {
    homeRoute: '/catalogo/productos',

  },
  vendedor: {
    homeRoute: '/venta/punto-de-venta',

  },
}

/**
 * Encuentra la primera ruta disponible para un rol (home redirect).
 * Busca la primera hoja con permiso y retorna su path completo.
 *
 * @param role - Rol principal del usuario (para redireccionar)
 */
export function getHomeRoute(role: AppRole): string {
  return ROLE_CONFIG[role].homeRoute ?? '/acceso-denegado'
}
````

## File: src/lib/motion.ts
````typescript
export const slideVertical = {
    hidden: { y: 150, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: -150, opacity: 0 }
};
````

## File: src/lib/query-keys.ts
````typescript
/**
 * Query Key Factory
 *
 * Centraliza todas las claves de React Query para evitar colisiones
 * y mantener consistencia en todo el proyecto.
 *

 * Uso:
 *   queryKeys.products.all             → ['products']
 *   queryKeys.products.lists()         → ['products', 'list']
 *   queryKeys.products.detail('123')   → ['products', 'detail', '123']
 *   queryKeys.products.categories()    → ['products', 'categories']
 */

export const queryKeys = {


  products: {
    all: ['products'] as const,
    list: () => [...queryKeys.products.all, 'list'] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.products.details(), id] as const,
    categories: () => [...queryKeys.products.all, 'categories'] as const,
    category: (id: string) =>
      [...queryKeys.products.categories(), id] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: () => [...queryKeys.customers.all, 'list'] as const,

  },
  sales: {
    all: ['sales'] as const,
    list: () => [...queryKeys.sales.all, 'list'] as const,
    details: () => [...queryKeys.sales.all, 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.sales.details(), id] as const,
  },
}
````

## File: src/lib/utils.ts
````typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
````

## File: src/main.tsx
````typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import App from '@/App.tsx'
import '@/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 60_000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  </StrictMode>,
)
````

## File: src/routes/routes.tsx
````typescript
import { createBrowserRouter, type RouteObject } from 'react-router'
import MainLayout from '@/layouts/main/MainLayout'
import RedirectIndex from '@/components/route/RedirectIndex'
import { buildReactRoutes } from '@/lib/app-routes'
import { authRoutes } from '@/features/auth'
import { coreRoutes, ErrorPage } from '@/features/core'
import { salesRoutes } from '@/features/sales'
import { catalogRoutes } from '@/features/catalog'


const mainLayoutRoutes: RouteObject = {
  path: '/',
  element: <MainLayout />,
  errorElement: <ErrorPage />,
  children: [
    {
      index: true,
      element: <RedirectIndex />,
    },
    ...buildReactRoutes([...salesRoutes, ...catalogRoutes]),
  ],
}

export const router = createBrowserRouter([
  ...buildReactRoutes(authRoutes),
  ...buildReactRoutes(coreRoutes),
  mainLayoutRoutes,
])
````

## File: tsconfig.app.json
````json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2023",
    "useDefineForClassFields": true,
    "lib": [
      "ES2023",
      "DOM",
      "DOM.Iterable"
    ],
    "module": "ESNext",
    "types": [
      "vite/client"
    ],
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    },
    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": [
    "src"
  ]
}
````

## File: tsconfig.json
````json
{
  "files": [],
  "references": [
    {
      "path": "./tsconfig.app.json"
    },
    {
      "path": "./tsconfig.node.json"
    }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  }
}
````

## File: tsconfig.node.json
````json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
````

## File: vite.config.ts
````typescript
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
````
