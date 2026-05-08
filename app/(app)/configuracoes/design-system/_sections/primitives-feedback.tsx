import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Section } from './section';
import { SonnerTriggers } from './primitives-feedback-client';

export function PrimitivesFeedback() {
  return (
    <Section id="primitivos-feedback" title="Feedback">
      <div>
        <h3 className="mb-3 text-base font-medium">Skeleton</h3>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Badge</h3>
        <div className="flex flex-wrap gap-2">
          <Badge>default</Badge>
          <Badge variant="secondary">secondary</Badge>
          <Badge variant="outline">outline</Badge>
          <Badge variant="destructive">destructive</Badge>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Tooltip</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover ou foco aqui</Button>
          </TooltipTrigger>
          <TooltipContent>Tooltip de exemplo</TooltipContent>
        </Tooltip>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Sonner toasts</h3>
        <SonnerTriggers />
      </div>
    </Section>
  );
}
