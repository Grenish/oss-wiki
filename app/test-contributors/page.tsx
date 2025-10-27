'use client';

import { ContributorTracker } from '@/components/contributor-tracker';

export default function TestContributorsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Contributor Tracker Test</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Introduction Page Contributors</h2>
        <ContributorTracker docPath="index.mdx" />
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Git and GitHub Page Contributors</h2>
        <ContributorTracker docPath="get-started/1-git-and-github.mdx" />
      </div>
    </div>
  );
}