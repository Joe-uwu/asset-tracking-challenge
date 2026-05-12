# Background: how this kind of system fits into the world

Optional reading. The brief in [`CHALLENGE.md`](./CHALLENGE.md) tells you what to build; this doc tells you *why anyone would build it* and what tradeoffs are baked into the design. None of it is required, but it'll help you make sharper calls — especially on the reconciliation report, where the right answer depends on understanding what each system was built for.

The challenge framing — a multi-site research lab tracking sequencers and mass specs — is a stand-in. The underlying problem class is one a lot of organizations actually have once they own thousands of high-value physical assets that move around: data centers, hospitals, semiconductor fabs, oil & gas, biotech. The details below describe the general shape of how those organizations tend to solve it.

## The three systems

Large organizations that own thousands of physical assets usually end up with at least three systems holding a partial view of those assets. Each was built for a different job, and each is the right authority for its job — but none of them is the authority for everything.

**Operations** — the system you're building against — owns the answer to *where is this asset right now? Who's responsible for it? What state is it in?* It's the system techs scan into. Its source of truth is physical reality: every state change is triggered by someone scanning a barcode in front of the actual thing.

**Facilities management** owns the topology: rooms, racks, rack units, capacity. It knows which positions exist and which are occupied. It's a documentation system, not a workflow system — it can tell you *that* a thing is racked at row 3 / position 4, but it can't tell you who put it there or when. Facilities sees racked equipment; it doesn't see things in receiving, things in storage, or things that have been disposed of.

**Finance / ERP** owns the asset register: what we bought, what it cost, what its book value is today, whether it's been retired for tax purposes. It sees buildings, not racks. It cares about events that affect the ledger — purchase, capitalization, retirement — and doesn't care about day-to-day moves between racks within a site.

Once you understand which lane each system is in, the reconciliation report mostly writes itself. The interesting question is not *do they agree* — they never fully will — but *which disagreements mean something*.

## Why these systems can never fully agree

People skip scans. Finance lags by a billing cycle. Facilities imports get stale. A tech moves a server from rack 4 to rack 5; facilities doesn't know until someone updates it manually, which is often never. An asset is disposed of in operations on Monday, but the depreciation run doesn't happen until end of month. An asset arrives at the dock; the receive scan happens an hour later because the tech was on the other side of the building.

Some of these disagreements are **expected** — different systems have different update cadences, different scopes, different blind spots. Some are **real problems** — an asset operations thinks is in service that facilities has never seen suggests the rack location is fake or the asset was never actually deployed. Some are **ambiguous** — could be a billing lag, could be a real divergence, you can't tell from the data alone and a human needs to look.

A good reconciliation report sorts the data into those buckets rather than dumping every difference into one undifferentiated list. The asset manager's job on Monday morning is to read it and know what to ignore, what to act on now, and what to ping another team about.

## Why operations doesn't just merge with the other two

Tempting to ask: why not put everything in one system? Two reasons.

First, **lane discipline**. Facilities is the right authority for "does rack RU 18 exist and is it occupied" — it has been the authority for that since long before anyone scanned anything. Finance is the right authority for book value because it's integrated with everything else the finance team uses (tax, GL, depreciation schedules). The operations layer is the right authority for "who has this serial right now" because that's a question only a scan can answer.

Second, **update cadence**. Operations writes thousands of events a day (every scan is an event). Finance writes hundreds a month. Facilities is updated whenever someone bothers. Trying to make one system serve all three workloads turns it into a system that's bad at all of them.

The cost of having three systems is the drift this challenge exists to expose. The cost of having one would be worse.

## The compliance angle

Once an organization is tracking high-value capital equipment, financial auditors start caring about the event log. Specifically, they want to see who changed each field, when, and what physical action triggered the change. That's why every state change in operations writes an immutable event, and why the operating rule in production systems is *no manual edits without a scan*. The scan is the evidence.

You don't need to build any of that compliance machinery for this challenge — auth, immutability, signed records, retention policies all live elsewhere. But it explains why the event log exists and why "render the event log" on the manager detail page is more than a debugging convenience.

## The hot path

A tech scanning a barcode is doing something physically slow — walking to a rack, lifting a unit, lining up the scanner — interrupted by something that has to be digitally fast. If the UI takes more than a second or two between scan and confirmation, the tech starts treating it as friction and skipping scans. Bad data enters the system. Reconciliation breaks down. The whole thing degrades to spreadsheets within a quarter.

That's why scan UX matters more than it looks. It's not "make the form pretty" — it's "make sure the data the rest of the system depends on actually shows up." The way to think about scan workflows isn't as forms; think of them as the place where physical reality enters the data model. If they're slow, ugly, or confusing, the data model is downstream of vibes.

## What you're building, in one sentence

The operational layer between a physical world full of barcodes and an organization that needs to know — for legal, financial, and operational reasons — where its stuff is and who has it.

## Things real systems also do that this challenge skips

Useful framing for what's *not* in scope but would exist in production:

- **Parent-child / bill-of-materials.** A chassis with serialized blades; replacing one blade should track the swap as a custody event on both the parent and the child. The challenge ignores this; the data model has a `parent_asset_tag` field as a hint that the real version doesn't.
- **Tag inventory management.** Real systems separately track barcode tags as their own assets: printed, allocated to a site, applied to a real asset, lost, damaged. None of that is here.
- **Custody chain.** Every state change in production carries `from_custodian → to_custodian` with badge-scan evidence on both sides. Here, the `user_id` field is a soft version.
- **Offline tolerance.** Real DCs have spotty wifi at the rack. Real systems queue scans locally and sync. Out of scope here — you can assume connectivity.
- **Bidirectional integration.** A production version pushes events into the finance ERP (capitalize on deploy, retire on dispose) and writes location updates into the facilities system. Here, the mocks are read-only.

You don't need to handle any of that. But if a design decision you make would *prevent* a future version from layering it on, that's worth flagging in your README.
