import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "rlc-sim:welcome-shown";

interface Props {
  /** Si `true`, mostrar el modal incluso si ya se vio antes. */
  forceShow?: boolean;
  onClose?: () => void;
}

export function WelcomeModal({ forceShow, onClose }: Props) {
  const [visible, setVisible] = useState(forceShow ?? false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      return;
    }
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setVisible(true);
  }, [forceShow]);

  const close = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    onClose?.();
  };

  // Esc cierra
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Video de bienvenida"
      onClick={close}
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 backdrop-blur-sm p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl rounded-2xl bg-stone-900 ring-1 ring-stone-700/60 shadow-2xl overflow-hidden"
      >
        <button
          onClick={close}
          aria-label="Cerrar y entrar al simulador"
          className="absolute top-3 right-3 z-10 rounded-full bg-stone-800/80 hover:bg-stone-700 ring-1 ring-stone-600/60 w-9 h-9 flex items-center justify-center text-stone-300 transition"
        >
          ✕
        </button>

        <video
          ref={videoRef}
          src="/welcome-intro.mp4"
          autoPlay
          muted
          controls
          playsInline
          onEnded={close}
          className="w-full block bg-black"
        />

        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-stone-900 border-t border-stone-800">
          <div className="text-xs text-stone-400">
            Toca <kbd className="bg-stone-800 ring-1 ring-stone-700 px-1.5 py-0.5 rounded font-mono text-[10px]">Esc</kbd> o
            haz click fuera para cerrar.
          </div>
          <button
            onClick={close}
            className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-orange-500 hover:from-fuchsia-400 hover:to-orange-400 transition px-5 py-2 font-bold text-stone-900 text-sm"
          >
            Entrar al simulador
          </button>
        </div>
      </div>
    </div>
  );
}

/** Botón para volver a abrir el video (lo expongo desde el header). */
export function WelcomeReplayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-stone-200 transition font-mono"
      title="Ver el video introductorio"
    >
      <span aria-hidden>▶</span>
      Ver intro
    </button>
  );
}
