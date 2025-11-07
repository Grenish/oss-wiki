"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center relative p-4 text-center">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Open Source Wiki
        </h2>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
          Open Source Contribution empowers developers to collaborate, learn,
          and build software that&apos;s freely available to everyone. By
          sharing knowledge and code, we can create tools that benefit the
          entire community.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <Link href="/docs">
          <Button
            variant="outline"
            size="lg"
            className="text-foreground hover:bg-accent hover:text-accent-background"
          >
            About
          </Button>
        </Link>
        <Link href={"/docs/get-started/1-git-and-github"}>
          <Button
            variant="default"
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Explore
          </Button>
        </Link>
      </div>
    </div>
  );
}
