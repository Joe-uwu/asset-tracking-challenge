import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api-client";

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  try {
    // Fetch all assets from operations with pagination handling
    const operationsAssets = await fetchAllAssets();

    // Fetch data from all three sources
    const [facilitiesRecords, financeRecords] = await Promise.all([
      api.mock.facilities(), // Get facilities data
      api.mock.finance(), // Get finance data
    ]);

    // Create maps for easy lookup
    const facilitiesMap = new Map<string, any>();
    facilitiesRecords.forEach(record => {
      facilitiesMap.set(record.tagged_id, record);
    });

    const financeMap = new Map<string, any>();
    financeRecords.forEach(record => {
      financeMap.set(record.tag, record);
    });

    // Initialize the report structure with the three required categories
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        expected_gap: 0,
        needs_review: 0,
        likely_stale_data: 0
      },
      details: {
        expected_gap: [] as any[],
        needs_review: [] as any[],
        likely_stale_data: [] as any[]
      }
    };

    // Process each operations asset
    operationsAssets.forEach(asset => {
      const facilitiesRecord = facilitiesMap.get(asset.asset_tag);
      const financeRecord = financeMap.get(asset.asset_tag);

      // Determine expected state based on asset.state
      const isExpected = checkExpectedState(asset, facilitiesRecord, financeRecord);

      if (isExpected) {
        // This is expected behavior - no action needed
        report.summary.expected_gap++;
        report.details.expected_gap.push({
          asset_tag: asset.asset_tag,
          reason: getExpectedGapReason(asset, facilitiesRecord, financeRecord),
          operations: {
            state:asset.state,
            location:asset.location,
            custodian:asset.custodian
          },
          facilities: facilitiesRecord ? {
            rack_location:facilitiesRecord.rack_location,
            last_observed:facilitiesRecord.last_observed
          } : null,
          finance: financeRecord ? {
            status:financeRecord.status,
            book_value_usd:financeRecord.book_value_usd,
            site:financeRecord.site
          } : null
        });
      } else {
        // Check if this is likely stale data (recent change not yet propagated)
        const isLikelyStale = checkLikelyStaleData(asset, facilitiesRecord, financeRecord);

        if (isLikelyStale) {
          report.summary.likely_stale_data++;
          report.details.likely_stale_data.push({
            asset_tag:asset.asset_tag,
            reason:getLikelyStaleReason(asset,facilitiesRecord,financeRecord),
            operations:{
              state:asset.state,
              location:asset.location,
              custodian:asset.custodian
            },
            facilities:facilitiesRecord ? {
              rack_location:facilitiesRecord.rack_location,
              last_observed:facilitiesRecord.last_observed
            } : null,
            finance:financeRecord ? {
              status:financeRecord.status,
              book_value_usd:financeRecord.book_value_usd,
              site:financeRecord.site
            } : null
          });
        } else {
          // This needs human review
          report.summary.needs_review++;
          report.details.needs_review.push({
            asset_tag:asset.asset_tag,
            reason:getNeedsReviewReason(asset,facilitiesRecord,financeRecord),
            operations:{
              state:asset.state,
              location:asset.location,
              custodian:asset.custodian
            },
            facilities:facilitiesRecord ? {
              rack_location:facilitiesRecord.rack_location,
              last_observed:facilitiesRecord.last_observed
            } : null,
            finance:financeRecord ? {
              status:financeRecord.status,
              book_value_usd:financeRecord.book_value_usd,
              site:financeRecord.site
            } : null
          });
        }
      }
    });

    // Check for facilities-only assets (phantom items)
    facilitiesRecords.forEach(facRecord => {
      if (!operationsAssets.some(asset => asset.asset_tag === facRecord.tagged_id)) {
        // This is either expected gap (if asset is disposed/retired) or needs review
        const opsAsset = operationsAssets.find(asset => asset.asset_tag === facRecord.tagged_id);
        // Actually, if it's not in operations at all, it's a phantom item - needs review
        report.summary.needs_review++;
        report.details.needs_review.push({
          asset_tag:facRecord.tagged_id,
          reason:"Asset appears in facilities but not in operations (phantom item)",
          operations:null,
          facilities:{
            rack_location:facRecord.rack_location,
            last_observed:facRecord.last_observed
          },
          finance:null
        });
      }
    });

    // Check for finance-only assets
    financeRecords.forEach(finRecord => {
      if (!operationsAssets.some(asset => asset.asset_tag === finRecord.tag)) {
        // This could be expected gap (disposed asset) or needs review
        report.summary.needs_review++;
        report.details.needs_review.push({
          asset_tag:finRecord.tag,
          reason:"Asset appears in finance but not in operations",
          operations:null,
          facilities:null,
          finance:{
            status:finRecord.status,
            book_value_usd:finRecord.book_value_usd,
            site:finRecord.site
          }
        });
      }
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Reconciliation failed:", error);
    return NextResponse.json(
      {
        error: {
          code: "reconciliation_failed",
          message: "Failed to generate reconciliation report",
          details: error instanceof Error ? { message: error.message } : {}
        }
      },
      { status: 500 }
    );
  }
}

