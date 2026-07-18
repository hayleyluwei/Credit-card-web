/**
 * Domain Parsing Module
 * Shared parsing logic for slugs, tags, summaries, and other text fields.
 */

/**
 * Generates a slug from a title string
 * Converts to lowercase, replaces spaces with hyphens, removes special characters
 * @param title - The title to convert to slug
 * @returns slug string
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Parses tags from a comma-separated string
 * Trims whitespace from each tag and removes empty strings
 * @param tagsString - Comma-separated tags or null
 * @returns array of tag strings
 */
export function parseTags(tagsString: string | null | undefined): string[] {
  if (!tagsString) {
    return [];
  }

  return tagsString
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * Converts tags array back to comma-separated string
 * @param tags - Array of tag strings
 * @returns comma-separated string
 */
export function tagsToString(tags: string[]): string {
  return tags.filter((tag) => tag.trim().length > 0).join(", ");
}

/**
 * Parses a JSON string-array field (e.g. Card.prosJson / Card.consJson)
 * Invalid JSON or non-array values return an empty array
 * @param jsonString - JSON string or null
 * @returns array of non-empty strings
 */
export function parseJsonStringArray(jsonString: string | null | undefined): string[] {
  if (!jsonString) {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  } catch {
    return [];
  }
}

/**
 * Converts multiline textarea input (one item per line) to a JSON string array
 * @param linesText - Raw textarea value
 * @returns JSON string of the array, or null when no non-empty lines
 */
export function linesToJsonArray(linesText: string | null | undefined): string | null {
  if (!linesText) {
    return null;
  }

  const items = linesText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return items.length > 0 ? JSON.stringify(items) : null;
}

/**
 * Converts a JSON string-array field back to multiline text for textarea editing
 * @param jsonString - JSON string or null
 * @returns newline-joined string
 */
export function jsonArrayToLines(jsonString: string | null | undefined): string {
  return parseJsonStringArray(jsonString).join("\n");
}

/**
 * Resolves the summary preview for an offer
 * Priority: manualSummary > (highlight1 + highlight2) > summaryPreview > title
 * @param offer - Offer object with summary fields
 * @returns resolved summary string
 */
export function resolveSummaryPreview(offer: {
  manualSummary?: string | null;
  highlight1?: string | null;
  highlight2?: string | null;
  summaryPreview?: string | null;
  title?: string;
}): string {
  // Priority 1: manual summary
  if (offer.manualSummary && offer.manualSummary.trim()) {
    return offer.manualSummary.trim();
  }

  // Priority 2: highlight1 + highlight2
  if (offer.highlight1 && offer.highlight1.trim()) {
    if (offer.highlight2 && offer.highlight2.trim()) {
      return `${offer.highlight1}、${offer.highlight2}`;
    }
    return offer.highlight1.trim();
  }

  if (offer.highlight2 && offer.highlight2.trim()) {
    return offer.highlight2.trim();
  }

  // Priority 3: summaryPreview
  if (offer.summaryPreview && offer.summaryPreview.trim()) {
    return offer.summaryPreview.trim();
  }

  // Priority 4: title
  if (offer.title && offer.title.trim()) {
    return offer.title.trim();
  }

  return "";
}

/**
 * Generates system-derived summary from offer fields
 * Combines title with key offer details
 * @param offer - Offer object
 * @returns generated summary string
 */
export function generateSystemSummary(offer: {
  title?: string;
  highlight1?: string | null;
  highlight2?: string | null;
  rewardValue?: string | null;
}): string {
  const parts: string[] = [];

  if (offer.title) {
    parts.push(offer.title);
  }

  if (offer.highlight1) {
    parts.push(offer.highlight1);
  }

  return parts.join("，");
}
