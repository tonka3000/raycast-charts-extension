import { Action, ActionPanel, Detail, Icon, List } from "@raycast/api";
import { ReactElement, useState } from "react";
import {
  Extension,
  ExtensionGrowth,
  getGrowthPercentage,
  getUserRaycastPageURL,
  useExtensions,
  User,
} from "../lib/extensions";
import { compactNumberFormat } from "../lib/utils";
import { ExtensionList, sortExtensionByDownloads } from "./extension_charts";

export interface UserData {
  author: User;
  download_count: number;
  growth_last_day: ExtensionGrowth;
  growth_last_week: ExtensionGrowth;
  extensions: Extension[];
}

export function combineUserData(extenions: Extension[] | undefined): UserData[] | undefined {
  if (!extenions) {
    return undefined;
  }
  const result: Record<string, UserData> = {};
  for (const e of extenions) {
    const a = e.author;
    const h = e.author.handle;
    if (h in result) {
      result[h].download_count += e.download_count;
      result[h].growth_last_day.download_count += e.growth_last_day?.download_count || 0;
      result[h].growth_last_day.download_change_percentage *= e.growth_last_day?.download_change_percentage || 1;
      result[h].growth_last_week.download_count += e.growth_last_week?.download_count || 0;
      result[h].growth_last_week.download_change_percentage *= e.growth_last_week?.download_change_percentage || 1;
      result[h].extensions.push(e);
    } else {
      result[h] = {
        author: a,
        download_count: e.download_count,
        extensions: [e],
        growth_last_day: {
          download_count: e.growth_last_day?.download_count || 0,
          download_change_percentage: e.growth_last_day?.download_change_percentage || 1,
        },
        growth_last_week: {
          download_count: e.growth_last_week?.download_count || 0,
          download_change_percentage: e.growth_last_week?.download_change_percentage || 1,
        },
      };
    }
  }
  const ar: UserData[] = Object.keys(result).map((k) => {
    return result[k];
  });
  return ar;
}

const sortMap: Record<string, (a: UserData, b: UserData) => number> = {
  "Total Installs": (a, b) => b.download_count - a.download_count,
  "Last Day Installs": (a, b) => b.growth_last_day.download_count - a.growth_last_day.download_count,
  "Last Day Growth": (a, b) =>
    b.growth_last_day.download_change_percentage - a.growth_last_day.download_change_percentage,
  "Last Week Installs": (a, b) => b.growth_last_week.download_count - a.growth_last_week.download_count,
  "Last Week Growth": (a, b) =>
    b.growth_last_week.download_change_percentage - a.growth_last_week.download_change_percentage,
};

