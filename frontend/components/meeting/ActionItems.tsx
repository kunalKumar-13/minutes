"use client";

import { useMemo, useState } from "react";
import { Check, Clock3, Pencil, Plus, Trash2, X } from "lucide-react";
import type { ActionItem, Participant } from "@/lib/types";
import { cn, formatMeetingDate, formatTimestamp } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

const PRIORITY_STYLES: Record<string, string> = {
  high: "text-red-600 dark:text-red-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  low: "text-gray-400",
};

export interface ActionItemsSectionProps {
  items: ActionItem[];
  participants: Participant[];
  openCount: number;
  pending: boolean;
  onSeek: (ms: number) => void;
  onToggle: (item: ActionItem) => void;
  onCreate: (text: string, assignee: Participant | null) => void;
  onUpdate: (item: ActionItem, text: string) => void;
  onDelete: (item: ActionItem) => void;
}

/**
 * Action items grouped by assignee, the way the real Notes panel lays them out:
 * a name heading, then that person's commitments with a timestamp link back
 * into the recording.
 */
export function ActionItemsSection({
  items, participants, openCount, pending, onSeek, onToggle, onCreate, onUpdate, onDelete,
}: ActionItemsSectionProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const grouped = useMemo(() => {
    const groups = new Map<string, ActionItem[]>();
    // Unassigned items sort last, under a neutral heading.
    for (const item of items) {
      const key = item.assignee_name ?? "Unassigned";
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === "Unassigned") return 1;
      if (b === "Unassigned") return -1;
      return a.localeCompare(b);
    });
  }, [items]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onCreate(text, participants.find((person) => person.id === assigneeId) ?? null);
    setDraft("");
    setAdding(false);
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium tracking-tight text-gray-900 dark:text-gray-100">
          Action Items
          {items.length > 0 && (
            <span className="ml-2 text-base font-normal text-gray-500 dark:text-gray-400">
              {openCount} open · {items.length - openCount} done
            </span>
          )}
        </h3>
        <Button size="sm" variant="ghost" icon={<Plus className="size-3.5" />} onClick={() => setAdding((v) => !v)}>
          Add
        </Button>
      </div>

      {adding && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-purple-200 bg-purple-25 p-2.5 dark:border-purple-500/30 dark:bg-purple-500/5">
          <Input
            value={draft}
            autoFocus
            placeholder="What needs to happen, and by when?"
            className="min-w-[220px] flex-1"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
              if (event.key === "Escape") setAdding(false);
            }}
          />
          <Select
            value={assigneeId}
            className="w-44"
            aria-label="Assignee"
            onChange={(event) => setAssigneeId(event.target.value)}
          >
            <option value="">Unassigned</option>
            {participants.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </Select>
          <Button size="sm" variant="primary" onClick={submit} disabled={!draft.trim() || pending}>
            Add item
          </Button>
          <Button size="sm" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-base text-gray-500 dark:border-white/15 dark:text-gray-400">
          No action items were found in this meeting.
        </p>
      ) : (
        <div className="space-y-5">
          {grouped.map(([name, group]) => {
            const person = participants.find((p) => p.name === name);
            return (
              <div key={name}>
                <div className="mb-1.5 flex items-center gap-2">
                  {name !== "Unassigned" && <Avatar name={name} color={person?.color} size="sm" />}
                  <span className="text-base font-medium text-gray-500 dark:text-gray-400">{name}</span>
                </div>

                <ul className="space-y-0.5">
                  {group.map((item) => {
                    const done = item.status === "completed";
                    const editing = item.id === editingId;
                    return (
                      <li
                        key={item.id}
                        className="group flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={done}
                          aria-label={done ? `Reopen: ${item.text}` : `Complete: ${item.text}`}
                          onClick={() => onToggle(item)}
                          className={cn(
                            "mt-[5px] flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                            done
                              ? "border-purple-600 bg-purple-600 text-white"
                              : "border-gray-200 hover:border-purple-500 dark:border-white/25",
                          )}
                        >
                          {done && <Check className="size-3" strokeWidth={3} />}
                        </button>

                        <div className="min-w-0 flex-1">
                          {editing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editDraft}
                                autoFocus
                                onChange={(event) => setEditDraft(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" && editDraft.trim()) {
                                    onUpdate(item, editDraft.trim());
                                    setEditingId(null);
                                  }
                                  if (event.key === "Escape") setEditingId(null);
                                }}
                              />
                              <IconButton
                                label="Save"
                                size="sm"
                                onClick={() => {
                                  if (!editDraft.trim()) return;
                                  onUpdate(item, editDraft.trim());
                                  setEditingId(null);
                                }}
                              >
                                <Check className="size-3.5" />
                              </IconButton>
                              <IconButton label="Cancel" size="sm" onClick={() => setEditingId(null)}>
                                <X className="size-3.5" />
                              </IconButton>
                            </div>
                          ) : (
                            <p
                              className={cn(
                                "text-prose",
                                done ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-300",
                              )}
                            >
                              {item.text}
                              {item.timestamp_ms !== null && (
                                <button
                                  type="button"
                                  onClick={() => onSeek(item.timestamp_ms!)}
                                  className="ml-2 text-base tabular-nums text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-800 dark:text-blue-400"
                                >
                                  {formatTimestamp(item.timestamp_ms)}
                                </button>
                              )}
                            </p>
                          )}

                          {(item.due_date || item.priority !== "medium") && !editing && (
                            <div className="mt-0.5 flex items-center gap-3 text-sm">
                              {item.due_date && (
                                <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                  <Clock3 className="size-3" />
                                  Due {formatMeetingDate(item.due_date, false)}
                                </span>
                              )}
                              {item.priority !== "medium" && (
                                <span className={cn("font-medium capitalize", PRIORITY_STYLES[item.priority])}>
                                  {item.priority} priority
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {!editing && (
                          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                            <IconButton
                              label="Edit action item"
                              size="sm"
                              onClick={() => {
                                setEditingId(item.id);
                                setEditDraft(item.text);
                              }}
                            >
                              <Pencil className="size-3.5" />
                            </IconButton>
                            <IconButton
                              label="Delete action item"
                              size="sm"
                              className="hover:text-red-600"
                              onClick={() => onDelete(item)}
                            >
                              <Trash2 className="size-3.5" />
                            </IconButton>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
