export function Header() {
  return (
    <header className="w-full px-8 pt-8 pb-4 max-w-7xl mx-auto">
      <div className="inline-block px-3 py-1 rounded-full bg-orange-400/15 text-orange-300 text-xs font-mono tracking-widest uppercase mb-3 ring-1 ring-orange-400/40">
        Simulador · Ecuaciones Diferenciales
      </div>
      <h1 className="text-4xl md:text-5xl font-bold leading-tight">
        <span className="bg-gradient-to-r from-orange-300 via-fuchsia-300 to-teal-300 bg-clip-text text-transparent">
          Oscilaciones EM en un circuito RLC
        </span>
      </h1>
      <p className="mt-3 text-stone-400 text-lg max-w-3xl">
        Cambia los valores de <span className="font-mono text-stone-200">R</span>,{" "}
        <span className="font-mono text-stone-200">L</span>,{" "}
        <span className="font-mono text-stone-200">C</span> y{" "}
        <span className="font-mono text-stone-200">U</span> y observa cómo cambia la respuesta del circuito.
        Las soluciones son las que se obtienen analíticamente mediante la transformada de Laplace.
      </p>
    </header>
  );
}
