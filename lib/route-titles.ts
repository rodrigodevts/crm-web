const TITLES: Record<string, string> = {
  '/atendimentos': 'Atendimentos',
  '/contatos': 'Contatos',
  '/campanhas': 'Campanhas',
  '/bot-fluxo': 'Bot/Fluxo',
  '/dashboard': 'Dashboard',
  '/configuracoes': 'Configurações',
  '/configuracoes/departamentos': 'Departamentos',
  '/configuracoes/tags': 'Tags',
  '/configuracoes/usuarios': 'Usuários',
  '/configuracoes/quick-replies': 'Quick Replies',
  '/configuracoes/canais': 'Canais',
  '/configuracoes/motivos-fechamento': 'Motivos de fechamento',
  '/configuracoes/integracoes': 'Integrações',
  '/configuracoes/preferencias': 'Preferências',
  '/ajuda': 'Ajuda',
};

export function getRouteTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const matched = Object.keys(TITLES)
    .filter((k) => pathname.startsWith(`${k}/`))
    .sort((a, b) => b.length - a.length)[0];
  return matched !== undefined ? (TITLES[matched] ?? '') : '';
}
