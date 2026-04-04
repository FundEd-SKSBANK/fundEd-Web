import { getQuickJoinTokenInfo } from '@/actions/major-events';
import { getSession } from '@/lib/auth';
import { JoinClient } from './join-client';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function JoinPage({ params }: Props) {
  const { token } = await params;

  const [tokenResult, session] = await Promise.all([
    getQuickJoinTokenInfo(token),
    getSession(),
  ]);

  return (
    <JoinClient
      token={token}
      tokenData={tokenResult.success ? tokenResult.data! : null}
      tokenError={!tokenResult.success ? (tokenResult.error ?? null) : null}
      initialSession={session?.user ? {
        ...session.user,
        name: session.user.name ?? null,
        adminId: (session.user as any).adminId ?? null,
      } : null}
    />
  );
}
