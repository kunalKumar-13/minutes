"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FileUp, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

type Mode = "paste" | "upload" | "blank";

const MODES: { key: Mode; label: string; hint: string }[] = [
  { key: "paste", label: "Paste transcript", hint: "Paste text and we'll parse speakers and timestamps" },
  { key: "upload", label: "Upload file", hint: ".txt, .vtt, .srt or .json" },
  { key: "blank", label: "Empty meeting", hint: "Just the details — add a transcript later" },
];

const SAMPLE = `[00:00:04] Alice Chen: Thanks for joining. Let's start with the launch date.
[00:00:19] Marco Silva: I'll confirm the vendor timeline and send it over tomorrow.
[00:00:38] Alice Chen: Marco, can you also review the pricing page copy before Friday?`;

export interface CreateMeetingModalProps {
  open: boolean;
  onClose: () => void;
  /** Preselects the upload tab when opened from the Uploads page. */
  initialMode?: Mode;
}

export function CreateMeetingModal({ open, onClose, initialMode = "paste" }: CreateMeetingModalProps) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [mediaType, setMediaType] = useState("audio");
  const [tags, setTags] = useState("");
  const [transcript, setTranscript] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [participants, setParticipants] = useState<{ name: string; email: string }[]>([{ name: "", email: "" }]);
  const [generateSummary, setGenerateSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setMode(initialMode);
    setTitle("");
    setTranscript("");
    setFile(null);
    setTags("");
    setParticipants([{ name: "", email: "" }]);
    setError(null);
  }, [initialMode]);

  const close = () => {
    reset();
    onClose();
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const roster = participants
        .map((person) => ({ name: person.name.trim(), email: person.email.trim() || null }))
        .filter((person) => person.name.length > 0);
      const tagList = tags.split(",").map((tag) => tag.trim()).filter(Boolean);

      if (mode === "upload") {
        if (!file) throw new ApiError(400, "Choose a transcript file to upload.");
        const form = new FormData();
        form.append("file", file);
        if (title.trim()) form.append("title", title.trim());
        form.append("meeting_date", new Date(meetingDate).toISOString());
        form.append("generate_summary", String(generateSummary));
        if (roster.length) form.append("participants", JSON.stringify(roster));
        if (tagList.length) form.append("tags", tagList.join(","));
        return api.uploadMeeting(form);
      }

      if (!title.trim()) throw new ApiError(400, "Give the meeting a title.");
      if (mode === "paste" && !transcript.trim()) throw new ApiError(400, "Paste a transcript, or switch to an empty meeting.");

      return api.createMeeting({
        title: title.trim(),
        meeting_date: new Date(meetingDate).toISOString(),
        media_type: mediaType,
        source: mode === "paste" ? "upload" : "manual",
        participants: roster,
        tags: tagList,
        transcript_text: mode === "paste" ? transcript : undefined,
        generate_summary: generateSummary,
      });
    },
    onSuccess: (meeting) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Meeting created", `${meeting.title} is ready.`);
      close();
      router.push(`/view/${meeting.id}`);
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : "Something went wrong.";
      setError(message);
      toast.error("Could not create the meeting", message);
    },
  });

  const acceptFile = (chosen: File | null | undefined) => {
    if (!chosen) return;
    setFile(chosen);
    setError(null);
    if (!title.trim()) {
      setTitle(chosen.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="New meeting"
      description="Seed a meeting from a transcript, or create an empty one."
      icon={<Plus className="size-4" />}
      size="lg"
      footer={
        <>
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Create meeting
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {MODES.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setMode(option.key)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                mode === option.key
                  ? "border-purple-300 bg-purple-25 ring-1 ring-purple-200 dark:border-purple-500/40 dark:bg-purple-500/10 dark:ring-purple-500/30"
                  : "border-gray-200 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5",
              )}
            >
              <span className="block text-base font-medium text-gray-900 dark:text-gray-100">{option.label}</span>
              <span className="mt-0.5 block text-xs leading-4 text-gray-500 dark:text-gray-400">{option.hint}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required>
            {(id) => (
              <Input
                id={id}
                value={title}
                placeholder="Weekly product sync"
                onChange={(event) => setTitle(event.target.value)}
              />
            )}
          </Field>
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Recording type">
            {(id) => (
              <Select id={id} value={mediaType} onChange={(event) => setMediaType(event.target.value)}>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </Select>
            )}
          </Field>
          <Field label="Tags" hint="Comma separated">
            {(id) => (
              <Input id={id} value={tags} placeholder="Product, Planning" onChange={(event) => setTags(event.target.value)} />
            )}
          </Field>
        </div>

        {mode === "paste" && (
          <Field
            label="Transcript"
            hint="Timestamped lines, VTT/SRT cues or plain “Name: text” — all understood."
            required
          >
            {(id) => (
              <div className="space-y-2">
                <Textarea
                  id={id}
                  value={transcript}
                  rows={8}
                  placeholder={SAMPLE}
                  className="font-mono text-sm"
                  onChange={(event) => setTranscript(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setTranscript(SAMPLE)}
                  className="text-sm font-medium text-purple-600 hover:underline dark:text-purple-400"
                >
                  Insert a sample transcript
                </button>
              </div>
            )}
          </Field>
        )}

        {mode === "upload" && (
          <Field label="Transcript file" required>
            {() => (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  acceptFile(event.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors",
                  dragging
                    ? "border-purple-400 bg-purple-25 dark:bg-purple-500/10"
                    : "border-gray-200 dark:border-white/15",
                )}
              >
                {file ? (
                  <div className="flex items-center gap-3">
                    <FileUp className="size-5 text-purple-600" />
                    <div className="text-left">
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      aria-label="Remove file"
                      className="rounded p-1 text-gray-400 hover:text-red-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="size-6 text-gray-400" />
                    <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                      Drop a transcript here, or{" "}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="font-medium text-purple-600 hover:underline"
                      >
                        browse
                      </button>
                    </p>
                    <p className="mt-1 text-sm text-gray-500">.txt · .vtt · .srt · .json — up to 5MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.vtt,.srt,.json,text/plain,application/json"
                  className="hidden"
                  onChange={(event) => acceptFile(event.target.files?.[0])}
                />
              </div>
            )}
          </Field>
        )}

        <Field label="Participants" hint="Names here are matched against the transcript's speakers.">
          {() => (
            <div className="space-y-2">
              {participants.map((person, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={person.name}
                    placeholder="Full name"
                    onChange={(event) =>
                      setParticipants((current) =>
                        current.map((p, i) => (i === index ? { ...p, name: event.target.value } : p)),
                      )
                    }
                  />
                  <Input
                    value={person.email}
                    type="email"
                    placeholder="email@company.com"
                    onChange={(event) =>
                      setParticipants((current) =>
                        current.map((p, i) => (i === index ? { ...p, email: event.target.value } : p)),
                      )
                    }
                  />
                  <Button
                    aria-label="Remove participant"
                    className="shrink-0 px-2.5"
                    disabled={participants.length === 1}
                    onClick={() => setParticipants((current) => current.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                icon={<Plus className="size-3.5" />}
                onClick={() => setParticipants((current) => [...current, { name: "", email: "" }])}
              >
                Add participant
              </Button>
            </div>
          )}
        </Field>

        {mode !== "blank" && (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-purple-25 p-3 ring-1 ring-inset ring-purple-100 dark:bg-purple-500/5 dark:ring-purple-500/20">
            <Checkbox
              checked={generateSummary}
              onChange={(event) => setGenerateSummary(event.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="flex items-center gap-1.5 text-base font-medium text-gray-900 dark:text-gray-100">
                <Sparkles className="size-3.5 text-purple-600" />
                Generate AI notes
              </span>
              <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">
                Overview, chapters and action items, extracted from the transcript.
              </span>
            </span>
          </label>
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-base text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
