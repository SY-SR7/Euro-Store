'use client';

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full flex-grow flex flex-col">
      {children}
    </div>
  );
}
