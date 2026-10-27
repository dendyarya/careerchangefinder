/** Shown only where drafts are visible (staging, local): this text still needs a human review. */
export function DraftBadge() {
  return (
    <p className="m-0 self-start rounded-sm bg-[#FFF4D6] px-2.5 py-1 text-small font-bold text-ink">
      Draft text, not yet reviewed
    </p>
  );
}
