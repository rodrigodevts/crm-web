import type { Metadata } from 'next';
import Link from 'next/link';
import { AcceptInviteForm } from '@/components/accept-invite-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetchInvitationByToken } from '@/lib/invite-server';

export const metadata: Metadata = {
  title: 'Aceitar convite — DigiChat',
};

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await fetchInvitationByToken(token);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        {result.kind === 'ok' ? (
          <AcceptInviteForm
            token={token}
            email={result.invitation.email}
            role={result.invitation.role}
            companyName={result.invitation.companyName}
          />
        ) : result.kind === 'invalid' ? (
          <InvalidInviteCard status={result.status} />
        ) : (
          <ErrorCard />
        )}
      </div>
    </div>
  );
}

function InvalidInviteCard({ status }: { status: 404 | 410 }) {
  const message =
    status === 410
      ? 'Este convite não está mais disponível. Ele pode ter sido aceito por outra pessoa ou revogado pelo administrador.'
      : 'Convite não encontrado. Confira o link recebido ou peça um novo ao administrador.';
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Convite indisponível</h1>
        <p className="text-muted-foreground">{message}</p>
        <Button asChild variant="outline">
          <Link href="/login">Ir para o login</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ErrorCard() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Erro ao carregar convite</h1>
        <p className="text-muted-foreground">
          Não foi possível verificar este convite agora. Tente novamente em instantes.
        </p>
        <Button asChild variant="outline">
          <Link href="/login">Ir para o login</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
