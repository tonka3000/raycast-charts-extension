import { getPreferenceValues } from "@raycast/api";

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

const fmt = new Intl.NumberFormat("en", { notation: "compact" });

export function compactNumberFormat(num: number): string {
  const prefs = getPreferenceValues();
  const makeShort = (prefs.showinstallscompact as boolean) || false;
  if (makeShort) {
    return fmt.format(num);
  } else {
    return num.toString();
  }
}

export function unixTimestampToDate(value: number): Date {
  return new Date(value * 1000);
}
