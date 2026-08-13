import "./globals.css";

export const metadata = {
  title: "NPS · CS",
  description: "Ferramenta de acompanhamento de NPS dos clientes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