export function AuthorChartsPerDownload(): JSX.Element {
  const { extensions, isLoading } = useExtensions();
  const usersRaw = combineUserData(extensions);
  const [sortmode, setSortmode] = useState<string>("Total Installs");

  const users = usersRaw?.sort(sortMap[sortmode]);
  return (
    <List
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown tooltip="" onChange={setSortmode}>
          {Object.keys(sortMap).map((k) => (
            <List.Dropdown.Item key={k} title={k} value={k} />
          ))}
        </List.Dropdown>
      }
    >
      <List.Section title={`Authors ${users?.length || 0}`}>
        {users?.map((u, index) => (
          <List.Item
            key={u.author.handle}
            title={u.author.name}
            subtitle={`${index + 1}.`}
            icon={{ source: u.author.avatar || "" }}
            accessories={[
              {
                text: `${compactNumberFormat(u.download_count)}`,
                tooltip: `${u.growth_last_day.download_count} Installs (+${getGrowthPercentage(
                  u.growth_last_day
                )?.toFixed(2)}%)`,
              },
            ]}
            actions={
              <ActionPanel>
                <ShowAuthorDetailAction user={u} />
                <OpenUserInBrowser user={u} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}

function OpenUserInBrowser(props: { user: UserData }): ReactElement {
  return <Action.OpenInBrowser url={getUserRaycastPageURL(props.user.author)} />;
}

export function ShowAuthorDetailAction(props: { user: UserData | undefined }): ReactElement | null {
  if (props.user) {
    return (
      <Action.Push title="Show Author" icon={{ source: Icon.Person }} target={<AuthorDetail user={props.user} />} />
    );
  }
  return null;
}

function AuthorDetail(props: { user: UserData }): ReactElement {
  const u = props.user;
  const a = u.author;
  const parts: string[] = [`# ${a.name}`];
  if (a.bio) {
    parts.push(`${a.bio}`);
  }

  if (a.avatar) {
    parts.push(`![avatar}](${a.avatar})`);
  }

  const md = parts.join("\n\n  ");
  return (
    <Detail
      markdown={md}
      metadata={
        <Detail.Metadata>
          <RaycastLink user={a} />
          <Location user={a} />
          <WebsiteLink user={a} />
          <TwitterLink user={a} />
          <GitHubLink user={a} />
          <InstallsMetaData1Day user={u} />
          <InstallsMetaData7Day user={u} />
          <Detail.Metadata.TagList title={`Extensions (${u.extensions.length})`}>
            {u.extensions?.map((e) => (
              <Detail.Metadata.TagList.Item key={e.id} text={e.title} />
            ))}
          </Detail.Metadata.TagList>
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <ShowExtensionsAction user={u} />
          <OpenUserInBrowser user={u} />
        </ActionPanel>
      }
    />
  );
}

function RaycastLink(props: { user: User }): ReactElement | null {
  const user = props.user;
  if (user.handle) {
    return <Detail.Metadata.Link title="Username" text={user.handle} target={getUserRaycastPageURL(user)} />;
  } else {
    return null;
  }
}

function InstallsMetaData1Day(props: { user: UserData }): ReactElement | null {
  const user = props.user;
  if (user.growth_last_day !== undefined) {
    return (
      <Detail.Metadata.Label
        title="Installs Previous Day"
        text={`${user.growth_last_day.download_count} (+${user.growth_last_day.download_change_percentage.toFixed(
          3
        )}%)`}
      />
    );
  } else {
    return null;
  }
}

function InstallsMetaData7Day(props: { user: UserData }): ReactElement | null {
  const user = props.user;
  if (user.growth_last_day !== undefined) {
    return (
      <Detail.Metadata.Label
        title="Installs last 7 days"
        text={`${user.growth_last_week.download_count} (+${user.growth_last_week.download_change_percentage.toFixed(
          3
        )}%)`}
      />
    );
  } else {
    return null;
  }
}

function Location(props: { user: User }): ReactElement | null {
  const user = props.user;
  if (user.location) {
    return <Detail.Metadata.Label title="Location" text={`${user.location}`} />;
  } else {
    return null;
  }
}

function WebsiteLink(props: { user: User }): ReactElement | null {
  const user = props.user;
  if (user.website) {
    return <Detail.Metadata.Link title="Website" text={user.website} target={user.website} />;
  } else {
    return null;
  }
}

function TwitterLink(props: { user: User }): ReactElement | null {
  const user = props.user;
  if (user.twitter_handle) {
    return (
      <Detail.Metadata.Link
        title="Twitter"
        text={`${user.twitter_handle}`}
        target={`https://twitter.com/${user.twitter_handle}`}
      />
    );
  } else {
    return null;
  }
}

function GitHubLink(props: { user: User }): ReactElement | null {
  const user = props.user;
  if (user.github_handle) {
    return (
      <Detail.Metadata.Link
        title="GitHub"
        text={`${user.github_handle}`}
        target={`https://github.com/${user.github_handle}`}
      />
    );
  } else {
    return null;
  }
}

function ShowExtensionsAction(props: { user: UserData }): ReactElement {
  const exts = sortExtensionByDownloads(props.user.extensions);
  return (
    <Action.Push
      title="Show Extensions"
      icon={{ source: Icon.Terminal }}
      target={<ExtensionList extensions={exts} />}
    />
  );
}
