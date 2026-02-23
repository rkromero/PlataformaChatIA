import { KnowledgeForm } from '../knowledge-form';
import { createKnowledgeEntryAction } from '../actions';
import { Breadcrumbs } from '@/components/breadcrumbs';

export default function NewKnowledgePage() {
  return (
    <div>
      <Breadcrumbs items={[
        { label: 'Conocimiento', href: '/dashboard/knowledge' },
        { label: 'Nueva entrada' },
      ]} />
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Agregar información</h1>
      <KnowledgeForm action={createKnowledgeEntryAction} />
    </div>
  );
}
