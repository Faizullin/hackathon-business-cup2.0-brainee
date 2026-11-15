import { BRAINY_PRESETS, Brainy } from "@brainee/brainy";
export function BrandMark({ name }: { name: string }) {
  return (
    <p className="flex shrink-0 items-center gap-1 font-heading text-xl text-ink">
      <Brainy stats={BRAINY_PRESETS.now} mood={92} className="size-10" />
      {name}
    </p>
  );
}
