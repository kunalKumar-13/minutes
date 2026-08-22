"use client";

import { forwardRef, useId } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD =
  "w-full rounded-md border border-gray-200 bg-white px-3 text-base text-gray-900 shadow-e1 " +
  "placeholder:text-gray-400 transition-shadow focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-100 " +
  "disabled:bg-gray-50 disabled:text-gray-500 " +
  "dark:border-white/10 dark:bg-ink-500 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-purple-500/20";

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (id: string) => React.ReactNode;
}

/** Label + control + hint/error, so every form field is wired up identically. */
export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-base font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children(id)}
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : (
        hint && <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(FIELD, "h-9", className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(FIELD, "min-h-[96px] py-2 leading-6", className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(FIELD, "h-9 cursor-pointer pr-8", className)} {...props}>
        {children}
      </select>
    );
  },
);

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onValueChange: (value: string) => void;
  containerClassName?: string;
}

/** The rounded search field used in the transcript panel and the library. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onValueChange, className, containerClassName, placeholder = "Search", ...props },
  ref,
) {
  return (
    <div className={cn("relative", containerClassName)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
      <input
        ref={ref}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(
          "h-10 w-full rounded-lg border border-transparent bg-gray-50 pl-9 pr-9 text-base text-gray-900",
          "placeholder:text-gray-400 transition-colors focus:border-purple-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-100",
          "dark:bg-ink-600 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500/40 dark:focus:bg-ink-500 dark:focus:ring-purple-500/15",
          "[&::-webkit-search-cancel-button]:appearance-none",
          className,
        )}
        {...props}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onValueChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
});

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, ...props },
  ref,
) {
  const control = (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "size-4 shrink-0 cursor-pointer rounded border-gray-200 text-purple-600 transition-colors",
        "focus:ring-2 focus:ring-purple-200 focus:ring-offset-0 dark:border-white/20 dark:bg-ink-500",
        className,
      )}
      {...props}
    />
  );
  if (!label) return control;
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-base text-gray-700 dark:text-gray-300">
      {control}
      {label}
    </label>
  );
});
