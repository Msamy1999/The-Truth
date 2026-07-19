import Link from "next/link";
import { ChevronRight, FileText, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResearchTreeNode, ResearchTreeStatus } from "@/types/content";
import styles from "./ResearchTree.module.css";

type ResearchTreeProps = {
  title: string;
  description?: string;
  nodes: ResearchTreeNode[];
  className?: string;
};

const statusLabels: Record<ResearchTreeStatus, string> = {
  draft: "Draft",
  "under-review": "Under review",
  published: "Published",
};

const statusClasses: Record<ResearchTreeStatus, string> = {
  draft: "border-gold/50 bg-gold/10 text-foreground",
  "under-review": "border-secondary/45 bg-secondary/10 text-foreground",
  published: "border-accent/45 bg-accent/10 text-foreground",
};

export function ResearchTree({
  title,
  description,
  nodes,
  className,
}: ResearchTreeProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-2 shadow-soft sm:p-2.5", className)}>
      <div className="flex items-center gap-2 rounded-md bg-muted/70 px-2 py-1.5">
        <FolderOpen aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-accent" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-snug">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <ol className="ml-3 mt-2 border-l border-border sm:ml-4">
        {nodes.map((node, index) => (
          <TreeNode
            key={node.id ?? `${node.title}-${index}`}
            node={node}
            depth={0}
            isLast={index === nodes.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}

type TreeNodeProps = {
  node: ResearchTreeNode;
  depth: number;
  isLast: boolean;
};

function TreeNode({ node, depth, isLast }: TreeNodeProps) {
  const hasChildren = Boolean(node.children?.length);

  return (
    <li className={cn("relative pl-4", !isLast && "pb-1")}>
      {hasChildren ? (
        <details className={styles.details} open={node.defaultOpen}>
          <summary
            title={node.description}
            className={cn(
              "flex cursor-pointer list-none items-start gap-1.5 rounded-md px-1.5 py-2 transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-2 [&::-webkit-details-marker]:hidden",
              styles.summary,
            )}
          >
            <ChevronRight
              aria-hidden="true"
              className={cn(
                "mt-0.5 h-3.5 w-3.5 shrink-0 text-accent transition-transform",
                styles.chevron,
              )}
            />
            <FolderOpen aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
              {node.title}
            </span>
            <NodeBadges node={node} />
          </summary>
          <div className="ml-4 border-l border-border pb-1 pl-3 sm:ml-5 sm:pl-4">
            {node.href ? (
            <Link
              href={node.href}
              className="mb-1.5 inline-flex min-h-8 items-center rounded-sm text-xs font-semibold text-accent no-underline hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
                Explore {node.title}
            </Link>
            ) : null}
            <ol className="grid gap-0">
              {node.children?.map((child, index) => (
                <TreeNode
                  key={child.id ?? `${child.title}-${index}`}
                  node={child}
                  depth={depth + 1}
                  isLast={index === (node.children?.length ?? 0) - 1}
                />
              ))}
            </ol>
          </div>
        </details>
      ) : (
        <LeafNode node={node} />
      )}
    </li>
  );
}

function LeafNode({ node }: { node: ResearchTreeNode }) {
  if (!node.href) {
    return (
      <div
        title={node.description}
        className="flex items-start gap-1.5 rounded-md px-1.5 py-2 sm:px-2"
      >
        <FileText aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 text-sm leading-snug text-foreground">{node.title}</span>
        <NodeBadges node={node} />
      </div>
    );
  }

  return (
    <Link
      href={node.href}
      title={node.description}
      className="flex items-start gap-1.5 rounded-md px-1.5 py-2 text-foreground no-underline transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-2"
    >
      <FileText aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 text-sm leading-snug text-foreground">{node.title}</span>
      <NodeBadges node={node} />
    </Link>
  );
}

function NodeBadges({ node }: { node: ResearchTreeNode }) {
  if (!node.tag && !node.status) {
    return null;
  }

  return (
    <span className="flex shrink-0 flex-wrap items-center gap-1">
      {node.tag ? <TreeTag>{node.tag}</TreeTag> : null}
      {node.status ? <StatusPill status={node.status} /> : null}
    </span>
  );
}

function TreeTag({ children }: { children: string }) {
  return (
    <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground ring-1 ring-border">
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: ResearchTreeStatus }) {
  return (
    <span
      className={cn(
        "rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
        statusClasses[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
