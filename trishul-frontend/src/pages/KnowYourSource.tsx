import React from 'react';
import { PLACEHOLDERS } from '../data/placeholders';
import { ExternalLink } from 'lucide-react';

export default function KnowYourSource() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Know Your Source</h1>
        <p className="text-muted-foreground">External resources and references for the Trishul platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PLACEHOLDERS.KNOW_YOUR_SOURCE.map((source, index) => (
          <a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <span className="font-medium">{source.label}</span>
            <ExternalLink className="text-muted-foreground group-hover:text-primary transition-colors" size={20} />
          </a>
        ))}
      </div>
    </div>
  );
}
