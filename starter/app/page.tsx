import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-950">Technician</h2>
          <p className="mt-1 text-sm text-slate-600">
            Mobile scan workflows.
          </p>
          <ul className="mt-4 space-y-2">
            <li>
              <Link className="text-blue-700 hover:underline" href="/tech">
                /tech &nbsp;— landing
              </Link>
            </li>
            <li>
              <Link className="text-blue-700 hover:underline" href="/tech/receive">
                /tech/receive
              </Link>
            </li>
            <li>
              <Link className="text-blue-700 hover:underline" href="/tech/store">
                /tech/store
              </Link>
            </li>
            <li>
              <Link className="text-blue-700 hover:underline" href="/tech/deploy">
                /tech/deploy
              </Link>
            </li>
            <li>
              <Link className="text-blue-700 hover:underline" href="/tech/transfer">
                /tech/transfer
              </Link>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-950">Manager</h2>
          <p className="mt-1 text-sm text-slate-600">
            Desktop dashboard workflows.
          </p>
          <ul className="mt-4 space-y-2">
            <li>
              <Link className="text-blue-700 hover:underline" href="/manager">
                /manager &nbsp;— landing
              </Link>
            </li>
            <li>
              <Link
                className="text-blue-700 hover:underline"
                href="/manager/reconcile"
              >
                /manager/reconcile
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
