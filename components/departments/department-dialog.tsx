'use client';

import { useEffect, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDepartmentsControllerCreate } from '@/lib/generated/hooks/useDepartmentsControllerCreate';
import { useDepartmentsControllerUpdate } from '@/lib/generated/hooks/useDepartmentsControllerUpdate';
import { departmentsControllerListQueryKey } from '@/lib/generated/hooks/useDepartmentsControllerList';
import type { DepartmentResponseDto } from '@/lib/generated/types/DepartmentResponseDto';
import type {
  CreateDepartmentDto,
  CreateDepartmentDtoDistributionModeEnumKey,
} from '@/lib/generated/types/CreateDepartmentDto';
import type { UpdateDepartmentDto } from '@/lib/generated/types/UpdateDepartmentDto';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

type DistributionMode = CreateDepartmentDtoDistributionModeEnumKey;

const DISTRIBUTION_OPTIONS: ReadonlyArray<{ value: DistributionMode; label: string }> = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'RANDOM', label: 'Aleatório' },
  { value: 'BALANCED', label: 'Balanceado' },
  { value: 'SEQUENTIAL', label: 'Sequencial' },
];

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe um nome com pelo menos 2 caracteres')
    .max(100, 'Máximo de 100 caracteres'),
  active: z.boolean(),
  distributionMode: z.enum(['MANUAL', 'RANDOM', 'BALANCED', 'SEQUENTIAL']),
  greetingMessage: z.string().max(2000, 'Máximo de 2000 caracteres'),
  outOfHoursMessage: z.string().max(2000, 'Máximo de 2000 caracteres'),
  slaResponseMinutes: z.string(),
  slaResolutionMinutes: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_VALUES: FormValues = {
  name: '',
  active: true,
  distributionMode: 'MANUAL',
  greetingMessage: '',
  outOfHoursMessage: '',
  slaResponseMinutes: '',
  slaResolutionMinutes: '',
};

function toFormValues(department: DepartmentResponseDto): FormValues {
  return {
    name: department.name,
    active: department.active,
    distributionMode: department.distributionMode,
    greetingMessage: department.greetingMessage ?? '',
    outOfHoursMessage: department.outOfHoursMessage ?? '',
    slaResponseMinutes:
      department.slaResponseMinutes === null ? '' : String(department.slaResponseMinutes),
    slaResolutionMinutes:
      department.slaResolutionMinutes === null ? '' : String(department.slaResolutionMinutes),
  };
}

function parseSlaMinutes(raw: string): { ok: true; value: number | null } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: true, value: null };
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 1 || n > 43200) return { ok: false };
  return { ok: true, value: n };
}

type BackendValidationError = {
  errors?: Array<{ field: string; message: string }>;
  message?: string;
};

type AxiosLikeError = {
  response?: { status?: number; data?: BackendValidationError };
};

