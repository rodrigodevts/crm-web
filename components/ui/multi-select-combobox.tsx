'use client';

import * as React from 'react';
import { ChevronsUpDownIcon, XIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  id: string;
  name: string;
}

export interface MultiSelectComboboxProps {
  value: ReadonlyArray<string>;
  onChange: (next: string[]) => void;
  options: ReadonlyArray<MultiSelectOption>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  triggerId?: string;
  'aria-invalid'?: boolean;
  className?: string;
}

export function MultiSelectCombobox({
  value,
  onChange,
  options,
  placeholder = 'Selecionar…',
  searchPlaceholder = 'Buscar…',
  emptyMessage = 'Nenhum resultado.',
  disabled,
  triggerId,
  'aria-invalid': ariaInvalid,
  className,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const listId = React.useId();
  const selectedSet = React.useMemo(() => new Set(value), [value]);
  // Mantém ordem estável baseada em `options`, não na ordem do array `value`.
  const selectedOptions = React.useMemo(
    () => options.filter((o) => selectedSet.has(o.id)),
    [options, selectedSet],
  );

  function toggle(id: string) {
    if (selectedSet.has(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  }

  function remove(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onChange(value.filter((v) => v !== id));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={triggerId}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn(
            'border-input bg-background hover:bg-accent flex min-h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm shadow-xs',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'aria-invalid:border-destructive',
            className,
          )}
        >
          <div className="flex flex-1 flex-wrap items-center gap-1">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedOptions.map((o) => (
                <Badge key={o.id} variant="secondary" className="gap-1 pr-1">
                  <span className="max-w-[12rem] truncate">{o.name}</span>
                  <span
                    role="button"
                    aria-label={`Remover ${o.name}`}
                    tabIndex={0}
                    onClick={(e) => remove(o.id, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onChange(value.filter((v) => v !== o.id));
                      }
                    }}
                    className="hover:bg-muted-foreground/20 inline-flex size-4 cursor-pointer items-center justify-center rounded-sm"
                  >
                    <XIcon className="size-3" aria-hidden="true" />
                  </span>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList id={listId}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const checked = selectedSet.has(o.id);
                return (
                  <CommandItem
                    key={o.id}
                    value={o.name}
                    onSelect={() => toggle(o.id)}
                    data-checked={checked}
                    aria-selected={checked}
                    className="data-[checked=true]:bg-accent/60 cursor-pointer data-[checked=true]:font-medium"
                  >
                    <span className="truncate">{o.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
