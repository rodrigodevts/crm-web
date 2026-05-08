const tocItems: ReadonlyArray<{
  id: string;
  label: string;
  children?: ReadonlyArray<{ id: string; label: string }>;
}> = [
  {
    id: 'tokens',
    label: 'Tokens',
    children: [
      { id: 'tokens-cores', label: 'Cores' },
      { id: 'tokens-tipografia', label: 'Tipografia' },
      { id: 'tokens-spacing', label: 'Spacing / Radius / Sombras' },
    ],
  },
  {
    id: 'primitivos',
    label: 'Primitivos',
    children: [
      { id: 'primitivos-buttons', label: 'Buttons' },
      { id: 'primitivos-forms', label: 'Forms' },
      { id: 'primitivos-feedback', label: 'Feedback' },
      { id: 'primitivos-overlays', label: 'Overlays' },
      { id: 'primitivos-data', label: 'Data display' },
      { id: 'primitivos-charts', label: 'Charts' },
    ],
  },
  {
    id: 'compostos',
    label: 'Compostos',
  },
];

export function Toc() {
  return (
    <nav aria-label="Sumário do design system" className="text-sm">
      <ul className="flex flex-col gap-1">
        {tocItems.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-foreground hover:text-primary block font-medium"
            >
              {item.label}
            </a>
            {item.children ? (
              <ul className="mt-1 ml-3 flex flex-col gap-1 border-l pl-3">
                {item.children.map((child) => (
                  <li key={child.id}>
                    <a
                      href={`#${child.id}`}
                      className="text-muted-foreground hover:text-primary block"
                    >
                      {child.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
