import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "ClassNest AI",
  description: "Organize your study materials.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
