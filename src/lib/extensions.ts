import fetch from "node-fetch";
import useSWR from "swr";

export interface User {
  name: string;
  handle: string;
  avatar?: string;
  twitter_handle?: string | null | undefined;
  github_handle?: string | null | undefined;
  location?: string | null | undefined;
  website?: string | null | undefined;
  bio?: string | null | undefined;
}

export interface Command {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface Icons {
  light: string | null | undefined;
  dark: string | null | undefined;
}

export interface ExtensionGrowth {
  download_count: number;
  download_change_percentage: number;
}

export interface Extension {
  id: string;
  name: string;
  download_count: number;
  author: User;
  owner: User;
  store_url: string;
  icons: Icons | undefined;
  description: string;
  categories?: string[];
  commands: Command[];
  contributors?: User[] | undefined;
  source_url: string;
  readme_url: string;
  created_at: number;
  updated_at: number;
  title: string;
  growth_last_day?: ExtensionGrowth | undefined;
  growth_last_week?: ExtensionGrowth | undefined;
  previous_days_downloads?: number[];
}

export interface Data {
  data: Extension[];
}

export interface ExtensionHistoryState {
  name: string;
  created_at: number;
  updated_at: number;
  download_count: number;
}

export interface ExtensionMetaInfo {
  name: string;
  previous_days_downloads?: number[];
}

function calculateHistoryDelta(
  extName: string,
  newer: ExtensionHistoryState[] | undefined,
  older: ExtensionHistoryState[] | undefined
): ExtensionGrowth | undefined {
  if (!newer || !older || extName.length <= 0) {
    return undefined;
  }
  const n = newer.find((d) => d.name === extName);
  const o = older.find((d) => d.name === extName);
  if (!n || !o) {
    return undefined;
  }
  const growth: ExtensionGrowth = {
    download_count: n.download_count - o.download_count,
    download_change_percentage: n.download_count / o.download_count,
  };
  return growth;
}

export function getGrowthPercentage(growth: ExtensionGrowth | undefined): number | undefined {
  if (!growth) {
    return undefined;
  }
  return (growth.download_change_percentage - 1) * 100;
}

async function fetchExtensions(): Promise<any> {
  const historyBaseURL = "https://github.com/tonka3000/rc-history/blob/master";
  const toURLDate = (date: Date): string => {
    const dt = date.toISOString().slice(0, 10).split("-").join("/");
    return `${historyBaseURL}/data/${dt}.json?raw=true`;
  };
  const fetchData = async (): Promise<ExtensionHistoryState[][]> => {
    const now = new Date();
    const day1 = subtractDay(now, 1);
    const day2 = subtractDay(now, 2);
    const day7 = subtractDay(now, 7);
    const urls: string[] = [toURLDate(day1), toURLDate(day2), toURLDate(day7)];
    const ddd = await Promise.all(
      urls.map((url) =>
        fetch(url).then((res) => {
          if (res.ok) {
            return res.json();
          }
        })
      )
    );
    return ddd.map((d) => d as ExtensionHistoryState[] | []);
  };
  const extsData = await fetch("https://www.raycast.com/api/v1/store_listings?per_page=2000&include_native=true").then(
    (res) => res.json()
  );
  if (!extsData) {
    return undefined;
  }
  const exts = (extsData as any).data as Extension[];
  const history = await fetchData();
  for (const e of exts) {
    const lastDay = calculateHistoryDelta(e.name, history[0], history[1]);
    e.growth_last_day = lastDay;
    const lastWeek = calculateHistoryDelta(e.name, history[1], history[2]);
    e.growth_last_week = lastWeek;
  }

  const extsMetaInfo = await fetch(`${historyBaseURL}/extensions.json?raw=true`).then((res) =>
    res.ok ? res.json() : undefined
  );
  if (extsMetaInfo) {
    const infos = extsMetaInfo as ExtensionMetaInfo[];
    for (const e of exts) {
      const info = infos.find((el) => el.name === e.name);
      if (info && info.previous_days_downloads) {
        e.previous_days_downloads = [...info.previous_days_downloads, e.download_count];
      }
    }
  }

  return exts;
}

export function useExtensions(): { extensions: Extension[] | undefined; isLoading: boolean } {
  const { data, error } = useSWR<Extension[] | undefined>("extensions", fetchExtensions);
  const isLoading = !data;
  const extensions = data;
  return { extensions, isLoading };
}

function subtractDay(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(date.getDate() - days);
  return result;
}

export function getUserRaycastPageURL(user: User): string {
  return `https://www.raycast.com/${user.handle}`;
}
