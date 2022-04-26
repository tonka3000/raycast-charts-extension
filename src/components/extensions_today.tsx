import { List } from "@raycast/api";
import { useExtensions } from "../lib/extensions";
import { unixTimestampToDate } from "../lib/utils";
import { combineUserData } from "./author_charts";
import { ExtensionList, ExtensionListItem, sortExtensionByDownloads } from "./extension_charts";

export function ExtensionUpdatesToday(): JSX.Element {
  const { extensions, isLoading } = useExtensions();
  const exts = sortExtensionByDownloads(extensions);
  const usersData = combineUserData(extensions);
  const today = new Date();
  const ts = today.toDateString();
  const newExts = exts?.filter((e) => unixTimestampToDate(e.created_at).toDateString() === ts);
  const updatedExts = exts?.filter((e) => unixTimestampToDate(e.updated_at).toDateString() === ts);
  return (
    <List isLoading={isLoading}>
      <List.Section title={`New (${newExts?.length})`}>
        {newExts?.map((e) => (
          <ExtensionListItem extension={e} authorData={usersData?.find((u) => u.author.handle === e.author.handle)} />
        ))}
      </List.Section>
      <List.Section title={`Updated (${updatedExts?.length})`}>
        {updatedExts?.map((e) => (
          <ExtensionListItem extension={e} authorData={usersData?.find((u) => u.author.handle === e.author.handle)} />
        ))}
      </List.Section>
    </List>
  );
}
