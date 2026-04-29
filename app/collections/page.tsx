'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/navigation';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';
import type { AppTool } from '@/lib/get-tools';

type Collection = {
  id: string;
  name: string;
  toolIds: string[];
};

const STORAGE_KEY = 'peakly.collections.v1';

export default function CollectionsPage() {
  const [tools, setTools] = useState<AppTool[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [name, setName] = useState('');
  const [selectedTool, setSelectedTool] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');

  useEffect(() => {
    void fetch('/api/tools')
      .then((response) => response.json())
      .then((payload: { tools?: AppTool[] }) => {
        const list = payload.tools ?? [];
        setTools(list);
        setSelectedTool(list[0]?.id ?? '');
      });
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Collection[];
      setCollections(parsed);
      setSelectedCollection(parsed[0]?.id ?? '');
    }
  }, []);

  const persist = (next: Collection[]) => {
    setCollections(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const createCollection = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next: Collection[] = [...collections, { id: crypto.randomUUID(), name: trimmed, toolIds: [] }];
    persist(next);
    setName('');
    setSelectedCollection(next[next.length - 1]?.id ?? '');
  };

  const addTool = () => {
    if (!selectedCollection || !selectedTool) return;
    const next = collections.map((collection) =>
      collection.id !== selectedCollection
        ? collection
        : {
            ...collection,
            toolIds: collection.toolIds.includes(selectedTool) ? collection.toolIds : [...collection.toolIds, selectedTool],
          }
    );
    persist(next);
  };

  const mapped = useMemo(
    () =>
      collections.map((collection) => ({
        ...collection,
        tools: collection.toolIds
          .map((id) => tools.find((tool) => tool.id === id))
          .filter(Boolean) as AppTool[],
      })),
    [collections, tools]
  );

  return (
    <PremiumPageShell>
      <Navigation />
      <div className="container mx-auto px-4 py-7 space-y-6">
        <div>
          <h1 className="premium-hero-title text-[46px] font-extrabold leading-[1.05] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
            Collections IA
          </h1>
          <p className="text-white/55 mt-2">Crée des stacks privées et partage tes sélections d’outils.</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0d0d1a] p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nom de la collection"
            className="rounded-lg border border-white/15 bg-[#0a1224] px-3 py-2 text-sm text-white"
          />
          <button onClick={createCollection} className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:border-accent">
            Créer
          </button>
          <div className="text-xs text-white/50 flex items-center">{collections.length} collection(s)</div>
        </div>

        {collections.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-[#0d0d1a] p-4 grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-3">
            <select
              value={selectedCollection}
              onChange={(event) => setSelectedCollection(event.target.value)}
              className="rounded-lg border border-white/15 bg-[#0a1224] px-3 py-2 text-sm text-white"
            >
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
            <select
              value={selectedTool}
              onChange={(event) => setSelectedTool(event.target.value)}
              className="rounded-lg border border-white/15 bg-[#0a1224] px-3 py-2 text-sm text-white"
            >
              {tools.map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.name}
                </option>
              ))}
            </select>
            <button onClick={addTool} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
              Ajouter
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mapped.map((collection) => (
            <div key={collection.id} className="rounded-xl border border-white/10 bg-[#0d0d1a] p-4">
              <p className="font-bold text-white">{collection.name}</p>
              <div className="mt-3 space-y-2">
                {collection.tools.length === 0 ? (
                  <p className="text-sm text-white/45">Aucun outil pour l’instant.</p>
                ) : (
                  collection.tools.map((tool) => (
                    <Link key={tool.id} href={`/tool/${tool.id}`} className="block rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white hover:border-accent">
                      {tool.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PremiumPageShell>
  );
}