interface DepartmentDialogProps {
  mode: 'create' | 'edit';
  department?: DepartmentResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepartmentDialog({ mode, department, open, onOpenChange }: DepartmentDialogProps) {
  const queryClient = useQueryClient();
  const fieldId = useId();

  const create = useDepartmentsControllerCreate({ client: { client: apiClient } });
  const update = useDepartmentsControllerUpdate({ client: { client: apiClient } });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // reset() limpa todos os erros (incluindo `root`) — basta reagir à abertura/alvo.
  useEffect(() => {
    if (!open) return;
    reset(mode === 'edit' && department ? toFormValues(department) : DEFAULT_VALUES);
  }, [open, mode, department, reset]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const onSubmit = async (values: FormValues) => {
    const responseSla = parseSlaMinutes(values.slaResponseMinutes);
    if (!responseSla.ok) {
      setError('slaResponseMinutes', {
        message: 'Informe um número inteiro entre 1 e 43200 (em minutos).',
      });
      return;
    }
    const resolutionSla = parseSlaMinutes(values.slaResolutionMinutes);
    if (!resolutionSla.ok) {
      setError('slaResolutionMinutes', {
        message: 'Informe um número inteiro entre 1 e 43200 (em minutos).',
      });
      return;
    }

    const payload = {
      name: values.name.trim(),
      active: values.active,
      distributionMode: values.distributionMode,
      greetingMessage: values.greetingMessage.trim() === '' ? null : values.greetingMessage,
      outOfHoursMessage: values.outOfHoursMessage.trim() === '' ? null : values.outOfHoursMessage,
      slaResponseMinutes: responseSla.value,
      slaResolutionMinutes: resolutionSla.value,
    } satisfies CreateDepartmentDto & UpdateDepartmentDto;

    try {
      if (mode === 'create') {
        const created = await create.mutateAsync({ data: payload });
        toast.success(`Departamento "${created.name}" criado.`);
      } else if (department) {
        const updated = await update.mutateAsync({ id: department.id, data: payload });
        toast.success(`Departamento "${updated.name}" atualizado.`);
      }

      void queryClient.invalidateQueries({
        queryKey: departmentsControllerListQueryKey(),
        exact: false,
      });
      handleClose();
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      const status = axiosErr?.response?.status;
      const data = axiosErr?.response?.data;

      if (status === 409 && data?.message) {
        setError('name', { message: data.message });
        return;
      }
      if (status === 400 && Array.isArray(data?.errors) && data.errors.length > 0) {
        let mappedAny = false;
        for (const issue of data.errors) {
          if (issue.field in DEFAULT_VALUES) {
            setError(issue.field as keyof FormValues, { message: issue.message });
            mappedAny = true;
          }
        }
        if (!mappedAny)
          setError('root', { message: data.message ?? 'Não foi possível validar os dados.' });
        return;
      }
      if (typeof status === 'number' && status >= 500) {
        setError('root', { message: 'Erro no servidor. Tente novamente em instantes.' });
        return;
      }
      setError('root', { message: 'Sem conexão com o servidor.' });
    }
  };

  const isCreate = mode === 'create';
  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-3rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Novo departamento' : 'Editar departamento'}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Cadastre um departamento e defina como os atendimentos serão distribuídos.'
              : 'Atualize os dados do departamento.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-name`}>Nome</FieldLabel>
              <Input
                id={`${fieldId}-name`}
                autoComplete="off"
                placeholder="Ex.: Suporte"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.name.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor={`${fieldId}-distribution`}>Distribuição</FieldLabel>
              <Controller
                control={control}
                name="distributionMode"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as DistributionMode)}
                  >
                    <SelectTrigger
                      id={`${fieldId}-distribution`}
                      aria-invalid={!!errors.distributionMode}
                    >
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTRIBUTION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>
                Como os tickets são distribuídos entre os atendentes.
              </FieldDescription>
            </Field>

            <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
              <div className="flex flex-col">
                <FieldLabel htmlFor={`${fieldId}-active`} className="text-sm font-medium">
                  Ativo
                </FieldLabel>
                <FieldDescription>
                  Departamentos inativos não recebem novos atendimentos.
                </FieldDescription>
              </div>
              <Controller
                control={control}
                name="active"
                render={({ field }) => (
                  <Switch
                    id={`${fieldId}-active`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <Field>
              <FieldLabel htmlFor={`${fieldId}-greeting`}>Mensagem de saudação</FieldLabel>
              <Textarea
                id={`${fieldId}-greeting`}
                rows={2}
                placeholder="Opcional. Enviada ao iniciar atendimento."
                aria-invalid={!!errors.greetingMessage}
                {...register('greetingMessage')}
              />
              {errors.greetingMessage ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.greetingMessage.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor={`${fieldId}-outofhours`}>Mensagem fora do horário</FieldLabel>
              <Textarea
                id={`${fieldId}-outofhours`}
                rows={2}
                placeholder="Opcional. Enviada fora do horário de funcionamento."
                aria-invalid={!!errors.outOfHoursMessage}
                {...register('outOfHoursMessage')}
              />
              {errors.outOfHoursMessage ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.outOfHoursMessage.message}
                </FieldDescription>
              ) : null}
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor={`${fieldId}-sla-response`}>SLA de resposta (min)</FieldLabel>
                <Input
                  id={`${fieldId}-sla-response`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={43200}
                  placeholder="—"
                  aria-invalid={!!errors.slaResponseMinutes}
                  {...register('slaResponseMinutes')}
                />
                {errors.slaResponseMinutes ? (
                  <FieldDescription className="text-destructive" role="alert">
                    {errors.slaResponseMinutes.message}
                  </FieldDescription>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor={`${fieldId}-sla-resolution`}>
                  SLA de resolução (min)
                </FieldLabel>
                <Input
                  id={`${fieldId}-sla-resolution`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={43200}
                  placeholder="—"
                  aria-invalid={!!errors.slaResolutionMinutes}
                  {...register('slaResolutionMinutes')}
                />
                {errors.slaResolutionMinutes ? (
                  <FieldDescription className="text-destructive" role="alert">
                    {errors.slaResolutionMinutes.message}
                  </FieldDescription>
                ) : null}
              </Field>
            </div>

            <FieldDescription className="text-muted-foreground">
              Editor de horário de funcionamento será adicionado em sprint futura. Os horários
              atuais são preservados.
            </FieldDescription>

            {errors.root ? (
              <FieldDescription className="text-destructive" role="alert">
                {errors.root.message}
              </FieldDescription>
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando…' : isCreate ? 'Criar departamento' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
