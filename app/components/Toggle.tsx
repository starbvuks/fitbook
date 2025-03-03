'use client'

import { Switch } from '@headlessui/react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export default function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <Switch.Group>
      <div className="flex items-center justify-between">
        {label && (
          <Switch.Label className="text-sm font-medium">
            {label}
          </Switch.Label>
        )}
        <Switch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={`${
            checked ? 'bg-accent-purple' : 'bg-background-soft'
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-offset-2 disabled:opacity-50`}
        >
          <span
            className={`${
              checked ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch>
      </div>
    </Switch.Group>
  )
} 