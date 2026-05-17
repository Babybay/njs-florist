import { AdminPageHeader } from "@/components/admin/admin-shell";
import { UserRoleSelect } from "@/components/admin/user-role-select";
import { EmptyState, tagClass } from "@/components/admin/ui";
import { getCurrentUser } from "@/lib/auth";
import { listUsersAction } from "@/server/actions/user.actions";

export const metadata = {
  title: "Admin Pengguna",
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, current] = await Promise.all([listUsersAction(), getCurrentUser()]);
  const isSuperAdmin = current?.role === "SUPER_ADMIN";

  return (
    <>
      <AdminPageHeader
        title="Pengguna"
        icon="👤"
        description="Daftar akun yang sudah pernah sign-in. Role diubah oleh SUPER_ADMIN."
      />

      {!isSuperAdmin ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50/60 px-4 py-2.5 text-xs text-amber-900">
          Hanya <strong>SUPER_ADMIN</strong> yang bisa mengubah role. Saat ini kamu read-only.
        </div>
      ) : null}

      {users.length === 0 ? (
        <EmptyState icon="👤" title="Belum ada pengguna terdaftar" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200/80 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-stone-50/70 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Nama</th>
                <th className="px-4 py-2.5">Pesanan</th>
                <th className="px-4 py-2.5">Bergabung</th>
                <th className="px-4 py-2.5">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((user) => {
                const isSelf = current?.id === user.id;
                const disabled = !isSuperAdmin;
                return (
                  <tr key={user.id} className="transition hover:bg-stone-50/70">
                    <td className="px-4 py-3 font-medium text-stone-900">
                      <div className="flex items-center gap-2">
                        <span>{user.email}</span>
                        {isSelf ? <span className={tagClass("rose")}>kamu</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{user.name ?? "—"}</td>
                    <td className="px-4 py-3 text-stone-600">{user._count.orders}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {new Date(user.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <UserRoleSelect
                        userId={user.id}
                        currentRole={user.role}
                        disabled={disabled}
                        disabledReason={
                          disabled ? "Butuh role SUPER_ADMIN untuk mengubah." : undefined
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
