'use client';

import * as Select from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    options: { value: string; label: string }[];
    className?: string;
    disabled?: boolean;
}

export default function CustomSelect({
    value,
    onValueChange,
    placeholder = "Select an option",
    options,
    className = "",
    disabled = false
}: CustomSelectProps) {
    return (
        <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
            <Select.Trigger
                className={`w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none flex justify-between items-center text-base font-medium hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            >
                <Select.Value placeholder={placeholder} />
                <Select.Icon>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
                <Select.Content className="overflow-hidden bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50 max-h-[300px] w-[var(--radix-select-trigger-width)]">
                    <Select.Viewport className="p-1">
                        {options.map((option) => (
                            <Select.Item
                                key={option.value}
                                value={option.value}
                                className="text-white text-base p-2 rounded-lg hover:bg-white/10 outline-none cursor-pointer flex items-center relative select-none data-[highlighted]:bg-white/10 data-[highlighted]:text-primary"
                            >
                                <Select.ItemText>{option.label}</Select.ItemText>
                            </Select.Item>
                        ))}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
}
