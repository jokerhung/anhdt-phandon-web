"use client";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SelectOption { value: string; label: string; description?: string }
interface Props { id: string; value: string; options: SelectOption[]; placeholder: string; searchPlaceholder?: string; emptyText?: string; disabled?: boolean; loading?: boolean; searchable?: boolean; open: boolean; onOpenChange(open: boolean): void; onChange(value: string): void }

export function SearchableSelect({ id, value, options, placeholder, searchPlaceholder = "Tìm kiếm…", emptyText = "Không có kết quả.", disabled, loading, searchable = true, open, onOpenChange, onChange }: Props) {
  const selected = options.find((option) => option.value === value);
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled || loading} className="min-h-11 w-full justify-between bg-background px-3 text-left text-base font-normal text-foreground sm:text-sm">
          <span className="min-w-0 truncate">{selected?.label ?? (loading ? "Đang tải…" : placeholder)}</span>
          {loading ? <Loader2 className="animate-spin opacity-60" /> : <ChevronsUpDown className="opacity-50" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)]" align="start">
        <Command>
          {searchable ? <CommandInput placeholder={searchPlaceholder} /> : null}
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} value={`${option.label} ${option.description ?? ""}`} onSelect={() => { onChange(option.value); onOpenChange(false); }}>
                  <Check className={cn("mr-2", value === option.value ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0"><span className="block truncate">{option.label}</span>{option.description ? <span className="block truncate text-xs text-muted-foreground">{option.description}</span> : null}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
