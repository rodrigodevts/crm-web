import { CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section } from './section';

const variants = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;
const sizes = ['default', 'sm', 'lg', 'icon'] as const;

export function PrimitivesButtons() {
  return (
    <Section id="primitivos-buttons" title="Buttons">
      <div>
        <h3 className="mb-3 text-base font-medium">Variants</h3>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Sizes</h3>
        <div className="flex flex-wrap items-center gap-2">
          {sizes.map((s) =>
            s === 'icon' ? (
              <Button key={s} size={s} aria-label="ícone">
                <CheckIcon />
              </Button>
            ) : (
              <Button key={s} size={s}>
                {s}
              </Button>
            ),
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">States</h3>
        <div className="flex flex-wrap gap-2">
          <Button>Normal</Button>
          <Button disabled>Desativado</Button>
          <Button>
            <CheckIcon />
            Com ícone
          </Button>
        </div>
      </div>
    </Section>
  );
}
