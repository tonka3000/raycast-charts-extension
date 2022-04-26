import { Action, ActionPanel, Detail, Icon, List } from "@raycast/api";
import { ReactElement } from "react";
import { Extension, getUserRaycastPageURL, useExtensions } from "../lib/extensions";
import { compactNumberFormat } from "../lib/utils";

function InstallAction(props: { extension: Extension }): JSX.Element {
  const e = props.extension;
  const url = `raycast://extensions/${e.author.handle}/${e.name}?source=webstore`;
  return <Action.Open title="Install Extension" target={url} icon={{ source: Icon.Download }} />;
}

function sort(extensions: Extension[] | undefined): Extension[] | undefined {
  if (!extensions) {
    return undefined;
  }
  const exts = extensions.sort((a, b) => b.download_count - a.download_count);
  return exts;
}

export function ExtensionChartsPerDownload(): JSX.Element {
  const { extensions, isLoading } = useExtensions();
  const exts = sort(extensions);
  const totalInstalls = extensions ? extensions.reduce((total, c) => total + c.download_count, 0) : 0;
  return (
    <List isLoading={isLoading}>
      <List.Section title={`Extensions ${extensions?.length} (${compactNumberFormat(totalInstalls)} Installs)`}>
        {exts?.map((e, index) => (
          <List.Item
            key={e.id}
            icon={{ source: { light: e.icons.light || "", dark: e.icons.dark || "" } }}
            title={e.name}
            subtitle={`${index + 1}.`}
            accessories={[{ text: `${compactNumberFormat(e.download_count)}` }]}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <ShowDetailAction extension={e} />
                  <Action.OpenInBrowser url={e.store_url} />
                </ActionPanel.Section>
                <ActionPanel.Section>
                  <OpenReadmeInBrowserAction extension={e} />
                  <OpenSourceInBrowserAction extension={e} />
                  <InstallAction extension={e} />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}

function OpenReadmeInBrowserAction(props: { extension: Extension }): ReactElement {
  return <Action.OpenInBrowser title="Open Readme in Browser" url={props.extension.readme_url} />;
}

function OpenSourceInBrowserAction(props: { extension: Extension }): ReactElement {
  return <Action.OpenInBrowser title="Open Source in Browser" url={props.extension.source_url} />;
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

function ExtensionDetail(props: { extension: Extension }): ReactElement {
  const e = props.extension;
  const parts: string[] = [`# ${e.name}`, e.description];
  parts.push(`## Commands (${e.commands.length})`);
  for (const cmd of e.commands) {
    parts.push(`### ${cmd.title}\n\n${e.description}`);
  }
  const md = parts.join("\n  ");
  return (
    <Detail
      markdown={md}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Link title="Author" target={getUserRaycastPageURL(e.author)} text={e.author.name} />
          <Detail.Metadata.Label title="Installs" text={`${e.download_count}`} />
          <Detail.Metadata.TagList title="Categories">
            {e.categories?.map((c) => (
              <Detail.Metadata.TagList.Item text={c} />
            ))}
          </Detail.Metadata.TagList>
          <Detail.Metadata.TagList title="Contributors">
            {e.contributors?.map((c) => (
              <Detail.Metadata.TagList.Item key={c.name} text={c.name} />
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
