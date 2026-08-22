import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter, Poppins, Roboto } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

/*
 * Inter carries the app and the marketing body copy; DM Sans is display type on
 * the marketing site, the login screen and the meeting title. Roboto and Poppins
 * are loaded because they sit in the app's CSS fallback chain, but measuring the
 * running product shows Inter is what actually renders — getting this backwards
 * is what makes a clone feel subtly off.
 */
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Minutes — meeting notes and transcription workspace", template: "%s — Minutes" },
  description:
    "Transcribe, summarize, search and analyze your meetings. Interactive transcripts, AI summaries, action items and workspace-wide search.",
  manifest: "/site.webmanifest",
  applicationName: "Minutes",
  authors: [{ name: "Kunal Kumar" }],
  keywords: ["meeting notes", "transcription", "AI summaries", "action items"],
  openGraph: {
    title: "Minutes — meeting notes and transcription workspace",
    description:
      "Interactive transcripts, AI summaries, action items and workspace-wide search. A functional clone of the Fireflies.ai meeting assistant.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d0f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${inter.variable} ${roboto.variable} ${poppins.variable}`}>
      <head>
        {/*
          Applied before first paint so a dark-mode user never sees a white
          flash. Kept inline and tiny for exactly that reason.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ff-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark'){document.documentElement.classList.add('dark')}document.documentElement.style.colorScheme=t}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-app antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
