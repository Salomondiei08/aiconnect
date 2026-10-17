"use client";

import { useRouter } from "next/navigation";
import { NativeSelect } from "@/components/ui/native-select";

/** Passe d'une fiche à l'autre sans revenir à la liste. */
export function UserPicker({ current, users }: { current: string; users: { id: string; label: string }[] }) {
  const router = useRouter();
  return (
    <div className="w-full sm:w-72">
      <label htmlFor="user-picker" className="sr-only">Choisir un utilisateur</label>
      <NativeSelect id="user-picker" value={current} onChange={(e) => router.push(`/utilisateurs/${e.target.value}`)}>
        {users.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
      </NativeSelect>
    </div>
  );
}
