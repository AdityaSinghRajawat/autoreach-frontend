import { Braces } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

import { placeholders } from "../placeholders";

interface PlaceholderPickerProps {
  onInsert: (token: string) => void;
}

export function PlaceholderPicker({ onInsert }: PlaceholderPickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary-soft">
        <Braces className="size-3.5" aria-hidden />
        Insert placeholder
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>Filled in for each person</DropdownMenuLabel>
        {placeholders.map((placeholder) => (
          <DropdownMenuItem key={placeholder.token} onSelect={() => onInsert(placeholder.token)}>
            <span className="flex-1">{placeholder.label}</span>
            <code className="font-mono text-[10px] text-ink-3">{placeholder.token}</code>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
