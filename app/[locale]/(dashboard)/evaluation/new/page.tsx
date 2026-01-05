import { EvaluationForm } from '@/components/evaluation/evaluation-form';

export default function NewEvaluationPage() {
  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EvaluationForm />
      </div>
    </main>
  );
}
