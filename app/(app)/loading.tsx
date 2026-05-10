export default function AppLoading() {
  return (
    <div className="bg-background flex h-screen overflow-hidden">
      <div className="bg-sidebar border-border hidden w-60 border-r md:block" />
      <div className="flex flex-1 flex-col">
        <div className="bg-background border-border h-14 border-b" />
        <div className="bg-muted/50 flex-1 animate-pulse" />
      </div>
    </div>
  );
}
