export default function AppLoading() {
  return (
    <div className="bg-bg-base flex h-screen overflow-hidden">
      <div className="bg-bg-subtle border-border-default hidden w-60 border-r md:block" />
      <div className="flex flex-1 flex-col">
        <div className="bg-bg-base border-border-default h-14 border-b" />
        <div className="bg-bg-muted/50 flex-1 animate-pulse" />
      </div>
    </div>
  );
}
