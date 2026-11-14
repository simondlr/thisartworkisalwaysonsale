import { truncateAddress } from "@/lib/utils";

// Full address on desktop and truncated on mobile, or always truncated with `short`.
export function Address({ address, short }: { address?: string; short?: boolean }) {
  if (short) return <>{truncateAddress(address)}</>;
  return (
    <>
      <span className="hidden sm:inline">{address}</span>
      <span className="sm:hidden">{truncateAddress(address)}</span>
    </>
  );
}
