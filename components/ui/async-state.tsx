'use client';

import { AlertTriangle } from 'lucide-react';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function SectionLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-lg bg-white/10" />
      ))}
    </div>
  );
}

export function SectionError({
  title,
  description,
  onRetry,
  retryLabel = 'Reessayer',
}: {
  title: string;
  description: string;
  onRetry: () => void;
  retryLabel?: string;
}) {
  return (
    <Empty className="border border-red-500/30 bg-red-500/5">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-red-500/20 text-red-300">
          <AlertTriangle className="h-5 w-5" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onRetry}>{retryLabel}</Button>
      </EmptyContent>
    </Empty>
  );
}
