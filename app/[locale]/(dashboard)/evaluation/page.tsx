import { getOptimizationHistoryAction } from "@/app/actions/optimization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Clock, CheckCircle2, XCircle, AlertCircle, Loader as LoaderIcon } from "lucide-react";
import { getLocale } from "next-intl/server";

// Helper for date formatting
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default async function DashboardPage() {
  const history = (await getOptimizationHistoryAction()) as any[];
  const locale = await getLocale();

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Evaluations</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your historical optimization jobs.
            </p>
          </div>
          <Link href="/evaluation/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Evaluation
            </Button>
          </Link>
        </div>

        {history.length === 0 ? (
          <Card className="border-dashed">
             <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="bg-primary/10 p-4 rounded-full">
                    <Clock className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold">No evaluations yet</h3>
                    <p className="text-muted-foreground max-w-sm">
                        Start your first optimization to see results here.
                    </p>
                </div>
                <Link href="/evaluation/new">
                    <Button>Create Evaluation</Button>
                </Link>
             </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-md border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                  <tr>
                    <th className="px-6 py-4">Job ID</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.map((job: any) => (
                    <tr key={job.job_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">
                        <Link href={`/${locale}/evaluation/result/${job.job_id}`} className="text-blue-600 hover:underline">
                          {job.job_id.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium">{job.company_name || "-"}</td>
                      <td className="px-6 py-4">
                         <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                             job.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                             job.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                             'bg-blue-50 text-blue-700 border-blue-200'
                         }`}>
                             {job.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                             {job.status === 'failed' && <XCircle className="h-3 w-3" />}
                             {job.status === 'processing' && <LoaderIcon className="h-3 w-3 animate-spin" />}
                             <span className="capitalize">{job.status}</span>
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs font-medium w-8 text-right">{job.progress_percent}%</span>
                            <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${
                                        job.status === 'failed' ? 'bg-red-500' : 'bg-primary'
                                    }`} 
                                    style={{ width: `${job.progress_percent}%` }} 
                                />
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(job.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Loader({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
