interface ChartDataset {
  data: number[];
}

interface ChartData {
  datasets: ChartDataset[];
  labels: number[];
}

interface Point {
  x: number;
  y: number;
}

class SvgGraph {
  private readonly svgWidth: number;
  private readonly svgHeight: number;
  private readonly minX: number;
  private readonly maxX: number;
  private readonly minY: number;
  private readonly maxY: number;

  constructor(svgWidth: number, svgHeight: number, minX: number, maxX: number, minY: number, maxY: number) {
    this.svgWidth = svgWidth;
    this.svgHeight = svgHeight;
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
  }

  mapX(x: number): number {
    const xRange = this.maxX - this.minX;
    const svgX = ((x - this.minX) / xRange) * this.svgWidth;
    return svgX;
  }

  mapY(y: number): number {
    const yRange = this.maxY - this.minY;
    const svgY = this.svgHeight - ((y - this.minY) / yRange) * this.svgHeight;
    return svgY;
  }
}

const fmt = new Intl.NumberFormat("en", { notation: "compact", minimumFractionDigits: 1, maximumFractionDigits: 1 });

function legendNumber(value: number) {
  return fmt.format(value);
}

export function LineChart(props: { data: ChartData }) {
  const svgHeight = 180;
  const svgWidth = 300;
  const labels = props.data.labels;
  const data = props.data.datasets[0].data;
  let maxY = Math.max(...data);
  let minY = Math.min(...data);
  if (minY === maxY) {
    maxY = maxY + 5;
    minY = minY - 5;
    if (minY <= 0) {
      minY = 0;
    }
  }
  const maxX = Math.max(...props.data.labels);
  const minX = Math.min(...props.data.labels);
  const offsetX = 30;
  const svgGraph = new SvgGraph(svgWidth, svgHeight, minX, maxX, minY, maxY);
  const titleSizePx = 10;

  const svgCoords: Point[] = data.map((v, i) => ({ x: svgGraph.mapX(labels[i]), y: svgGraph.mapY(v) }));
  const svgCoordsPairs = svgCoords.map((xy) => `${offsetX + xy.x},${xy.y}`).join(" ");
  return (
    <svg className="graph" viewBox="0 0 300 300">
      <style>
        {".mono  { font-family: Menlo; font-size: 50px; }"}
        {`.title { font-family: Helvetica; font-size: ${titleSizePx}px; fill: white }`}
        {".outline { stroke: white; stroke-width: 1px; fill: none}"}
      </style>
      <g>
        <polyline fill="none" stroke="#36a2eb" stroke-width="2" points={svgCoordsPairs} />
        <polyline
          points={`${offsetX},0 ${offsetX},${svgHeight} ${svgWidth + offsetX},${svgHeight}`}
          className="outline"
        />
        <text x="0" y={`${svgGraph.mapY(maxY) + titleSizePx}`} className="title">
          {legendNumber(maxY)}
        </text>
        <text x="0" y={`${svgGraph.mapY(minY) - 1}`} className="title">
          {legendNumber(minY)}
        </text>
      </g>
    </svg>
  );
}
