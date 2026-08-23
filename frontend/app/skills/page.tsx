"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Coins, PlayCircle, Plus, Settings2, Sparkles, Trash2, Zap } from "lucide-react";
import { api, queryKeys } from "@/lib/api";
import type { Skill, SkillPayload, SkillPreview, SkillTemplate } from "@/lib/types";
import { cn, formatMeetingDate } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { Button, IconButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { SkillOutput, tintClass } from "@/components/skills/SkillOutput";

type Tab = "discover" | "active" | "feed";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "discover", label: "Discover", hint: "Prompts you can turn on" },
  { id: "active", label: "Active skills", hint: "Running on your meetings" },
  { id: "feed", label: "Feed", hint: "Everything they produced" },
];

const SCHEDULE_LABEL: Record<string, string> = {
  per_meeting: "After every meeting",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const EMPTY_DRAFT: SkillPayload = {
  name: "",
  instructions: "",
  category: "general",
  schedule: "per_meeting",
  output_type: "text",
  scope: "all",
  filter_title: "",
  filter_host: "",
  filter_participant: "",
  is_enabled: true,
};

export default function SkillsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>("discover");
  const [category, setCategory] = useState<string>("");
  const [preview, setPreview] = useState<SkillPreview | null>(null);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [draft, setDraft] = useState<SkillPayload | null>(null);
  const [deleting, setDeleting] = useState<Skill | null>(null);
  const [feedSkill, setFeedSkill] = useState<string>("");

  const templatesQuery = useQuery({
    queryKey: queryKeys.skillTemplates(category || undefined),
    queryFn: () => api.skillTemplates(category || undefined),
  });
  const skillsQuery = useQuery({ queryKey: queryKeys.skills({}), queryFn: () => api.skills() });
  const creditsQuery = useQuery({ queryKey: queryKeys.credits, queryFn: () => api.credits() });
  const feedQuery = useQuery({
    queryKey: queryKeys.skillFeed({ skill_id: feedSkill || undefined }),
    queryFn: () => api.skillFeed({ skill_id: feedSkill || undefined }),
    enabled: tab === "feed",
  });
  const categoriesQuery = useQuery({ queryKey: ["skill-categories"], queryFn: () => api.skillCategories() });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["skills"] });
    queryClient.invalidateQueries({ queryKey: ["skill-templates"] });
    queryClient.invalidateQueries({ queryKey: ["skill-feed"] });
    queryClient.invalidateQueries({ queryKey: ["credits"] });
  };

  const enable = useMutation({
    mutationFn: (template: SkillTemplate) =>
      api.createSkill({
        template_key: template.key,
        name: template.name,
        description: template.description,
        category: template.category,
        instructions: template.instructions,
        output_type: template.output_type,
        tint: template.tint,
        is_enabled: true,
      }),
    onSuccess: (skill) => {
      refresh();
      toast.success(`${skill.name} enabled`, "It will run after every meeting.");
    },
    onError: (error: Error) => toast.error("Could not enable that skill", error.message),
  });

  const tryIt = useMutation({
    mutationFn: async (template: SkillTemplate) => {
      // "Try skill" must show real output, so it needs a skill row to run
      // against. Creating it disabled keeps the trial off the user's meetings
      // until they explicitly enable it.
      const skill =
        template.skill_id !== null
          ? await api.skill(template.skill_id)
          : await api.createSkill({
              template_key: template.key,
              name: template.name,
              description: template.description,
              category: template.category,
              instructions: template.instructions,
              output_type: template.output_type,
              tint: template.tint,
              is_enabled: false,
            });
      return api.previewSkill(skill.id, 3);
    },
    onSuccess: (result) => {
      refresh();
      setPreview(result);
    },
    onError: (error: Error) => toast.error("Could not run that preview", error.message),
  });

  const save = useMutation({
    mutationFn: (payload: SkillPayload) =>
      editing ? api.updateSkill(editing.id, payload) : api.createSkill(payload),
    onSuccess: (skill) => {
      refresh();
      setDraft(null);
      setEditing(null);
      toast.success(`${skill.name} saved`);
    },
    onError: (error: Error) => toast.error("Could not save that skill", error.message),
  });

  const toggle = useMutation({
    mutationFn: (skill: Skill) => api.updateSkill(skill.id, { is_enabled: !skill.is_enabled }),
    onSuccess: refresh,
    onError: (error: Error) => toast.error("Could not update that skill", error.message),
  });

  const runNow = useMutation({
    mutationFn: (skill: Skill) => api.runSkill(skill.id, { limit: 5 }),
    onSuccess: (runs) => {
      refresh();
      setTab("feed");
      toast.success(
        `Ran on ${runs.length} meeting${runs.length === 1 ? "" : "s"}`,
        `${runs.reduce((total, run) => total + run.credits_used, 0)} credits used.`,
      );
    },
    onError: (error: Error) => toast.error("Could not run that skill", error.message),
  });

  const remove = useMutation({
    mutationFn: (skill: Skill) => api.deleteSkill(skill.id),
    onSuccess: () => {
      refresh();
      setDeleting(null);
      toast.success("Skill deleted");
    },
    onError: (error: Error) => toast.error("Could not delete that skill", error.message),
  });

  const credits = creditsQuery.data;
  const skills = useMemo(() => skillsQuery.data ?? [], [skillsQuery.data]);

  return (
    <AppShell title="AI Skills">
      <div className="mx-auto w-full max-w-[980px] px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100">
              AI Skills
            </h1>
            <p className="mt-1 max-w-[60ch] text-md text-gray-500 dark:text-gray-400">
              Saved prompts that run over your meetings and put the answer in the feed. Turn one on, or write your
              own.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {credits ? (
              <span
                className="ff-surface flex items-center gap-2 rounded-lg border px-3 py-2 text-base"
                title={`${credits.per_run} credit per meeting a skill runs on`}
              >
                <Coins className="size-4 text-amber-500" />
                <span className="tabular-nums font-semibold text-gray-900 dark:text-gray-100">
                  {credits.remaining}
                </span>
                <span className="text-gray-500 dark:text-gray-400">of {credits.allowance} credits</span>
              </span>
            ) : null}
            <Button icon={<Plus className="size-4" />} onClick={() => { setEditing(null); setDraft({ ...EMPTY_DRAFT }); }}>
              Create skill
            </Button>
          </div>
        </header>

        <nav className="mt-6 flex gap-1 border-b border-gray-200 dark:border-white/10" aria-label="AI Skills views">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              aria-current={tab === entry.id ? "page" : undefined}
              title={entry.hint}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-md font-medium transition-colors",
                tab === entry.id
                  ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200",
              )}
            >
              {entry.label}
              {entry.id === "active" && skills.length ? (
                <span className="ml-2 tabular-nums text-sm text-gray-400">{skills.length}</span>
              ) : null}
            </button>
          ))}
        </nav>

        {/* ---------------------------------------------------------- discover */}
        {tab === "discover" ? (
          <section className="mt-5">
            <div className="flex flex-wrap gap-1.5">
              <CategoryChip active={!category} onClick={() => setCategory("")}>All</CategoryChip>
              {(categoriesQuery.data ?? []).map((name) => (
                <CategoryChip key={name} active={category === name} onClick={() => setCategory(name)}>
                  {name}
                </CategoryChip>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {templatesQuery.isPending
                ? [0, 1, 2].map((n) => <Skeleton key={n} className="h-[88px] rounded-xl" />)
                : (templatesQuery.data ?? []).map((template) => (
                    <article key={template.key} className="ff-surface flex items-start gap-4 rounded-xl border p-4">
                      <span
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-xl text-white",
                          tintClass(template.tint),
                        )}
                      >
                        <Sparkles className="size-5 fill-current" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-md font-semibold text-gray-900 dark:text-gray-100">{template.name}</p>
                          <Badge color="gray">{template.category}</Badge>
                          {template.output_type === "chart" ? <Badge color="blue">chart</Badge> : null}
                          {template.is_enabled ? <Badge color="green" dot>Enabled</Badge> : null}
                        </div>
                        <p className="mt-1 text-base text-gray-500 dark:text-gray-400">{template.description}</p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={tryIt.isPending && tryIt.variables?.key === template.key}
                          onClick={() => tryIt.mutate(template)}
                        >
                          Try skill
                        </Button>
                        <Button
                          size="sm"
                          variant={template.is_enabled ? "ghost" : "primary"}
                          disabled={template.is_enabled}
                          loading={enable.isPending && enable.variables?.key === template.key}
                          onClick={() => enable.mutate(template)}
                        >
                          {template.is_enabled ? "On" : "Enable"}
                        </Button>
                      </div>
                    </article>
                  ))}
            </div>

            <p className="mt-5 rounded-lg bg-gray-50 p-4 text-base leading-6 text-gray-600 dark:bg-white/5 dark:text-gray-400">
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Try skill</strong> runs the prompt
              against your three most recent meetings and shows you the real output — nothing is saved and no credit
              is charged until you enable it.
            </p>
          </section>
        ) : null}

        {/* ------------------------------------------------------------ active */}
        {tab === "active" ? (
          <section className="mt-5 space-y-3">
            {skillsQuery.isPending ? (
              [0, 1].map((n) => <Skeleton key={n} className="h-[92px] rounded-xl" />)
            ) : skills.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="size-6" />}
                title="No skills yet"
                description="Enable one from Discover, or write your own prompt."
                action={<Button onClick={() => setTab("discover")}>Browse skills</Button>}
              />
            ) : (
              skills.map((skill) => (
                <article key={skill.id} className="ff-surface flex items-start gap-4 rounded-xl border p-4">
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl text-white",
                      tintClass(skill.tint),
                    )}
                  >
                    <Sparkles className="size-5 fill-current" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-md font-semibold text-gray-900 dark:text-gray-100">{skill.name}</p>
                      <Badge color={skill.is_enabled ? "green" : "gray"} dot>
                        {skill.is_enabled ? "Active" : "Paused"}
                      </Badge>
                      {skill.scope === "custom" ? <Badge color="purple">filtered</Badge> : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-base text-gray-500 dark:text-gray-400">
                      {skill.description || skill.instructions}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="size-3.5" />
                        {SCHEDULE_LABEL[skill.schedule] ?? skill.schedule}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Zap className="size-3.5" />
                        {skill.run_count} run{skill.run_count === 1 ? "" : "s"}
                      </span>
                      {skill.last_run_at ? <span>Last {formatMeetingDate(skill.last_run_at)}</span> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<PlayCircle className="size-4" />}
                      loading={runNow.isPending && runNow.variables?.id === skill.id}
                      onClick={() => runNow.mutate(skill)}
                    >
                      Run now
                    </Button>
                    <IconButton
                      label={skill.is_enabled ? "Pause skill" : "Activate skill"}
                      onClick={() => toggle.mutate(skill)}
                    >
                      <Zap className={cn("size-4", skill.is_enabled ? "text-green-500" : "text-gray-400")} />
                    </IconButton>
                    <IconButton
                      label="Edit skill"
                      onClick={() => {
                        setEditing(skill);
                        setDraft({
                          name: skill.name,
                          instructions: skill.instructions,
                          description: skill.description ?? "",
                          category: skill.category,
                          schedule: skill.schedule,
                          output_type: skill.output_type,
                          scope: skill.scope,
                          filter_title: skill.filter_title ?? "",
                          filter_host: skill.filter_host ?? "",
                          filter_participant: skill.filter_participant ?? "",
                          is_enabled: skill.is_enabled,
                        });
                      }}
                    >
                      <Settings2 className="size-4" />
                    </IconButton>
                    <IconButton label="Delete skill" onClick={() => setDeleting(skill)}>
                      <Trash2 className="size-4 text-red-500" />
                    </IconButton>
                  </div>
                </article>
              ))
            )}
          </section>
        ) : null}

        {/* -------------------------------------------------------------- feed */}
        {tab === "feed" ? (
          <section className="mt-5">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="feed-skill" className="text-base text-gray-500 dark:text-gray-400">
                Filter
              </label>
              <Select
                id="feed-skill"
                value={feedSkill}
                onChange={(event) => setFeedSkill(event.target.value)}
                className="max-w-[260px]"
              >
                <option value="">All skills</option>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-4 space-y-3">
              {feedQuery.isPending ? (
                [0, 1].map((n) => <Skeleton key={n} className="h-40 rounded-xl" />)
              ) : (feedQuery.data ?? []).length === 0 ? (
                <EmptyState
                  icon={<Zap className="size-6" />}
                  title="Nothing has run yet"
                  description="Enable a skill, or hit Run now on one you already have."
                  action={<Button onClick={() => setTab("active")}>Go to active skills</Button>}
                />
              ) : (
                (feedQuery.data ?? []).map((run) => (
                  <article key={run.id} className="ff-surface rounded-xl border p-4">
                    <header className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-lg text-white",
                            tintClass(run.skill_tint),
                          )}
                        >
                          <Sparkles className="size-4 fill-current" />
                        </span>
                        <div>
                          <p className="text-md font-semibold text-gray-900 dark:text-gray-100">{run.skill_name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            <Link href={`/view/${run.meeting_id}`} className="hover:underline">
                              {run.meeting_title}
                            </Link>
                            {" · "}
                            {formatMeetingDate(run.meeting_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {run.status === "error" ? <Badge color="red">failed</Badge> : null}
                        <Badge color="gray">{run.generated_by}</Badge>
                        <Badge color="yellow">
                          {run.credits_used} credit{run.credits_used === 1 ? "" : "s"}
                        </Badge>
                      </div>
                    </header>

                    <div className="mt-3 border-t border-gray-100 pt-3 dark:border-white/10">
                      {run.status === "error" ? (
                        <p className="text-base text-red-600 dark:text-red-400">{run.error}</p>
                      ) : (
                        <SkillOutput content={run.content} />
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}
      </div>

      {/* --------------------------------------------------------- try preview */}
      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview ? `${preview.skill_name} — preview` : "Preview"}
        description="Real output from your three most recent meetings. Nothing has been saved and no credit was charged."
        size="lg"
        icon={<Sparkles className="size-5" />}
      >
        <div className="space-y-4">
          {preview?.results.length === 0 ? (
            <p className="text-base text-gray-500 dark:text-gray-400">
              You have no meetings yet, so there was nothing to run against.
            </p>
          ) : null}
          {preview?.results.map((result) => (
            <div key={result.meeting_id} className="rounded-lg border border-gray-200 p-3 dark:border-white/10">
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{result.meeting_title}</p>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                {formatMeetingDate(result.meeting_date)}
              </p>
              <SkillOutput content={result.content} />
            </div>
          ))}
        </div>
      </Modal>

      {/* ------------------------------------------------------------- editor */}
      <Modal
        open={draft !== null}
        onClose={() => { setDraft(null); setEditing(null); }}
        title={editing ? `Edit ${editing.name}` : "Create a skill"}
        description="The instructions are the prompt. Be specific about what you want pulled out of each meeting."
        size="lg"
        icon={<Sparkles className="size-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setDraft(null); setEditing(null); }}>
              Cancel
            </Button>
            <Button
              loading={save.isPending}
              disabled={!draft?.name.trim() || (draft?.instructions.trim().length ?? 0) < 10}
              onClick={() => draft && save.mutate(draft)}
            >
              {editing ? "Save changes" : "Create skill"}
            </Button>
          </div>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <Field label="Name" required>
              {(id) => (
              <Input
                id={id}
                value={draft.name}
                maxLength={160}
                placeholder="Renewal Risk Digest"
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
              )}
            </Field>

            <Field
              label="Instructions"
              required
              hint="What should this pull out of every meeting? At least 10 characters."
            >
              {(id) => (
              <Textarea
                id={id}
                rows={5}
                value={draft.instructions}
                maxLength={4000}
                placeholder="List every renewal risk raised on the call, who raised it, and what was promised in response."
                onChange={(event) => setDraft({ ...draft, instructions: event.target.value })}
              />
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Schedule">
                {(id) => (
                <Select
                  id={id}
                  value={draft.schedule}
                  onChange={(event) => setDraft({ ...draft, schedule: event.target.value as SkillPayload["schedule"] })}
                >
                  {Object.entries(SCHEDULE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                )}
              </Field>

              <Field label="Output">
                {(id) => (
                <Select
                  id={id}
                  value={draft.output_type}
                  onChange={(event) =>
                    setDraft({ ...draft, output_type: event.target.value as SkillPayload["output_type"] })
                  }
                >
                  <option value="text">Text</option>
                  <option value="chart">Chart</option>
                </Select>
                )}
              </Field>
            </div>

            <Field label="Run skill on">
              {(id) => (
              <Select
                id={id}
                value={draft.scope}
                onChange={(event) => setDraft({ ...draft, scope: event.target.value as SkillPayload["scope"] })}
              >
                <option value="all">All my meetings</option>
                <option value="custom">Only meetings that match a filter</option>
              </Select>
              )}
            </Field>

            {draft.scope === "custom" ? (
              <div className="grid gap-4 rounded-lg bg-gray-50 p-3 dark:bg-white/5 sm:grid-cols-3">
                <Field label="Title contains">
                  {(id) => (
                  <Input
                    id={id}
                    value={draft.filter_title ?? ""}
                    placeholder="demo"
                    onChange={(event) => setDraft({ ...draft, filter_title: event.target.value })}
                  />
                  )}
                </Field>
                <Field label="Host">
                  {(id) => (
                  <Input
                    id={id}
                    value={draft.filter_host ?? ""}
                    placeholder="name or email"
                    onChange={(event) => setDraft({ ...draft, filter_host: event.target.value })}
                  />
                  )}
                </Field>
                <Field label="Participant">
                  {(id) => (
                  <Input
                    id={id}
                    value={draft.filter_participant ?? ""}
                    placeholder="name, email or domain"
                    onChange={(event) => setDraft({ ...draft, filter_participant: event.target.value })}
                  />
                  )}
                </Field>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
        title="Delete this skill?"
        message={`"${deleting?.name}" and everything it produced in the feed will be removed. This can't be undone.`}
        confirmLabel="Delete skill"
        loading={remove.isPending}
        destructive
      />
    </AppShell>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1 text-base capitalize transition-colors",
        active
          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15",
      )}
    >
      {children}
    </button>
  );
}
