// next.config.ts
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const withMDX = createMDX({
    extension: /\.mdx?$/,
});

const nextConfig: NextConfig = {
    pageExtensions: ["ts", "tsx", "mdx"],
};

export default withMDX(nextConfig);
