import Link from "next/link";

export default function TechLandingPage() {
  const workflows = [
    {
      href: "/tech/receive",
      title: "Receive",
      description: "Capture a newly arrived asset and mark it received with a fast single-scan flow.",
    },
    {
      href: "/tech/store",
      title: "Store",
      description: "Scan an asset, then scan where it is being stored so inventory stays aligned.",
    },
    {
      href: "/tech/deploy",
      title: "Deploy",
      description: "Move a stored asset into service by scanning the asset and its deployment location.",
    },
    {
      href: "/tech/transfer",
      title: "Transfer custody",
      description: "Pass an asset from one custodian to another with a clear two-step badge workflow.",
    },
  ];

  return (
    <div className="space-y-8 p-6">
      <div className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-bold text-slate-950">Technician workflows</h1>
        <p className="text-lg text-slate-600">
          Choose a workflow to launch a tap-friendly scanning experience built for quick hands-on use.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {workflows.map((workflow) => (
          <Link
            key={workflow.href}
            href={workflow.href}
            className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Open workflow</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950">{workflow.title}</h2>
              <p className="mt-3 text-lg text-slate-600">{workflow.description}</p>
            </div>
            <span className="mt-6 inline-flex items-center text-base font-semibold text-blue-700">Launch now →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
