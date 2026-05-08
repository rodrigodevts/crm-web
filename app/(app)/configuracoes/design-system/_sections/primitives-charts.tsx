'use client';

import { Line, LineChart, CartesianGrid, XAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Section } from './section';

const data = [
  { day: 'Seg', tickets: 12 },
  { day: 'Ter', tickets: 19 },
  { day: 'Qua', tickets: 14 },
  { day: 'Qui', tickets: 22 },
  { day: 'Sex', tickets: 30 },
  { day: 'Sáb', tickets: 8 },
  { day: 'Dom', tickets: 4 },
];

const chartConfig: ChartConfig = {
  tickets: { label: 'Tickets', color: 'var(--chart-1)' },
};

export function PrimitivesCharts() {
  return (
    <Section id="primitivos-charts" title="Charts">
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <LineChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            dataKey="tickets"
            type="monotone"
            stroke="var(--color-tickets)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </Section>
  );
}
