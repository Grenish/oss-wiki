'use client';

import { cn } from '@/lib/cn';
import { Calendar, GitCommit } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Contributor = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: string;
  contributions: number;
  last_commit_date?: string;
};

type ContributorTrackerProps = {
  docPath: string;
  className?: string;
};

export function ContributorTracker({ docPath, className }: ContributorTrackerProps) {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create an abort controller for cleanup
    const controller = new AbortController();
    let cancelled = false;
    
    // If no docPath, immediately set loading to false and clear contributors
    if (!docPath) {
      if (!cancelled) {
        setContributors([]);
        setLoading(false);
        setError(null);
      }
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    async function fetchContributors() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/contributors?docPath=${encodeURIComponent(docPath)}`, {
          signal: controller.signal
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch contributors');
        }
        
        const data = await response.json();
        if (!cancelled) {
          setContributors(data);
        }
      } catch (err) {
        if (!cancelled && err.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchContributors();
    
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [docPath]);

  if (loading) {
    return (
      <div className={cn("mt-8", className)}>
        <h3 className="text-lg font-semibold mb-4">Contributors</h3>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("mt-8", className)}>
        <h3 className="text-lg font-semibold mb-4">Contributors</h3>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-destructive text-sm">Failed to load contributors: {error}</p>
        </div>
      </div>
    );
  }

  if (contributors.length === 0) {
    return (
      <div className={cn("mt-8", className)}>
        <h3 className="text-lg font-semibold mb-4">Contributors</h3>
        <div className="rounded-lg border border-border/50 bg-card p-6 text-center">
          <p className="text-muted-foreground">
            Be the first to contribute to this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mt-8", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Contributors</h3>
        <span className="text-sm text-muted-foreground">
          {contributors.length} {contributors.length === 1 ? 'contributor' : 'contributors'}
        </span>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {contributors.map((contributor) => (
          <div 
            key={contributor.id} 
            className="group relative flex items-center gap-2 rounded-lg border border-border/50 bg-card p-2 hover:border-border hover:shadow-sm transition-all"
          >
            <Link 
              href={contributor.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 no-underline"
            >
              <div className="relative">
                <Image
                  src={contributor.avatar_url}
                  alt={contributor.login}
                  width={32}
                  height={32}
                  className="rounded-md ring-1 ring-border/50 object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {contributor.login}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GitCommit className="h-3 w-3" />
                  <span>{contributor.contributions}</span>
                  {contributor.last_commit_date && (
                    <>
                      <span className="mx-1">•</span>
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(contributor.last_commit_date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}