"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();

  async function logout() {
    await api.get("/auth/logout");
    router.replace("/");
  }

  return (
    <main>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </main>
  );
}
