export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center">
        <h2 className="text-foreground mb-2 text-2xl font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">Em breve.</p>
      </div>
    </div>
  );
}
