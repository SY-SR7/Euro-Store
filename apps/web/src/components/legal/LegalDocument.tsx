type LegalSection = {
  title: string;
  paragraphs: string[];
};

export function LegalDocument({
  title,
  updatedLabel,
  introduction,
  sections,
  dir,
}: {
  title: string;
  updatedLabel: string;
  introduction: string;
  sections: LegalSection[];
  dir: 'rtl' | 'ltr';
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:py-16" dir={dir}>
      <article className="mx-auto max-w-4xl">
        <header className="border-b border-border pb-8">
          <h1 className="text-3xl font-black text-text-primary sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-text-muted">{updatedLabel}</p>
          <p className="mt-6 max-w-3xl leading-8 text-text-secondary">{introduction}</p>
        </header>

        <div className="divide-y divide-border">
          {sections.map((section, index) => (
            <section key={section.title} className="py-8">
              <h2 className="text-xl font-bold text-text-primary">
                {index + 1}. {section.title}
              </h2>
              <div className="mt-4 space-y-3 leading-8 text-text-secondary">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
