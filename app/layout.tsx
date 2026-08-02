import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "Fanfic Copilot — AI 同人写作助手",
    template: "%s | Fanfic Copilot",
  },
  description:
    "基于大语言模型的同人小说智能写作平台。从大纲推演到场景执笔，AI 全程辅助你的创作之旅。",
  keywords: ["同人小说", "AI写作", "小说大纲", "DeepSeek", "创作工具"],
  authors: [{ name: "Fanfic Copilot" }],
  openGraph: {
    title: "Fanfic Copilot — AI 同人写作助手",
    description: "从大纲推演到场景执笔，AI 全程辅助你的同人创作。",
    type: "website",
    locale: "zh_CN",
    siteName: "Fanfic Copilot",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}