// Helper function to fetch all assets with pagination
async function fetchAllAssets(): Promise<any[]> {
  const limit = 100; // Reasonable page size
  let offset = 0;
  let allAssets: any[] = [];

  while (true) {
    try {
      // Fetch a page of assets
      const pageAssets = await api.assets.list({});

      // If we got fewer assets than the limit, we've reached the end
      if (pageAssets.length < limit) {
        allAssets.push(...pageAssets);
        break;
      }

      // Otherwise, add these assets and continue to the next page
      allAssets.push(...pageAssets);
      offset += limit;
    } catch (error) {
      console.warn("Error fetching assets page, breaking pagination:", error);
      // If there's an error, break to avoid infinite loop
      break;
    }
  }

  return allAssets;
}

// Helper functions to categorize discrepancies

function checkExpectedState(
  asset: any,
  facilitiesRecord: any | null,
  financeRecord: any | null
): boolean {
  const { state } = asset;

  // Define expected presence for each state
  switch (state) {
    case "unreceived":
      // Expected: only in operations
      return !facilitiesRecord && !financeRecord;
    case "received":
      // Expected: in operations, not in facilities/finance yet
      return !facilitiesRecord && !financeRecord;
    case "stored":
      // Expected: in operations, not in facilities (in storage), finance may or may not be present
      return !facilitiesRecord; // stored assets should not be in facilities
    case "in_service":
      // Expected: in operations, should be in facilities (racked) and finance (capitalized)
      return !!facilitiesRecord && !!financeRecord;
    case "rma_pending":
      // Expected: in operations, not in facilities (at repair), finance status varies
      return !facilitiesRecord; // RMA pending assets should not be in facilities
    case "disposed":
      // Expected: in operations, not in facilities, finance may show disposed status
      return !facilitiesRecord; // disposed assets should not be in facilities
    default:
      return false;
  }
}

function getExpectedGapReason(
  asset: any,
  facilitiesRecord: any | null,
  financeRecord: any | null
): string {
  const { state } = asset;

  switch (state) {
    case "unreceived":
      return "Asset not yet received into the system";
    case "received":
      return "Asset received but not yet stored or deployed";
    case "stored":
      return "Asset in storage (not currently racked)";
    case "in_service":
      return "Asset actively deployed and synchronized across systems";
    case "rma_pending":
      return "Asset currently undergoing repair/maintenance";
    case "disposed":
      return "Asset has been disposed of or retired";
    default:
      return "Expected state based on asset lifecycle";
  }
}

function checkLikelyStaleData(
  asset: any,
  facilitiesRecord: any | null,
  financeRecord: any | null
): boolean {
  const { state } = asset;

  // Define patterns that suggest recent changes not yet propagated
  switch (state) {
    case "in_service":
      // Recently deployed: in operations as in_service, but not yet in facilities/finance
      return !facilitiesRecord || !financeRecord;
    case "stored":
      // Recently stored from in_service: in operations as stored, but still in facilities
      return !!facilitiesRecord; // Should have been cleared from facilities
    default:
      // For other states, less likely to be stale data issues
      return false;
  }
}

function getLikelyStaleReason(
  asset: any,
  facilitiesRecord: any | null,
  financeRecord: any | null
): string {
  const { state } = asset;

  switch (state) {
    case "in_service":
      return !facilitiesRecord || !financeRecord
        ? "Recently deployed - waiting for facilities/finance synchronization"
        : "Recently deployed - synchronization in progress";
    case "stored":
      return !!facilitiesRecord
        ? "Recently stored from service - waiting for facilities clearance"
        : "Recently stored - synchronization in progress";
    default:
      return "Recent change - synchronization lag expected";
  }
}

function getNeedsReviewReason(
  asset: any,
  facilitiesRecord: any | null,
  financeRecord: any | null
): string {
  const { state } = asset;

  // Check for specific inconsistencies that need human review
  if (state === "in_service") {
    if (!facilitiesRecord) return "Deployed asset missing from facilities (not racked)";
    if (!financeRecord) return "Deployed asset missing from finance (not capitalized)";

    // Check for location mismatch
    if (facilitiesRecord?.rack_location) {
      const expectedLocation = `${asset.location.site}/${asset.location.room || 'Unspecified'}/${asset.location.row || 'Unspecified'}/${asset.location.rack || 'Unspecified'}/${asset.location.ru || 'Unspecified'}`;
      if (facilitiesRecord.rack_location !== expectedLocation) {
        return `Location mismatch: operations says ${expectedLocation}, facilities says ${facilitiesRecord.rack_location}`;
      }
    }

    // Check for finance status mismatch
    if (financeRecord?.status !== "capitalized") {
      return `Finance status mismatch: expected 'capitalized', got '${financeRecord.status}'`;
    }
  }

  if (state === "stored" && facilitiesRecord) {
    return "Stored asset incorrectly appears in facilities (should be in storage only)";
  }

  if (state === "received" && (facilitiesRecord || financeRecord)) {
    return "Received asset incorrectly appears in facilities or finance";
  }

  // Fallback for other cases
  return "Data inconsistency requiring human investigation";
}