import "./globals.css";
import Nav from "../components/Nav";

export const metadata = {
  title: "Uthsav — Find & book event venues in Assam",
  description: "Discover, compare, and book event venues across Assam with 3D walkthroughs and protected payments.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Nav />
        {children}
      </body>
    </html>
  );
}
