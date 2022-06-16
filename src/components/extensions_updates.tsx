import { List } from "@raycast/api";
import { useState } from "react";
import { Extension, useExtensions } from "../lib/extensions";
import { unixTimestampToDate } from "../lib/utils";
import { combineUserData } from "./author_charts";
import { ExtensionListItem, sortExtensionByDownloads } from "./extension_charts";

function filterToday(extensions: Extension[] | undefined): {
  newExts: Extension[] | undefined;
  updatedExts: Extension[] | undefined;
} {
  let newExts: Extension[] | undefined = undefined;
  let updatedExts: Extension[] | undefined = undefined;
  if (extensions) {
    const today = new Date();
    const ts = today.toDateString();
    newExts = extensions?.filter((e) => unixTimestampToDate(e.created_at).toDateString() === ts);
    updatedExts = extensions?.filter((e) => unixTimestampToDate(e.updated_at).toDateString() === ts);
  }
  return { newExts, updatedExts };
}

function filterByDays(
  extensions: Extension[] | undefined,
  days: number
): {
  newExts: Extension[] | undefined;
  updatedExts: Extension[] | undefined;
} {
  let newExts: Extension[] | undefined = undefined;
  let updatedExts: Extension[] | undefined = undefined;
  if (extensions) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    newExts = extensions?.filter((e) => unixTimestampToDate(e.created_at) >= since);
    updatedExts = extensions?.filter((e) => unixTimestampToDate(e.updated_at) >= since);
  }
  return { newExts, updatedExts };
}

const filterMap: Record<
  string,
  (exts: Extension[] | undefined) => {
    newExts: Extension[] | undefined;
    updatedExts: Extension[] | undefined;
  }
> = {
  today: filterToday,
  "1_day": (exts) => filterByDays(exts, 1),
  "2_days": (exts) => filterByDays(exts, 2),
  "3_days": (exts) => filterByDays(exts, 3),
  "7_days": (exts) => filterByDays(exts, 7),
};

export function ExtensionUpdatesToday(): JSX.Element {
  const { extensions, isLoading } = useExtensions();
  const [filterMode, setFilterMode] = useState<string>("today");
  const exts = sortExtensionByDownloads(extensions);
  const usersData = combineUserData(extensions);
  const { newExts, updatedExts } = filterMap[filterMode](exts);
  return (
    <List
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown tooltip="" onChange={setFilterMode} storeValue>
          <List.Dropdown.Item title="Today" value="today" />
          <List.Dropdown.Item title="1 Day" value="1_day" />
          <List.Dropdown.Item title="2 Days" value="2_days" />
          <List.Dropdown.Item title="3 Days" value="3_days" />
          <List.Dropdown.Item title="7 Days" value="7_days" />
        </List.Dropdown>
      }
    >
      <List.Section title={`New (${newExts?.length})`}>
        {newExts?.map((e) => (
          <ExtensionListItem
            key={e.id}
            extension={e}
            authorData={usersData?.find((u) => u.author.handle === e.author.handle)}
          />
        ))}
      </List.Section>
      <List.Section title={`Updated (${updatedExts?.length})`}>
        {updatedExts?.map((e) => (
          <ExtensionListItem
            key={e.id}
            extension={e}
            authorData={usersData?.find((u) => u.author.handle === e.author.handle)}
          />
        ))}
      </List.Section>
    </List>
  );
}
