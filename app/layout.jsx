import "./globals.css";

export const metadata = {
  title: "Table Kit",
  description: "DM and player companion for editable character sheets, d6 rolls, and rules reference."
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f2e8"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
