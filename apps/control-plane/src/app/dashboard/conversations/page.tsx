import { requireSession } from '@/lib/auth';
import { ChatView } from './chat-view';

export default async function ConversationsPage() {
  await requireSession();

  return (
    <div className="flex h-[calc(100vh-4rem)] min-w-0 flex-col lg:-m-8">
      <ChatView />
    </div>
  );
}
