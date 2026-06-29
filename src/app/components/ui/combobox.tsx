import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command'
import { cn } from './utils'

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Selecionar...',
  searchPlaceholder = 'Pesquisar...',
  emptyText = 'Sem resultados.',
  className,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selected = React.useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  )

  /*
   * Filtro personalizado: pesquisa por LABEL (texto visível) e não pelo
   * value (UUID). Assim o cmdk gere o estado do input internamente,
   * evitando o bug de "uma letra por tecla" e garantindo que os items
   * ficam visíveis correctamente.
   */
  const filter = React.useCallback(
    (itemValue: string, search: string) => {
      if (!search) return 1
      const opt = options.find((o) => o.value === itemValue)
      if (!opt) return 0
      return opt.label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
    },
    [options],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className="truncate">
            {selected ? (
              selected.label
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command filter={filter}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={(current) => {
                    onValueChange(current === value ? '' : current)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      value === opt.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
