import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "GC Sports - IIT Dharwad",
    description: "General Championship 25-26 - Inter-Hostel Sports Tournament",
};

export default function RootLayout({
    children,
}) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <div className="page-transition">{children}</div>
            </body>
        </html>
    );
}
