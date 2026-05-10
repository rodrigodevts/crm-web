'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type PreferenceSwitchRowProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
};

export function PreferenceSwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  disabledReason,
}: PreferenceSwitchRowProps) {
  const helperId = `${id}-helper`;

  const switchEl = (
    <Switch
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-describedby={helperId}
    />
  );

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 space-y-1">
        <Label htmlFor={id} className="text-foreground text-sm font-medium">
          {label}
        </Label>
        <p id={helperId} className="text-muted-foreground text-sm">
          {description}
        </p>
      </div>
      {disabled && disabledReason ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>{switchEl}</span>
          </TooltipTrigger>
          <TooltipContent>{disabledReason}</TooltipContent>
        </Tooltip>
      ) : (
        switchEl
      )}
    </div>
  );
}
