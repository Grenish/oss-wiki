"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
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
      <div className="mt-5 space-x-4">
        <Button
          variant={"ghost"}
          className="border"
          onClick={() => {
            router.push("/docs");
          }}
        >
          About
        </Button>
        <Button variant={"secondary"}>Explore</Button>
      </div>
    </div>
  );
}
