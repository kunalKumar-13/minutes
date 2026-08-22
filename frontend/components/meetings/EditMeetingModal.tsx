"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Meeting, Participant } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export interface EditMeetingModalProps {
  meeting: Meeting | null;
  participants?: Participant[];
  onClose: () => void;
}

/**
 * Edits meeting metadata and the roster. Participant renames go through their
 * own endpoint, which also rewrites the speaker name on every transcript line —
 * so fixing "Speaker 1" here fixes it everywhere.
 */
export function EditMeetingModal({ meeting, participants, onClose }: EditMeetingModalProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [tags, setTags] = useState("");
  const [roster, setRoster] = useState<{ id?: string; name: string; email: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!meeting) return;
    setTitle(meeting.title);
    // <input type="datetime-local"> wants a local, zone-less value.
    const date = new Date(`${meeting.meeting_date}${/Z$/.test(meeting.meeting_date) ? "" : "Z"}`);
    const offset = date.getTime() - date.getTimezoneOffset() * 60_000;
    setMeetingDate(new Date(offset).toISOString().slice(0, 16));
    setTags(meeting.tags.map((tag) => tag.name).join(", "));
    setRoster((participants ?? meeting.participants).map((p) => ({ id: p.id, name: p.name, email: p.email ?? "" })));
    setError(null);
    setNewName("");
  }, [meeting, participants]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!meeting) return;
      if (!title.trim()) throw new ApiError(400, "The title can't be empty.");

      await api.updateMeeting(meeting.id, {
        title: title.trim(),
        meeting_date: new Date(meetingDate).toISOString(),
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      });

      const original = participants ?? meeting.participants;
      await Promise.all(
        roster
          .filter((person) => person.id)
          .filter((person) => {
            const before = original.find((p) => p.id === person.id);
            return before && (before.name !== person.name.trim() || (before.email ?? "") !== person.email.trim());
          })
          .map((person) =>
            api.updateParticipant(meeting.id, person.id!, {
              name: person.name.trim(),
              email: person.email.trim() || null,
            }),
          ),
      );

      const removed = original.filter((before) => !roster.some((person) => person.id === before.id));
      await Promise.all(removed.map((person) => api.removeParticipant(meeting.id, person.id)));

      await Promise.all(
        roster
          .filter((person) => !person.id && person.name.trim())
          .map((person) => api.addParticipant(meeting.id, { name: person.name.trim(), email: person.email.trim() || null })),
      );
    },
    onSuccess: () => {
      if (meeting) queryClient.invalidateQueries({ queryKey: ["meeting", meeting.id] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Meeting updated");
      onClose();
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : "Something went wrong.";
      setError(message);
      toast.error("Could not save changes", message);
    },
  });

  return (
    <Modal
      open={Boolean(meeting)}
      onClose={onClose}
      title="Edit meeting"
      description="Rename the meeting, fix the date, or correct who was on the call."
      icon={<Pencil className="size-4" />}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" required>
          {(id) => <Input id={id} value={title} onChange={(event) => setTitle(event.target.value)} />}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date and time">
            {(id) => (
              <Input
                id={id}
                type="datetime-local"
                value={meetingDate}
                onChange={(event) => setMeetingDate(event.target.value)}
              />
            )}
          </Field>
          <Field label="Tags" hint="Comma separated">
            {(id) => <Input id={id} value={tags} onChange={(event) => setTags(event.target.value)} />}
          </Field>
        </div>

        <Field label="Participants" hint="Renaming a speaker updates every line they said.">
          {() => (
            <div className="space-y-2">
              {roster.map((person, index) => (
                <div key={person.id ?? `new-${index}`} className="flex gap-2">
                  <Input
                    value={person.name}
                    placeholder="Full name"
                    onChange={(event) =>
                      setRoster((current) => current.map((p, i) => (i === index ? { ...p, name: event.target.value } : p)))
                    }
                  />
                  <Input
                    value={person.email}
                    type="email"
                    placeholder="email@company.com"
                    onChange={(event) =>
                      setRoster((current) => current.map((p, i) => (i === index ? { ...p, email: event.target.value } : p)))
                    }
                  />
                  <Button
                    aria-label={`Remove ${person.name || "participant"}`}
                    className="shrink-0 px-2.5"
                    onClick={() => setRoster((current) => current.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  value={newName}
                  placeholder="Add someone who didn't speak"
                  onChange={(event) => setNewName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" || !newName.trim()) return;
                    event.preventDefault();
                    setRoster((current) => [...current, { name: newName.trim(), email: "" }]);
                    setNewName("");
                  }}
                />
                <Button
                  className="shrink-0"
                  icon={<Plus className="size-3.5" />}
                  disabled={!newName.trim()}
                  onClick={() => {
                    setRoster((current) => [...current, { name: newName.trim(), email: "" }]);
                    setNewName("");
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          )}
        </Field>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-base text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
