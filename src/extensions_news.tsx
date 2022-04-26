import { SWRConfig } from "swr";
import { cacheConfig } from "./lib/cache";
import { ExtensionUpdatesToday } from "./components/extensions_updates";

export default function ExtensionsTodayRoot(): JSX.Element {
  return (
    <SWRConfig value={cacheConfig}>
      <ExtensionUpdatesToday />
    </SWRConfig>
  );
}
