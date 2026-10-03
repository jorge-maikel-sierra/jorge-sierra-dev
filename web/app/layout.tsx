import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jorge Sierra — AI Engineer & Senior Full-Stack Developer",
  description:
    "Automatizo procesos, escalo sistemas y genero impacto real de negocio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
