import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Field, FieldLabel, FieldDescription, FieldGroup } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Section } from './section';

export function PrimitivesForms() {
  return (
    <Section id="primitivos-forms" title="Forms">
      <div className="grid gap-6 md:grid-cols-2">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="ds-input-empty">Input vazio</FieldLabel>
            <Input id="ds-input-empty" placeholder="Digite algo" />
            <FieldDescription>Estado padrão.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="ds-input-disabled">Desativado</FieldLabel>
            <Input id="ds-input-disabled" placeholder="Indisponível" disabled />
          </Field>
          <Field>
            <FieldLabel htmlFor="ds-input-error">Com erro</FieldLabel>
            <Input id="ds-input-error" defaultValue="email-invalido" aria-invalid />
            <FieldDescription className="text-destructive">E-mail inválido.</FieldDescription>
          </Field>
        </FieldGroup>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-select">Select</Label>
            <Select>
              <SelectTrigger id="ds-select" className="w-60">
                <SelectValue placeholder="Selecione…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opt-1">Opção 1</SelectItem>
                <SelectItem value="opt-2">Opção 2</SelectItem>
                <SelectItem value="opt-3">Opção 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="ds-cb" />
            <Label htmlFor="ds-cb">Checkbox</Label>
          </div>

          <div className="flex items-center gap-2">
            <Toggle aria-label="toggle simples">Toggle</Toggle>
          </div>

          <div>
            <Label className="mb-2 block">ToggleGroup (single)</Label>
            <ToggleGroup type="single" defaultValue="b">
              <ToggleGroupItem value="a">A</ToggleGroupItem>
              <ToggleGroupItem value="b">B</ToggleGroupItem>
              <ToggleGroupItem value="c">C</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>
    </Section>
  );
}
