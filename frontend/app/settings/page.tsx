"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Laptop, Lock, Moon, Palette, Plug, User as UserIcon } from "lucide-react";
import { api, queryKeys } from "@/lib/api";
import { cn, formatMeetingDate, formatRelative } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { useSession } from "@/components/layout/SessionProvider";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const TIMEZONES = [
  "Asia/Kolkata", "UTC", "America/New_York", "America/Los_Angeles",
  "Europe/London", "Europe/Berlin", "Asia/Singapore", "Australia/Sydney",
];

/** A settings row that is intentionally inert, with the reason stated. */
function PlaceholderRow({
  icon, title, description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--app-border)] py-4 last:border-0">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-gray-900 dark:text-gray-100">{title}</p>
        <p className="mt-0.5 text-sm leading-5 text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-gray-500 dark:bg-white/10 dark:text-gray-400">
        Soon
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { theme, toggle } = useTheme();

  const userQuery = useQuery({ queryKey: queryKeys.me, queryFn: api.me });
  const sessionsQuery = useQuery({ queryKey: ["sessions"], queryFn: api.sessions });
  const { signOut } = useSession();

  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  useEffect(() => {
    if (!userQuery.data) return;
    setName(userQuery.data.name);
    setJobTitle(userQuery.data.job_title ?? "");
    setTimezone(userQuery.data.timezone);
  }, [userQuery.data]);

  const save = useMutation({
    mutationFn: () => api.updateMe({ name: name.trim(), job_title: jobTitle.trim(), timezone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      toast.success("Profile saved");
    },
    onError: () => toast.error("Could not save your profile"),
  });

  return (
    <AppShell title="Settings">
      <div className="mx-auto w-full max-w-[720px] px-4 py-6 sm:px-6">
        <h1 className="font-display text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
          Your profile is real and persists. Everything below it is a placeholder.
        </p>

        <section className="ff-surface mt-6 rounded-xl border p-5">
          <h2 className="flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            <UserIcon className="size-4 text-gray-400" />
            Profile
          </h2>

          {userQuery.isLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-center gap-4">
                <Avatar name={name || "You"} color="purple" size="xl" />
                <div>
                  <p className="text-md font-medium text-gray-900 dark:text-gray-100">{name || "Unnamed"}</p>
                  <p className="text-base text-gray-500 dark:text-gray-400">{userQuery.data?.email}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  {(id) => <Input id={id} value={name} onChange={(event) => setName(event.target.value)} />}
                </Field>
                <Field label="Job title">
                  {(id) => (
                    <Input
                      id={id}
                      value={jobTitle}
                      placeholder="Founding Engineer"
                      onChange={(event) => setJobTitle(event.target.value)}
                    />
                  )}
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Timezone" hint="Used when meeting times are displayed.">
                  {(id) => (
                    <Select id={id} value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                      {TIMEZONES.map((zone) => (
                        <option key={zone} value={zone}>
                          {zone}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              </div>

              <div className="mt-5 flex justify-end">
                <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>
                  Save changes
                </Button>
              </div>
            </>
          )}
        </section>

        <section className="ff-surface mt-5 rounded-xl border p-5">
          <h2 className="flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            <Palette className="size-4 text-gray-400" />
            Appearance
          </h2>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">Dark mode</p>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Remembered on this device.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              aria-label="Toggle dark mode"
              onClick={toggle}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                theme === "dark" ? "bg-purple-600" : "bg-gray-200",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 flex size-5 items-center justify-center rounded-full bg-white shadow transition-transform",
                  theme === "dark" ? "translate-x-[22px]" : "translate-x-0.5",
                )}
              >
                <Moon className={cn("size-3 text-purple-600", theme === "dark" ? "opacity-100" : "opacity-0")} />
              </span>
            </button>
          </div>
        </section>

        {/* Real, not a placeholder: these rows come from the sessions table. */}
        <section className="ff-surface mt-5 rounded-xl border p-5">
          <h2 className="flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            <Laptop className="size-4 text-gray-400" />
            Active sessions
          </h2>
          <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
            Every browser currently signed in to this workspace. Signing out revokes the token immediately.
          </p>

          {sessionsQuery.isLoading ? (
            <Skeleton className="mt-4 h-14 w-full" />
          ) : (sessionsQuery.data ?? []).length === 0 ? (
            <p className="mt-4 text-base text-gray-500">No active sessions.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--app-border)]">
              {(sessionsQuery.data ?? []).map((session) => (
                <li key={session.id} className="flex items-center gap-3 py-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    <Laptop className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium capitalize text-gray-900 dark:text-gray-100">
                      {session.provider} sign-in
                    </p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      Last used {formatRelative(session.last_seen_at)} · expires{" "}
                      {formatMeetingDate(session.expires_at, false)}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-gray-400">…{session.id.slice(-8)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex justify-end">
            <Button variant="danger" onClick={signOut}>
              Sign out of this browser
            </Button>
          </div>
        </section>

        <section className="ff-surface mt-5 rounded-xl border px-5 py-1">
          <PlaceholderRow
            icon={<Bell className="size-4" />}
            title="Notifications"
            description="Email and Slack digests when notes are ready or an action item is due."
          />
          <PlaceholderRow
            icon={<Plug className="size-4" />}
            title="Connected apps"
            description="Calendar, meeting platform and CRM connections."
          />
          <PlaceholderRow
            icon={<Lock className="size-4" />}
            title="Security & privacy"
            description="Retention policies and per-meeting access control. Sign-in itself is a placeholder — see the note on the login screen."
          />
        </section>
      </div>
    </AppShell>
  );
}
