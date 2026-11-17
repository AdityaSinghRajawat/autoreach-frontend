import { useRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { Input, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

import { insertAtCaret, unknownPlaceholders } from "../placeholders";
import { PlaceholderPicker } from "./PlaceholderPicker";

type SharedProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  limit?: number;
};

type PlaceholderInputProps = SharedProps &
  (
    | ({ multiline: true } & Omit<
        TextareaHTMLAttributes<HTMLTextAreaElement>,
        "value" | "onChange" | "onBlur"
      >)
    | ({ multiline?: false } & Omit<
        InputHTMLAttributes<HTMLInputElement>,
        "value" | "onChange" | "onBlur"
      >)
  );

// A text field with a placeholder menu, a live length count and a warning for unknown placeholders.
export function PlaceholderInput({
  value,
  onChange,
  onBlur,
  limit,
  multiline,
  ...props
}: PlaceholderInputProps) {
  const fieldRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const unknown = unknownPlaceholders(value);

  const insert = (token: string) => {
    const next = insertAtCaret(fieldRef.current, value, token);
    onChange(next.value);
    requestAnimationFrame(() => {
      fieldRef.current?.focus();
      fieldRef.current?.setSelectionRange(next.caret, next.caret);
    });
  };

  const shared = {
    ref: fieldRef,
    value,
    onBlur,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
  };

  return (
    <div className="flex flex-col gap-1.5">
      {multiline ? (
        <Textarea
          {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          {...shared}
          className={cn("font-[inherit]", props.className)}
        />
      ) : (
        <Input {...(props as InputHTMLAttributes<HTMLInputElement>)} {...shared} />
      )}
      <div className="flex items-center justify-between gap-3">
        <PlaceholderPicker onInsert={insert} />
        {limit ? (
          <span
            className={cn(
              "font-mono text-xs tabular",
              value.length > limit ? "text-danger" : "text-ink-3",
            )}
          >
            {value.length}/{limit}
          </span>
        ) : null}
      </div>
      {unknown.length > 0 ? (
        <p className="text-xs text-warning">
          Not a placeholder AutoReach knows: {unknown.join(", ")}. Pick one from the menu.
        </p>
      ) : null}
    </div>
  );
}
