import { getOptimizationStatusAction } from "@/app/actions/optimization";
import { OptimizationResultClient } from "@/components/evaluation/optimization-result-client";

interface PageProps {
  params: Promise<{
    locale: string;
    jobId: string;
  }>;
}



export default async function OptimizationResultPage({ params }: PageProps) {
  const { jobId, locale } = await params;
  const result = await getOptimizationStatusAction(jobId);

  return (
    <OptimizationResultClient 
      jobId={jobId} 
      locale={locale} 
      initialData={result} 
    />
  );
}
