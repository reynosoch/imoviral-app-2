# InmoViral App

Aplicación web inmobiliaria desarrollada con React. Incluye autenticación global, soporte multiidioma y configuración de rutas lista para despliegues SPA.

## Inicio Rápido

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Levanta el servidor local:
   ```bash
   npm start
   ```

## Estructura

* `/Componentes`: Módulos e interfaz de usuario.
* `/locales`: Archivos de traducción.
* `AuthContext.js`: Manejo de sesiones y autenticación.

## GitHub Pages

Sitio: https://reynosoch.github.io/imoviral-app-2/

El proyecto que se compila es el de la raíz del repositorio. La carpeta
`imoviral-app-2-main/` es una copia y no se usa en el despliegue.

Pages conserva **Deploy from a branch → gh-pages → / (root)**.
El workflow **Deploy GitHub Pages** compila cada push a `main`, actualiza
`gh-pages` y solicita explícitamente la publicación a la API de Pages.
No necesita autorizar `main` en el entorno `github-pages`: la publicación
final ocurre desde la rama ya permitida `gh-pages`.

Para verificar la exportación local: `npm ci` y `npm run build:web`.
Expo usa `experiments.baseUrl` para servir scripts, imágenes y fuentes bajo
`/imoviral-app-2`. El archivo `.nojekyll` permite servir el directorio `_expo`
y las fuentes bajo `assets/node_modules`.

Para Google y los enlaces de autenticación, agrega
`https://reynosoch.github.io/imoviral-app-2/` a las Redirect URLs en
Supabase → Authentication → URL Configuration. El código web regresa a la
URL de la aplicación; el callback nativo se mantiene.

`npm run deploy` sigue disponible para publicar manualmente `dist` en `gh-pages`.

## inmoviral.site / dominio raíz

La misma aplicación y landing real de InmoViral puede exportarse para un dominio
raíz sin romper el despliegue existente de GitHub Pages.

```bash
npm ci
npm run build:web:root
```

Ese comando genera `dist/` con `experiments.baseUrl` vacío, por lo que scripts,
imágenes y fuentes funcionan correctamente en `https://inmoviral.site/` en vez de
quedar amarrados a `/imoviral-app-2`.

La configuración dinámica vive en `app.config.js`:

- build normal (`npm run build:web`) → conserva `/imoviral-app-2` para GitHub Pages;
- build raíz (`npm run build:web:root`) → usa `/` para `inmoviral.site` o cualquier
  otro custom domain.

Para Cloudflare Workers/Pages usa:

- **Build command:** `npm run build:web:root`
- **Output directory:** `dist`
- **Custom domain:** `inmoviral.site`

No se creó una landing paralela: el dominio raíz sirve la misma aplicación real del
repositorio, incluyendo la home, propiedades, soluciones, autenticación y demás
funcionalidad existente.

El workflow **Verify web targets** valida en cada push a `main` tanto el build de
GitHub Pages como el build de dominio raíz para evitar romper uno al habilitar el otro.
