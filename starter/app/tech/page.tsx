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
    <div className="space-y-8 p-7">
      <div className="rounded-2xl bg-[#0f1724] px-6 py-5 text-slate-100">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Lab operations</p>
        <h1 className="mt-2 text-3xl font-semibold">Technician workflows</h1>
        <p className="mt-2 max-w-3xl text-base text-slate-300">
          Launch a workflow to capture asset events with scanner-first forms designed for high-throughput bench operations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {workflows.map((workflow) => (
          <Link
            key={workflow.href}
            href={workflow.href}
            className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Open workflow</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">{workflow.title}</h2>
              <p className="mt-3 text-base text-slate-600">{workflow.description}</p>
            </div>
            <span className="mt-6 inline-flex items-center text-sm font-semibold uppercase tracking-[0.14em] text-blue-600 group-hover:text-blue-700">
              Launch workflow
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
