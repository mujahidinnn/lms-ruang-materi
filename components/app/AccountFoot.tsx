import SignOutButton from "@/components/auth/SignOutButton";
import { requireUser } from "@/lib/dal";

export default function AccountFoot({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-2 text-sm lg:flex-col lg:items-stretch">
      <span className="hidden truncate px-4 text-zinc-500 lg:block">{email}</span>
      <SignOutButton className="min-h-11 w-full rounded-2xl px-4 text-left text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent" />
    </div>
  );
}

// The learner's foot; requireUser also sends a signed-out visitor to /masuk.
export async function UserFoot({ next }: { next: string }) {
  const user = await requireUser(next);
  return <AccountFoot email={user.email} />;
}
