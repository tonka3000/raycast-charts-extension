import { ActionPanel, Icon, Image, List } from "@raycast/api";
import { Extension, useExtensions } from "./lib/extensions";
import { ShowDetailAction } from "./components/extension_charts";
import { compactNumberFormat } from "./lib/utils";
import { useCachedState } from "@raycast/utils";
import { useEffect, useState } from "react";

const sortFuncs: Record<string, (a: Extension, b: Extension) => number> = {
  newest: (a, b) => b.created_at - a.created_at,
  oldest: (a, b) => a.created_at - b.created_at,
  mostDownloads: (a, b) => b.download_count - a.download_count,
  leastDownloads: (a, b) => a.download_count - b.download_count,
  update: (a, b) => b.updated_at - a.updated_at,
};

function SortListDropDownItem(props: { title: string; value: string; selectedValue: string }) {
  return (
    <List.Dropdown.Item
      icon={props.selectedValue === props.value ? Icon.CircleProgress100 : Icon.Circle}
      title={props.title}
      value={`sort_${props.value}`}
    />
  );
}

function ExtensionDropDown(props: {
  currentSort: string;
  onSortChange: (value: string) => void;
  currentCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
}) {
  const onChange = (value: string) => {
    if (value.startsWith("cat_")) {
      props.onCategoryChange(value.slice(4));
    } else if (value.startsWith("sort_")) {
      props.onSortChange(value.slice(5));
    }
  };
  return (
    <List.Dropdown tooltip="Filter" onChange={onChange} value={`cat_${props.currentCategory}`}>
      <List.Dropdown.Section title="Sort">
        <SortListDropDownItem title="Newest" value="newest" selectedValue={props.currentSort} />
        <SortListDropDownItem title="Oldest" value="oldest" selectedValue={props.currentSort} />
        <SortListDropDownItem title="Most Downloads" value="mostDownloads" selectedValue={props.currentSort} />
        <SortListDropDownItem title="Least Downloads" value="leastDownloads" selectedValue={props.currentSort} />
        <SortListDropDownItem title="Recent Update" value="update" selectedValue={props.currentSort} />
      </List.Dropdown.Section>
      <List.Dropdown.Section title="Categories">
        <List.Dropdown.Item title="All" value="cat_" />
        {props.categories.map((category) => (
          <List.Dropdown.Item key={category} title={category} value={`cat_${category}`} />
        ))}
      </List.Dropdown.Section>
    </List.Dropdown>
  );
}

function ExtensionItem(props: { extension: Extension }) {
  const e = props.extension;
  return (
    <List.Item
      key={e.id}
      icon={{
        source: {
          light: e.icons?.light || e.icons?.dark || "analytics.png",
          dark: e.icons?.dark || e.icons?.light || "analytics.png",
        },
        fallback: "analytics.png",
      }}
      id={e.id}
      title={e.title || e.name}
      keywords={[...(e.categories || []), e.title || e.name]}
      accessories={[
        { icon: Icon.ArrowDownCircle, text: compactNumberFormat(e.download_count) },
        { icon: Icon.MemoryChip, text: e.commands.length.toString() },
        { icon: { source: e.author.avatar ?? Icon.Person, mask: Image.Mask.Circle, fallback: Icon.Person } },
      ]}
      actions={
        <ActionPanel>
          <ShowDetailAction extension={e} />
        </ActionPanel>
      }
    />
  );
}

function getAllCategories(extensions: Extension[] | undefined) {
  if (!extensions) {
    return [];
  }
  const result: string[] = [];
  for (const e of extensions) {
    for (const c of e.categories || []) {
      if (!result.includes(c)) {
        result.push(c);
      }
    }
  }
  return result.sort();
}

export default function StoreCommand() {
  const { extensions: extensionsRaw, isLoading } = useExtensions();
  const categories = getAllCategories(extensionsRaw);
  const [sortBy, setSortBy] = useCachedState("sort-by", "newest");
  const [category, setCategory] = useCachedState("filter-category", "");
  const [selected, setSelected] = useState<string>();

  const extensionsSort = extensionsRaw?.sort(sortFuncs[sortBy]);
  const extensions =
    category.length > 0 ? extensionsSort?.filter((e) => e.categories?.includes(category)) : extensionsSort;

  useEffect(() => {
    if (extensions && extensions.length > 0) {
      setSelected(extensions[0].id);
    }
  }, [sortBy, category]);

  return (
    <List
      isLoading={isLoading}
      selectedItemId={selected}
      searchBarAccessory={
        <ExtensionDropDown
          currentSort={sortBy}
          currentCategory={category}
          onSortChange={setSortBy}
          categories={categories}
          onCategoryChange={setCategory}
        />
      }
    >
      {extensions?.map((e) => <ExtensionItem key={e.id} extension={e} />)}
    </List>
  );
}
