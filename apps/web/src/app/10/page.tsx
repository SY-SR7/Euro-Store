export default function Immersive3DParallax() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://placehold.co/1000x1000/1e293b/334155?text=Background')] bg-cover opacity-20" />
      <h1 className="text-5xl font-bold z-10 transform hover:scale-110 transition-transform duration-500">
        Immersive 3D Parallax (Variation 10)
      </h1>
    </main>
  );
}
