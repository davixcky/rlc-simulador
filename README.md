# Simulador RLC — Transformada de Laplace

Simulador interactivo en navegador de las **oscilaciones electromagnéticas en un circuito RLC en serie**. Mueve los parámetros R, L, C y U, observa cómo cambia la respuesta q(t) e i(t), y descarga un video del experimento con tus propios valores.

Las soluciones se obtienen analíticamente mediante la **transformada de Laplace** de la EDO de segundo orden

```
L · q̈ + R · q̇ + q/C = 0,    q(0) = C·U,   i(0) = 0
```

cubriendo los tres regímenes — **subamortiguado**, **críticamente amortiguado** y **sobreamortiguado** — exactamente como se describe en el artículo asociado (Mäkilä, 2006; Ciobanu et al., 2023).

## Para qué sirve

- **Estudiantes**: ver al instante el efecto de cada parámetro sobre la oscilación y la frontera entre régimenes.
- **Profesores**: generar el video con los valores deseados para usar en clase, sin abrir un notebook.

## Cómo correrlo

```bash
yarn install
yarn dev            # servidor de desarrollo
yarn build          # build de producción a ./dist
yarn preview        # servir el build localmente
```

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- Recharts (gráficas en tiempo real)
- `<canvas>` + MediaRecorder API (generación de video sin servidor)

## Cómo se genera el video

El módulo `src/lib/videoRender.ts` dibuja los mismos plots sobre un `<canvas>` 1920×1080 a 30 fps, los captura con `MediaRecorder` y los entrega como `.mp4` (Safari) o `.webm` (Chrome/Firefox/Edge). Todo ocurre en el navegador — sin servidor.

## Despliegue

`vercel --prod` desde la raíz del repo, o conecta `davixcky/rlc-simulador` desde el dashboard de Vercel. Build command: `yarn build`, output: `dist`.

## Referencias

- Ciobanu, A., Miron, C., Berlic, C., & Barna, V. (2023). *Integrating computational tools in teaching electromagnetic oscillations.* Romanian Reports in Physics, 75, 912.
- Mäkilä, P. M. (2006). *A note on the Laplace transform method for initial value problems.* International Journal of Control, 79(1), 36–41.
