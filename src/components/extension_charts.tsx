import { Action, ActionPanel, Detail, Icon, List } from "@raycast/api";
import plot from "simple-ascii-chart";
import { Coordinates } from "simple-ascii-chart/dist/types";
import { ReactElement, useState } from "react";
import { Extension, getGrowthPercentage, getUserRaycastPageURL, useExtensions } from "../lib/extensions";
import { compactNumberFormat } from "../lib/utils";
import { combineUserData, ShowAuthorDetailAction, UserData } from "./author_charts";

function InstallAction(props: { extension: Extension }): JSX.Element {
  const e = props.extension;
  const url = `raycast://extensions/${e.author.handle}/${e.name}?source=webstore`;
  return <Action.Open title="Install Extension" target={url} icon={{ source: Icon.Download }} />;
}

export function sortExtensionByDownloads(extensions: Extension[] | undefined): Extension[] | undefined {
  if (!extensions) {
    return undefined;
  }
  const exts = extensions.sort((a, b) => b.download_count - a.download_count);
  return exts;
}

export function ExtensionListItem(props: {
  extension: Extension;
  index?: number | undefined;
  authorData?: UserData | undefined;
}): ReactElement {
  const e = props.extension;
  const index = props.index !== undefined ? `${props.index + 1}.` : undefined;
  const growthPerc = getGrowthPercentage(e.growth_last_day);
  const growthInstalls = e.growth_last_day?.download_count;
  const growthText =
    growthPerc !== undefined && growthInstalls !== undefined
      ? `${growthInstalls} Installs (+${growthPerc.toFixed(2)}%)`
      : undefined;
  return (
    <List.Item
      icon={
        e.icons
          ? {
              value: { source: { light: e.icons?.light || "", dark: e.icons?.dark || "" } },
              tooltip: e.author?.name || "",
            }
          : undefined
      }
      title={e.title}
      subtitle={index}
      accessories={[
        { icon: Icon.Download, text: `${compactNumberFormat(e.download_count)}`, tooltip: growthText },
        { icon: e.author.avatar || Icon.Person, tooltip: e.author.name },
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <ShowDetailAction extension={e} />
            <ShowAuthorDetailAction user={props.authorData} />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.OpenInBrowser url={e.store_url} />
            <OpenReadmeInBrowserAction extension={e} />
            <OpenSourceInBrowserAction extension={e} />
            <InstallAction extension={e} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

const sortMap: Record<string, (a: Extension, b: Extension) => number> = {
  "Total Installs": (a, b) => b.download_count - a.download_count,
  "Last Day Installs": (a, b) => (b.growth_last_day?.download_count || 0) - (a.growth_last_day?.download_count || 0),
  "Last Day Growth": (a, b) =>
    (b.growth_last_day?.download_change_percentage || 0) - (a.growth_last_day?.download_change_percentage || 0),
  "Last Week Installs": (a, b) => (b.growth_last_week?.download_count || 0) - (a.growth_last_week?.download_count || 0),
  "Last Week Growth": (a, b) =>
    (b.growth_last_week?.download_change_percentage || 0) - (a.growth_last_week?.download_change_percentage || 0),
};

export function ExtensionList(props: {
  extensions: Extension[] | undefined;
  isLoading?: boolean | undefined;
}): ReactElement {
  const [sortmode, setSortmode] = useState<string>("Total Installs");
  const rawExtensions = props.extensions;
  const totalInstalls = rawExtensions ? rawExtensions.reduce((total, c) => total + c.download_count, 0) : 0;
  const installsLastDay = rawExtensions
    ? rawExtensions.reduce((total, c) => total + (c.growth_last_day?.download_count || 0), 0)
    : 0;
  const usersData = combineUserData(rawExtensions);
  const extensions = rawExtensions?.sort(sortMap[sortmode]);
  return (
    <List
      isLoading={props.isLoading}
      searchBarAccessory={
        <List.Dropdown tooltip="" onChange={setSortmode}>
          {Object.keys(sortMap).map((k) => (
            <List.Dropdown.Item key={k} title={k} value={k} />
          ))}
        </List.Dropdown>
      }
    >
      <List.Section
        title={`Extensions ${extensions?.length} (${compactNumberFormat(
          totalInstalls
        )} Installs, yesterday +${installsLastDay})`}
      >
        {extensions?.map((e, index) => (
          <ExtensionListItem
            key={e.id}
            extension={e}
            index={index}
            authorData={usersData?.find((u) => u.author.handle === e.author.handle)}
          />
        ))}
      </List.Section>
    </List>
  );
}

export function ExtensionChartsPerDownload(): JSX.Element {
  const { extensions, isLoading } = useExtensions();
  const exts = sortExtensionByDownloads(extensions);
  return <ExtensionList extensions={exts} isLoading={isLoading} />;
}

function OpenReadmeInBrowserAction(props: { extension: Extension }): ReactElement {
  return (
    <Action.OpenInBrowser
      title="Open Readme in Browser"
      icon={{ source: Icon.TextDocument }}
      url={props.extension.readme_url}
    />
  );
}

function OpenSourceInBrowserAction(props: { extension: Extension }): ReactElement {
  return (
    <Action.OpenInBrowser
      title="Open Source Code in Browser"
      icon={{ source: Icon.Document }}
      url={props.extension.source_url}
    />
  );
}

function ShowDetailAction(props: { extension: Extension }): ReactElement {
  return (
    <Action.Push
      icon={{ source: Icon.Terminal }}
      title="Show Extension"
      target={<ExtensionDetail extension={props.extension} />}
    />
  );
}

function InstallsMetaData1Day(props: { extension: Extension }): ReactElement | null {
  const e = props.extension;
  const g = e.growth_last_day;
  const text = g ? `${g.download_count} (+${getGrowthPercentage(g)?.toFixed(3)}%)` : "no data";
  return <Detail.Metadata.Label title="Installs Previous Day" text={text} />;
}

function InstallsMetaData7Days(props: { extension: Extension }): ReactElement | null {
  const e = props.extension;
  const g = e.growth_last_week;
  const text = g ? `${g.download_count} (+${getGrowthPercentage(g)?.toFixed(3)}%)` : "no data";
  return <Detail.Metadata.Label title="Installs last 7 days" text={text} />;
}

function getDownloadsGraph(extension: Extension): string | undefined {
  if (!extension.previous_days_downloads || extension.previous_days_downloads.length < 2) {
    return undefined;
  }
  const codefence = (text: string): string => {
    return "```\n" + text + "\n```";
  };
  const coords: Coordinates = extension.previous_days_downloads.map((v, i) => [i, v]);
  const chart = plot(coords, {
    height: 12,
    width: 60,
    hideXAxis: true,
    formatter: (value) => {
      if (Math.abs(value) > 1000) {
        return `${Math.round(value / 1000)}k`;
      }
      return value;
    },
  });
  return codefence(chart);
}

function ExtensionDetail(props: { extension: Extension }): ReactElement {
  const e = props.extension;

  const parts: string[] = [`# ${e.title}`, e.description];
  const downloadGraph = getDownloadsGraph(e);
  if (downloadGraph) {
    parts.push(downloadGraph);
  }
  parts.push(`## Commands (${e.commands.length})`);
  for (const cmd of e.commands) {
    parts.push(`### ${cmd.title}\n\n${cmd.description}`);
  }
  const md = parts.join("\n  ");
  return (
    <Detail
      markdown={md}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Link title="Author" target={getUserRaycastPageURL(e.author)} text={e.author.name} />
          <Detail.Metadata.Label title="Total Installs" text={`${e.download_count}`} />
          <InstallsMetaData1Day extension={e} />
          <InstallsMetaData7Days extension={e} />
          <Detail.Metadata.TagList title="Categories">
            {e.categories?.map((c, i) => (
              <Detail.Metadata.TagList.Item key={i} text={c} />
            ))}
          </Detail.Metadata.TagList>
          <Detail.Metadata.TagList title="Contributors">
            {e.contributors?.map((c) => (
              <Detail.Metadata.TagList.Item key={c.name} text={c.name} icon={c.avatar} />
            ))}
          </Detail.Metadata.TagList>
          <Detail.Metadata.Link title="Readme" target={e.readme_url} text="Open README" />
          <Detail.Metadata.Link title="Source Code" target={e.source_url} text="View Source" />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <InstallAction extension={e} />
            <Action.OpenInBrowser url={e.store_url} />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <OpenReadmeInBrowserAction extension={e} />
            <OpenSourceInBrowserAction extension={e} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    ></Detail>
  );
}
