// services/ApiService.ts
import { encode as btoa } from "base-64";
import { Alert } from "react-native";
import {
  BASIC_AUTH_PASSWORD,
  BASIC_AUTH_USER,
  DealFormData,
  Mode,
  NormalizedResult,
  RegularFormData,
  SharedFormData,
  WEBHOOK_URL_FULL,
} from "../constants/AppConstants";
import {
  extractNamesFromResultsArray,
  formatDateISO,
  normalizeResult,
  parseSuggestionsFromWrapper,
} from "../utils/AppUtils";

export class ApiService {
  private static getAuthHeader(): string {
    return BASIC_AUTH_USER && BASIC_AUTH_PASSWORD
      ? "Basic " + btoa(`${BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD}`)
      : "";
  }

  static async submitEntry(
    mode: Mode,
    regularData: RegularFormData,
    dealData: DealFormData,
    sharedData: SharedFormData
  ): Promise<boolean> {
    if (!mode || !sharedData.dealDate || !sharedData.status) {
      Alert.alert("Missing fields", "Please fill all required fields.");
      return false;
    }

    // Build payload to match webhook expectations
    let payload: any = {};
    if (mode === "regular") {
      if (!regularData.senderName.trim() || !regularData.receiverName.trim()) {
        Alert.alert("Missing fields", "Please fill Sender and Receiver names.");
        return false;
      }
      payload = {
        type: "regular",
        senderName: regularData.senderName.trim(),
        receiverName: regularData.receiverName.trim(),
        amountTransferred: (regularData.amountTransferred || "0").trim(),
        dealDate: formatDateISO(sharedData.dealDate),
        status: sharedData.status.toString().trim(),
      };
    } else if (mode === "deal") {
      if (!dealData.dealer.trim() || !dealData.customer.trim()) {
        Alert.alert("Missing fields", "Please fill Dealer and Customer names.");
        return false;
      }
      payload = {
        type: "deal",
        dealer: dealData.dealer.trim(),
        customer: dealData.customer.trim(),
        amount: (dealData.amount || "0").trim(),
        dealDate: formatDateISO(sharedData.dealDate),
        status: sharedData.status.toString().trim(),
      };
    }

    const authHeader = this.getAuthHeader();

    try {
      const res = await fetch(WEBHOOK_URL_FULL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      if (!res.ok) {
        Alert.alert(`Failed (${res.status})`, text || "Request failed.");
        return false;
      }

      return true;
    } catch (e: any) {
      Alert.alert("Network error", e?.message ?? "Something went wrong.");
      return false;
    }
  }

  // Fetch suggestions (unique names) from server to populate dropdown
  static async fetchSuggestions(): Promise<string[]> {
    try {
      const authHeader = this.getAuthHeader();

      // primary call: tracker/suggestions (n8n function merges both sheets)
      const res = await fetch(`${WEBHOOK_URL_FULL}?path=tracker/suggestions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      });

      if (!res.ok) {
        const txt = await res.text();
        console.warn("suggestions endpoint failed:", res.status, txt);
        // Try fallback to regular tracker endpoint
        return await this.fetchSuggestionsFallback();
      }

      const wrapper = await res.json();
      console.log("Suggestions response wrapper:", wrapper);

      const found = parseSuggestionsFromWrapper(wrapper);
      console.log("Parsed suggestions:", found);

      if (found && found.length) {
        const deduped = Array.from(new Set(found))
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        return deduped;
      }

      // If no suggestions found, try fallback
      return await this.fetchSuggestionsFallback();
    } catch (e: any) {
      console.warn("fetchSuggestions error:", e);
      Alert.alert("Network error", e?.message ?? "Couldn't load suggestions");
      return [];
    }
  }

  // Fallback method to fetch suggestions from tracker endpoint
  private static async fetchSuggestionsFallback(): Promise<string[]> {
    try {
      const authHeader = this.getAuthHeader();

      // fallback: call main tracker endpoint (no q) and extract names from results
      const res = await fetch(`${WEBHOOK_URL_FULL}?path=tracker`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      });

      if (!res.ok) {
        console.warn("fallback tracker endpoint failed:", res.status);
        return [];
      }

      const wrapper = await res.json();
      console.log("Fallback tracker response:", wrapper);

      let resultsArray: any[] = [];

      // Try to extract results from various possible locations
      if (wrapper.upstreamBody) {
        try {
          const upstream =
            typeof wrapper.upstreamBody === "string"
              ? JSON.parse(wrapper.upstreamBody)
              : wrapper.upstreamBody;

          if (Array.isArray(upstream)) {
            resultsArray = upstream;
          } else if (upstream && Array.isArray(upstream.results)) {
            resultsArray = upstream.results;
          } else if (upstream && Array.isArray(upstream.rows)) {
            resultsArray = upstream.rows;
          }
        } catch (e) {
          console.warn("Failed to parse upstreamBody in fallback:", e);
        }
      } else if (Array.isArray(wrapper.results)) {
        resultsArray = wrapper.results;
      } else if (Array.isArray(wrapper.rows)) {
        resultsArray = wrapper.rows;
      } else if (Array.isArray(wrapper)) {
        resultsArray = wrapper;
      }

      console.log("Extracted results for fallback suggestions:", resultsArray);

      const names = extractNamesFromResultsArray(resultsArray);
      const deduped = Array.from(new Set(names))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      return deduped;
    } catch (err) {
      console.warn("fetchSuggestionsFallback error:", err);
      return [];
    }
  }

  // Fetch combined results for a given name q (case-insensitive)
  static async fetchTracker(q: string): Promise<NormalizedResult[]> {
    if (!q || !q.trim()) {
      // Return empty array, let the UI component handle the validation
      return [];
    }

    try {
      const authHeader = this.getAuthHeader();

      // GET /tracker?q=name
      const res = await fetch(
        `${WEBHOOK_URL_FULL}?path=tracker&q=${encodeURIComponent(q.trim())}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        Alert.alert("Failed", txt || `${res.status}`);
        return [];
      }

      // The proxy returns a wrapper, parse it
      const wrapper = await res.json();
      console.log("raw proxy wrapper:", wrapper);

      let results: any[] = [];

      // Extract results from upstreamBody (string or object) or other fields
      if (wrapper.upstreamBody) {
        try {
          const upstream =
            typeof wrapper.upstreamBody === "string"
              ? // sometimes upstreamBody is a stringified JSON; try parse
                (() => {
                  try {
                    return JSON.parse(wrapper.upstreamBody);
                  } catch {
                    // attempt to extract a JSON array substring if wrapper.upstreamBody contains extra text
                    const ub: string = wrapper.upstreamBody;
                    const firstBracket = ub.indexOf("[");
                    const lastBracket = ub.lastIndexOf("]");
                    if (
                      firstBracket !== -1 &&
                      lastBracket !== -1 &&
                      lastBracket > firstBracket
                    ) {
                      const cand = ub.slice(firstBracket, lastBracket + 1);
                      try {
                        return JSON.parse(cand);
                      } catch {
                        return ub;
                      }
                    }
                    return ub;
                  }
                })()
              : wrapper.upstreamBody;

          if (Array.isArray(upstream)) {
            results = upstream;
          } else if (upstream && Array.isArray(upstream.results)) {
            results = upstream.results;
          } else if (upstream && Array.isArray(upstream.rows)) {
            results = upstream.rows;
          } else if (typeof upstream === "object" && upstream !== null) {
            // maybe single object -> wrap
            results = [upstream];
          }
        } catch (e) {
          console.warn("Failed to parse upstreamBody:", e);
        }
      } else if (Array.isArray(wrapper.results)) {
        results = wrapper.results;
      } else if (Array.isArray(wrapper.rows)) {
        results = wrapper.rows;
      } else if (Array.isArray(wrapper)) {
        results = wrapper;
      }

      console.log("Final raw results:", results);

      // Normalize each result so the UI can render predictable keys
      const normalized = results.map((r) => normalizeResult(r));
      console.log("Normalized results:", normalized);
      return normalized;
    } catch (e: any) {
      console.warn("fetchTracker error:", e);
      Alert.alert("Network error", e?.message ?? "Couldn't fetch tracker data");
      return [];
    }
  }
}
