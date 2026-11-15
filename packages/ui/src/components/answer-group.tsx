"use client";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { useId } from "react";
export function AnswerRow({ value, label }: { value: string; label: string }) {
  return (
    <Radio.Root
      value={value}
      className="lv-press flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-row bg-card px-4 py-3 font-semibold ring-1 ring-border outline-none data-checked:bg-violet-wash data-checked:ring-mint focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden="true"
        className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-mint"
      >
        <Radio.Indicator className="size-2.5 rounded-full bg-mint" />
      </span>
      <span>{label}</span>
    </Radio.Root>
  );
}
export function AnswerGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: string; label: string }[];
  value?: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <fieldset>
      <legend id={id} className="sr-only">
        {label}
      </legend>
      <RadioGroup
        aria-labelledby={id}
        value={value ?? ""}
        onValueChange={onChange}
        className="flex flex-col gap-2"
      >
        {options.map((option) => (
          <AnswerRow key={option.value} {...option} />
        ))}
      </RadioGroup>
    </fieldset>
  );
}
