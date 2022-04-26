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

export interface Extension {
  id: string;
  name: string;
  download_count: number;
  author: User;
  owner: User;
  store_url: string;
  icons: Icons;
  description: string;
  categories?: string[];
  commands: Command[];
  contributors?: User[] | undefined;
  source_url: string;
  readme_url: string;
  created_at: number;
  updated_at: number
}

export interface Data {
  data: Extension[];
}

async function fetchExtensions(): Promise<any> {
  return await fetch("https://www.raycast.com/api/v1/store_listings?per_page=2000&include_native=true").then((res) =>
    res.json()
  );
}

export function useExtensions(): { extensions: Extension[] | undefined; isLoading: boolean } {
  const { data, error } = useSWR<Data>("extensions", fetchExtensions);
  const isLoading = !data;
  const extensions = data?.data;

  return { extensions, isLoading };
}

export function getUserRaycastPageURL(user: User): string {
  return `https://www.raycast.com/${user.handle}`;
}
