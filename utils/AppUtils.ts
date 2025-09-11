// utils/AppUtils.ts
import { colors, NormalizedResult, Status } from "../constants/AppConstants";

// Helper functions
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getStatusColor(status: Status | string) {
  switch (status) {
    case "Done":
      return "#27ae60";
    case "Pending":
      return "#f39c12";
    case "Future Task":
      return "#3498db";
    default:
      return colors.primary;
  }
}

// Robust extractor helper
export function extractNamesFromResultsArray(itemsArr: any[]): string[] {
  const names = new Set<string>();
  const dealKeys = ["dealer", "customer"];
  const regularKeys = [
    "senderName",
    "receiverName",
    "sender name",
    "receiver name",
    "sender",
    "receiver",
  ];
  const allKeys = [...dealKeys, ...regularKeys];

  for (const it of itemsArr) {
    const obj = it?.json ?? it;
    if (!obj) continue;

    const lower: Record<string, any> = {};
    for (const k of Object.keys(obj)) {
      lower[k.trim().toLowerCase()] = obj[k];
    }

    for (const key of allKeys) {
      if (lower[key.toLowerCase()]) {
        const name = String(lower[key.toLowerCase()]).trim();
        if (name) names.add(name);
      }
    }
  }
  return Array.from(names).filter(Boolean);
}

// Parse wrapper flexibly and return suggestions array (or empty)
export function parseSuggestionsFromWrapper(wrapper: any): string[] {
  try {
    if (!wrapper) return [];

    let dataToParse: any = wrapper;

    // Proxy wraps upstream response in `upstreamBody` (string or object).
    if (wrapper.upstreamBody) {
      const ub = wrapper.upstreamBody;

      // If it's already an object (proxy may forward parsed JSON), use it.
      if (typeof ub === "object" && ub !== null) {
        dataToParse = ub;
      } else if (typeof ub === "string") {
        // Try smart parsing: 1) direct JSON.parse, 2) extract JSON array substring, 3) fallback to raw string
        try {
          dataToParse = JSON.parse(ub);
        } catch {
          // try to extract first JSON array/object substring
          const firstBracket = ub.indexOf("[");
          const lastBracket = ub.lastIndexOf("]");
          const firstBrace = ub.indexOf("{");
          const lastBrace = ub.lastIndexOf("}");
          if (
            firstBracket !== -1 &&
            lastBracket !== -1 &&
            lastBracket > firstBracket
          ) {
            const candidate = ub.slice(firstBracket, lastBracket + 1);
            try {
              dataToParse = JSON.parse(candidate);
            } catch {
              // try object substring
              if (
                firstBrace !== -1 &&
                lastBrace !== -1 &&
                lastBrace > firstBrace
              ) {
                const cand2 = ub.slice(firstBrace, lastBrace + 1);
                try {
                  dataToParse = JSON.parse(cand2);
                } catch {
                  // leave as string
                  dataToParse = ub;
                }
              } else {
                dataToParse = ub;
              }
            }
          } else {
            dataToParse = ub;
          }
        }
      } else {
        dataToParse = ub;
      }
    }

    // If there's a direct `suggestions` array
    if (dataToParse && Array.isArray((dataToParse as any).suggestions)) {
      const arr = (dataToParse as any).suggestions;
      // if array of strings:
      if (arr.every((a: any) => typeof a === "string")) {
        return arr.map((s: string) => s.trim()).filter(Boolean);
      }
      // if array of objects -> extract names
      return extractNamesFromResultsArray(arr);
    }

    // If top-level is an array (could be array of strings or objects)
    if (Array.isArray(dataToParse)) {
      if (dataToParse.every((a) => typeof a === "string")) {
        return dataToParse.map((s: string) => s.trim()).filter(Boolean);
      }
      return extractNamesFromResultsArray(dataToParse);
    }

    // If it contains `results` or `rows`
    if (dataToParse && Array.isArray((dataToParse as any).results)) {
      return extractNamesFromResultsArray((dataToParse as any).results);
    }
    if (dataToParse && Array.isArray((dataToParse as any).rows)) {
      return extractNamesFromResultsArray((dataToParse as any).rows);
    }

    // deeper inspection: find any nested array and try extracting names
    if (typeof dataToParse === "object" && dataToParse !== null) {
      for (const key in dataToParse) {
        const val = (dataToParse as any)[key];
        if (Array.isArray(val)) {
          const names = extractNamesFromResultsArray(val);
          if (names.length) return names;
        }
      }
    }

    return [];
  } catch (err) {
    console.warn("parseSuggestionsFromWrapper error:", err);
    return [];
  }
}

// Helper to normalize arbitrary upstream result objects to the shape the UI expects.
export function normalizeResult(raw: any): NormalizedResult {
  if (!raw || typeof raw !== "object") return raw;

  // helper to retrieve values from various key forms
  const rawKeys = Object.keys(raw);
  const lowerMap: Record<string, any> = {};
  for (const k of rawKeys) {
    lowerMap[k.trim().toLowerCase()] = raw[k];
  }

  const getVal = (variants: string[]) => {
    for (const v of variants) {
      // try exact key
      if (raw[v] !== undefined) return raw[v];
      // try lowercased match
      const low = v.toLowerCase();
      if (lowerMap[low] !== undefined) return lowerMap[low];
    }
    return undefined;
  };

  const typeRaw = getVal(["type", "Type", "Type "]) ?? getVal(["Type"]);
  const dealerRaw =
    getVal(["dealer", "Dealer", "Dealer Name", "DealerName"]) ?? undefined;
  const customerRaw =
    getVal(["customer", "Customer", "Customer Name", "CustomerName"]) ??
    undefined;
  const senderRaw =
    getVal(["senderName", "sender name", "Sender Name", "sender"]) ?? undefined;
  const receiverRaw =
    getVal(["receiverName", "receiver name", "Receiver Name", "receiver"]) ??
    undefined;
  const amountTransferredRaw =
    getVal([
      "amountTransferred",
      "Amount Transferred",
      "AmountTransferred",
      "amount transferred",
    ]) ?? undefined;
  const amountRaw = getVal(["amount", "Amount"]) ?? undefined;
  const dealDateRaw =
    getVal(["dealDate", "Deal Date", "deal_date", "deal date"]) ?? undefined;
  const statusRaw = getVal(["status", "Status"]) ?? undefined;

  // convert to strings and trim where applicable
  const tidy = (v: any) =>
    v === null || v === undefined ? "" : String(v).trim();

  const normalizedType = (() => {
    const t = tidy(typeRaw);
    if (!t) {
      // infer from presence of dealer/customer vs sender/receiver
      if (dealerRaw || customerRaw) return "Deal";
      return "Regular";
    }
    const lower = t.toLowerCase();
    if (lower.includes("deal")) return "Deal";
    if (lower.includes("regular")) return "Regular";
    return t;
  })();

  return {
    // UI expects these keys:
    type: normalizedType,
    dealDate: tidy(dealDateRaw),
    dealer: tidy(dealerRaw),
    customer: tidy(customerRaw),
    senderName: tidy(senderRaw),
    receiverName: tidy(receiverRaw),
    amountTransferred: tidy(amountTransferredRaw),
    amount: tidy(amountRaw),
    status: tidy(statusRaw),
    // also keep original in case you need it
    __raw: raw,
  };
}
