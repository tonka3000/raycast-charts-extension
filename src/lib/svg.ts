import { renderToString } from "react-dom/server";
import * as fs from "fs";
import { environment } from "@raycast/api";
import path from "path";

function toBase64(text: string) {
  const buffer = Buffer.from(text, "utf-8");
  const base64String = buffer.toString("base64");
  return base64String;
}

export function renderToBase64String(node: React.ReactElement) {
  const content = renderToString(node);
  const b64 = toBase64(content);
  const tokenImg = `<img alt="view token" width="400" src="data:image/svg+xml;base64,${b64}"/>`;
  return tokenImg;
}

export function renderSVGToFile(node: React.ReactElement, filename: string) {
  const content = renderToString(node);
  fs.writeFileSync(filename, content, { encoding: "utf8" });
}

export function renderSVGToTempFile(node: React.ReactElement, name: string) {
  const filename = path.join(environment.supportPath, `${name}.svg`);
  renderSVGToFile(node, filename);
  return filename;
}
