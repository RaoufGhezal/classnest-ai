import type { ReactNode } from "react";
import { AuthRouteGuard } from "@/components/auth-route-guard";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <AuthRouteGuard mode="public">{children}</AuthRouteGuard>;
}
