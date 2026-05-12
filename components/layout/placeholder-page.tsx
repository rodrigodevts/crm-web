export function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-foreground text-2xl font-semibold">{title}</h1>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </header>
      <div className="text-muted-foreground text-sm">Em breve.</div>
    </div>
  );
}
