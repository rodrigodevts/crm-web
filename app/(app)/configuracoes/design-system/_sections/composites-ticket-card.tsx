'use client';

import type { TicketsListResponseDto } from '@/lib/generated/types';
import { TicketCard } from '@/app/(app)/atendimentos/components/ticket-card';

type TicketItem = TicketsListResponseDto['items'][number];

const NOW_MS = Date.now();
const HOUR_MS = 60 * 60 * 1000;
const hoursAgo = (h: number) => new Date(NOW_MS - h * HOUR_MS).toISOString();

const baseTicket = {
  channelConnectionId: '00000000-0000-7000-8000-0000000000aa',
  isBot: false,
  inWhatsappWindow: true,
  createdAt: hoursAgo(48),
  updatedAt: hoursAgo(1),
} as const;

const mockTickets: TicketItem[] = [
  // 1. OPEN com nome, snippet TEXT, unread=3, 2 tags, dentro janela (safe)
  {
    ...baseTicket,
    id: '00000000-0000-7000-8000-000000000001',
    protocol: '00342',
    status: 'OPEN',
    contact: {
      id: '00000000-0000-7000-8000-0000000000c1',
      name: 'Maria Silva',
      phoneNumber: '5511987654321',
    },
    assignedUserId: '00000000-0000-7000-8000-0000000000a1',
    departmentId: '00000000-0000-7000-8000-0000000000d1',
    unreadCount: 3,
    lastMessageAt: hoursAgo(0.1),
    lastInboundAt: hoursAgo(2),
    tags: [
      { id: 't1', name: 'Faturamento', color: '#1b84ff' },
      { id: 't2', name: 'VIP', color: '#facc15' },
    ],
    lastMessage: {
      type: 'TEXT',
      content: 'Boa tarde! Preciso de ajuda com o boleto que venceu ontem…',
    },
  },
  // 2. PENDING sem nome (telefone mascarado), snippet IMAGE, sem unread (warning)
  {
    ...baseTicket,
    id: '00000000-0000-7000-8000-000000000002',
    protocol: '00343',
    status: 'PENDING',
    contact: {
      id: '00000000-0000-7000-8000-0000000000c2',
      name: null,
      phoneNumber: '5511912348888',
    },
    assignedUserId: null,
    departmentId: null,
    unreadCount: 0,
    lastMessageAt: hoursAgo(3),
    lastInboundAt: hoursAgo(20),
    tags: [],
    lastMessage: { type: 'IMAGE', content: null },
  },
  // 3. OPEN, snippet AUDIO, fora janela (lastInboundAt = null → barra escondida)
  {
    ...baseTicket,
    id: '00000000-0000-7000-8000-000000000003',
    protocol: '00344',
    status: 'OPEN',
    contact: {
      id: '00000000-0000-7000-8000-0000000000c3',
      name: 'João Oliveira',
      phoneNumber: '5511923456789',
    },
    assignedUserId: '00000000-0000-7000-8000-0000000000a1',
    departmentId: null,
    unreadCount: 1,
    lastMessageAt: hoursAgo(7),
    lastInboundAt: null,
    inWhatsappWindow: false,
    tags: [{ id: 't3', name: 'Suporte', color: '#22c55e' }],
    lastMessage: { type: 'AUDIO', content: null },
  },
  // 4. PENDING, snippet TEMPLATE, com 4 tags (testa "+N"), urgent janela
  {
    ...baseTicket,
    id: '00000000-0000-7000-8000-000000000004',
    protocol: '00345',
    status: 'PENDING',
    contact: {
      id: '00000000-0000-7000-8000-0000000000c4',
      name: 'Ana Beatriz Mendonça',
      phoneNumber: '5511955557777',
    },
    assignedUserId: null,
    departmentId: '00000000-0000-7000-8000-0000000000d1',
    unreadCount: 12,
    lastMessageAt: hoursAgo(0.05),
    lastInboundAt: hoursAgo(23.5), // urgent — 30min restantes na janela
    tags: [
      { id: 't1', name: 'Faturamento', color: '#1b84ff' },
      { id: 't4', name: 'Cobrança', color: '#ef4444' },
      { id: 't3', name: 'Suporte', color: '#22c55e' },
      { id: 't5', name: 'Renovação', color: '#a855f7' },
      { id: 't6', name: 'Premium', color: '#facc15' },
    ],
    lastMessage: { type: 'TEMPLATE', content: null },
  },
];

const mockAssignees: Record<string, string> = {
  '00000000-0000-7000-8000-0000000000a1': 'Carlos Atendente',
};
const mockDepartments: Record<string, string> = {
  '00000000-0000-7000-8000-0000000000d1': 'Suporte',
};

export function CompositesTicketCard() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">TicketCard (fila de Atendimentos)</h3>
        <p className="text-muted-foreground text-sm">
          Variantes do card de ticket renderizadas com dados mock. Em produção, ticket vem de{' '}
          <code>GET /tickets</code> via Kubb; nomes de atendente/depto vêm de cache TanStack.
        </p>
      </div>
      <div className="border-border max-w-md overflow-hidden rounded-md border">
        {mockTickets.map((t) => (
          <TicketCard
            key={t.id}
            ticket={t}
            hidePhoneFromAgents={t.contact.name === null}
            assignedUserName={t.assignedUserId ? mockAssignees[t.assignedUserId] : undefined}
            departmentName={t.departmentId ? mockDepartments[t.departmentId] : undefined}
            isSelected={false}
            onSelect={() => {}}
          />
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        Variantes cobertas: <strong>1</strong> OPEN com nome + 2 tags + janela 24h safe;{' '}
        <strong>2</strong> PENDING sem nome (telefone mascarado) + mídia IMAGE; <strong>3</strong>{' '}
        OPEN com mídia AUDIO + janela fechada (sem barra); <strong>4</strong> PENDING urgent + 5
        tags (mostra 3 + &ldquo;+2&rdquo;) + snippet TEMPLATE.
      </p>
    </div>
  );
}
