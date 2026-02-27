import { redirect } from 'next/navigation';

export default function KnowledgePage() {
  redirect('/dashboard/ai-settings?tab=knowledge');
}
