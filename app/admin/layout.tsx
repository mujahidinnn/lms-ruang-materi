import AppShell from "@/components/app/AppShell";
import AccountFoot from "@/components/app/AccountFoot";
import { requireAdmin } from "@/lib/dal";

// Shell only. Every page and action still checks the admin role itself.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AppShell set="admin" account={<Akun />}>
      {children}
    </AppShell>
  );
}

async function Akun() {
  const user = await requireAdmin();
  return <AccountFoot email={user.email} />;
}
