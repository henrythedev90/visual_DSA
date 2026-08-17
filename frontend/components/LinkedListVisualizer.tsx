"use client";

import { motion } from "framer-motion";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import type {
  ListTraceStep,
  NodeHighlight,
  PointerChange,
  PointerType,
} from "@/lib/types";

const HIGHLIGHT_COLOR: Record<NodeHighlight, string> = {
  default: "var(--bar-idle)",
  current: "#f59e0b",
  comparing: "#e8c547",
  target: "#e85d4c",
  new: "#3ecf8e",
  removed: "#8b95a8",
};

const NEXT_STROKE = "var(--gold)";
const PREV_STROKE = "#2ec4b6";

const LEGEND: { role: NodeHighlight; label: string }[] = [
  { role: "current", label: "Current" },
  { role: "comparing", label: "Comparing" },
  { role: "target", label: "Target" },
  { role: "new", label: "New" },
  { role: "removed", label: "Removed" },
];

interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LinkedListVisualizerProps {
  step: ListTraceStep | null;
  doubly: boolean;
}

function boxesEqual(a: Box[], b: Box[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((box, i) => {
    const other = b[i];
    return (
      box.id === other.id &&
      box.x === other.x &&
      box.y === other.y &&
      box.w === other.w &&
      box.h === other.h
    );
  });
}

export function LinkedListVisualizer({
  step,
  doubly,
}: LinkedListVisualizerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const boxesRef = useRef<Box[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);

  const nodes = step?.nodes ?? [];
  const headId = step?.head_id ?? null;
  const tailId = step?.tail_id ?? null;
  const changes = step?.pointer_changes ?? [];

  useLayoutEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current?.getBoundingClientRect();
      if (!wrap) return;
      const liveNodes = step?.nodes ?? [];
      const next: Box[] = [];
      for (const node of liveNodes) {
        const el = nodeRefs.current.get(node.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        next.push({
          id: node.id,
          x: Math.round(rect.left - wrap.left),
          y: Math.round(rect.top - wrap.top),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }
      if (boxesEqual(boxesRef.current, next)) return;
      boxesRef.current = next;
      setBoxes(next);
    };

    measure();
    const frame = window.requestAnimationFrame(measure);
    const row = rowRef.current;
    const ro = row ? new ResizeObserver(measure) : null;
    if (row && ro) ro.observe(row);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(frame);
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [step, doubly]);

  const byId = useMemo(() => {
    const map = new Map<string, Box>();
    for (const box of boxes) map.set(box.id, box);
    return map;
  }, [boxes]);

  return (
    <div className="flex h-full min-h-56 flex-col gap-3">
      <div
        ref={wrapRef}
        className="relative min-h-56 flex-1 overflow-auto rounded-xl border border-line bg-canvas/60 p-4"
      >
        {nodes.length === 0 ? (
          <p className="flex h-full min-h-40 items-center justify-center font-mono text-sm text-muted">
            {step ? "empty list (head = null)" : "Run an operation to see the list."}
          </p>
        ) : (
          <div
            ref={rowRef}
            className="relative flex flex-wrap items-start gap-x-10 gap-y-16 pt-6 pb-10"
          >
            {nodes.map((node) => (
              <motion.div
                key={node.id}
                layoutId={node.id}
                ref={(el) => {
                  if (el) nodeRefs.current.set(node.id, el);
                  else nodeRefs.current.delete(node.id);
                }}
                initial={false}
                animate={{
                  opacity: node.highlight === "removed" ? 0.35 : 1,
                  scale: node.highlight === "removed" ? 0.92 : 1,
                }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="relative flex w-16 flex-col items-center"
              >
                <div className="absolute -top-5 flex gap-1 text-[9px] font-semibold uppercase tracking-wider">
                  {node.id === headId ? (
                    <span className="text-gold">head</span>
                  ) : null}
                  {node.id === tailId ? (
                    <span className="text-muted">tail</span>
                  ) : null}
                </div>
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-lg border-2 font-mono text-lg font-semibold text-ink shadow-sm"
                  style={{
                    borderColor: HIGHLIGHT_COLOR[node.highlight],
                    backgroundColor:
                      node.highlight === "default"
                        ? "var(--surface)"
                        : `${HIGHLIGHT_COLOR[node.highlight]}33`,
                  }}
                >
                  {node.value}
                </div>
                <span className="mt-1 font-mono text-[10px] text-muted">
                  {node.id}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <marker
              id="ll-next-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill={NEXT_STROKE} />
            </marker>
            <marker
              id="ll-prev-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill={PREV_STROKE} />
            </marker>
          </defs>
          {nodes.map((node) => (
            <PointerArrow
              key={`${node.id}-next`}
              from={byId.get(node.id)}
              to={node.next_id ? byId.get(node.next_id) : undefined}
              hasTarget={Boolean(node.next_id)}
              kind="next"
              change={changes.find(
                (item) => item.node_id === node.id && item.pointer === "next",
              )}
              fromBox={byId}
            />
          ))}
          {doubly
            ? nodes.map((node) => (
                <PointerArrow
                  key={`${node.id}-prev`}
                  from={byId.get(node.id)}
                  to={node.prev_id ? byId.get(node.prev_id) : undefined}
                  hasTarget={Boolean(node.prev_id)}
                  kind="prev"
                  change={changes.find(
                    (item) => item.node_id === node.id && item.pointer === "prev",
                  )}
                  fromBox={byId}
                />
              ))
            : null}
        </svg>
      </div>

      <ul className="flex flex-wrap gap-3 text-[11px] text-muted">
        {LEGEND.map((item) => (
          <li key={item.role} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: HIGHLIGHT_COLOR[item.role] }}
            />
            {item.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-4" style={{ background: NEXT_STROKE }} />
          next
        </li>
        {doubly ? (
          <li className="flex items-center gap-1.5">
            <span className="h-0.5 w-4" style={{ background: PREV_STROKE }} />
            prev
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function PointerArrow({
  from,
  to,
  hasTarget,
  kind,
  change,
  fromBox,
}: {
  from?: Box;
  to?: Box;
  hasTarget: boolean;
  kind: PointerType;
  change?: PointerChange;
  fromBox: Map<string, Box>;
}) {
  if (!from) return null;
  if (hasTarget && !to) return null;

  const oldBox = change?.old_target ? fromBox.get(change.old_target) : null;
  const start = endpoint(from, kind, "out");
  const end = to ? endpoint(to, kind, "in") : stub(from, kind);
  const oldEnd = oldBox ? endpoint(oldBox, kind, "in") : stub(from, kind);
  const active = Boolean(change);
  const stroke = kind === "next" ? NEXT_STROKE : PREV_STROKE;
  const marker = kind === "next" ? "url(#ll-next-arrow)" : "url(#ll-prev-arrow)";
  const d = curve(start, end, kind);
  const fromD = curve(start, oldEnd, kind);

  return (
    <motion.path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={active ? 3.2 : 1.8}
      strokeOpacity={active ? 1 : 0.75}
      markerEnd={marker}
      initial={{ d: fromD, pathLength: 0.2 }}
      animate={{ d, pathLength: 1, strokeWidth: active ? 3.2 : 1.8 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
    />
  );
}

function endpoint(box: Box, kind: PointerType, dir: "out" | "in") {
  const midY = box.y + box.h * (kind === "next" ? 0.38 : 0.72);
  if (kind === "next") {
    return dir === "out"
      ? { x: box.x + box.w, y: midY }
      : { x: box.x, y: midY };
  }
  return dir === "out"
    ? { x: box.x, y: midY }
    : { x: box.x + box.w, y: midY };
}

function stub(box: Box, kind: PointerType) {
  const start = endpoint(box, kind, "out");
  const dx = kind === "next" ? 22 : -22;
  return { x: start.x + dx, y: start.y };
}

function curve(
  start: { x: number; y: number },
  end: { x: number; y: number },
  kind: PointerType,
) {
  const lift = kind === "next" ? -10 : 14;
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2 + lift;
  return `M ${start.x} ${start.y} Q ${mx} ${my} ${end.x} ${end.y}`;
}
