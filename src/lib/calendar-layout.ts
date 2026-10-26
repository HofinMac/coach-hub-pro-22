/** Side-by-side placement for overlapping calendar blocks (like Google Calendar). */
export interface Placement {
  col: number;
  cols: number;
}

interface Interval {
  id: string;
  start_time: string;
  end_time: string;
}

export function layoutOverlaps(items: Interval[]): Map<string, Placement> {
  const sorted = [...items].sort((a, b) =>
    a.start_time.localeCompare(b.start_time) || b.end_time.localeCompare(a.end_time));
  const result = new Map<string, Placement>();

  let cluster: Array<{ id: string; col: number }> = [];
  let columnEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    const cols = columnEnds.length;
    for (const { id, col } of cluster) result.set(id, { col, cols });
    cluster = [];
    columnEnds = [];
  };

  for (const item of sorted) {
    const start = new Date(item.start_time).getTime();
    const end = new Date(item.end_time).getTime();
    if (start >= clusterEnd) flush();
    let col = columnEnds.findIndex(e => e <= start);
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(end);
    } else {
      columnEnds[col] = end;
    }
    cluster.push({ id: item.id, col });
    clusterEnd = Math.max(clusterEnd === -Infinity ? end : clusterEnd, end);
  }
  flush();
  return result;
}
