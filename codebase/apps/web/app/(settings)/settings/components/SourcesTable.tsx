'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatRelativeTime } from '@/lib/utils/formatters';
import type { Source, SourceType } from '@company-builder/types';

interface SourcesTableProps {
  initialSources: Source[];
}

const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: 'rss', label: 'RSS Feed' },
  { value: 'api', label: 'API' },
  { value: 'webpage', label: 'Webpage' },
  { value: 'research_db', label: 'Research DB' },
];

interface SourceForm {
  name: string;
  url: string;
  source_type: SourceType;
  scan_frequency_hours: number;
}

const DEFAULT_FORM: SourceForm = {
  name: '',
  url: '',
  source_type: 'rss',
  scan_frequency_hours: 24,
};

export function SourcesTable({ initialSources }: SourcesTableProps) {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [form, setForm] = useState<SourceForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Source | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  }

  function openEdit(source: Source) {
    setEditingSource(source);
    setForm({
      name: source.name,
      url: source.url ?? '',
      source_type: source.source_type,
      scan_frequency_hours:
        (source.config as any)?.scan_frequency_hours ?? 24,
    });
    setError(null);
  }

  function closeModal() {
    setShowAddModal(false);
    setEditingSource(null);
    setForm(DEFAULT_FORM);
    setError(null);
  }

  async function handleAdd() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          url: form.url || null,
          source_type: form.source_type,
          config: { scan_frequency_hours: form.scan_frequency_hours },
          is_active: true,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to add source');
      }
      const created = await res.json();
      setSources((prev) => [created, ...prev]);
      closeModal();
      showFeedback(`"${created.name}" added successfully.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!editingSource) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings/sources/${editingSource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          url: form.url || null,
          source_type: form.source_type,
          config: { scan_frequency_hours: form.scan_frequency_hours },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to update source');
      }
      const updated = await res.json();
      setSources((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      closeModal();
      showFeedback(`"${updated.name}" updated successfully.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(source: Source) {
    try {
      const res = await fetch(`/api/settings/sources/${source.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSources((prev) => prev.filter((s) => s.id !== source.id));
        showFeedback(`"${source.name}" deleted.`);
      }
    } finally {
      setToDelete(null);
    }
  }

  async function handleToggleActive(source: Source) {
    setToggling(source.id);
    try {
      const res = await fetch(`/api/settings/sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !source.is_active }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSources((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        showFeedback(
          `"${source.name}" ${updated.is_active ? 'enabled' : 'disabled'}.`
        );
      }
    } finally {
      setToggling(null);
    }
  }

  const isEditing = editingSource !== null;
  const dialogOpen = showAddModal || isEditing;

  return (
    <div className="space-y-4">
      {/* Feedback toast */}
      {feedback && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 shadow-lg">
          {feedback}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          className="gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs"
          onClick={() => { setShowAddModal(true); setForm(DEFAULT_FORM); setError(null); }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Source
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Name', 'URL', 'Type', 'Active', 'Last Scanned', 'Frequency', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sources.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                  No sources configured. Add your first source to get started.
                </td>
              </tr>
            ) : (
              sources.map((source) => (
                <tr key={source.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{source.name}</td>
                  <td className="px-4 py-3 max-w-[200px]">
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline truncate block"
                      >
                        {source.url}
                      </a>
                    ) : (
                      <span className="text-slate-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                      {source.source_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(source)}
                      disabled={toggling === source.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        source.is_active ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          source.is_active ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {source.last_scanned_at
                      ? formatRelativeTime(source.last_scanned_at)
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {(source.config as any)?.scan_frequency_hours
                      ? `${(source.config as any).scan_frequency_hours}h`
                      : '24h'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-violet-600 hover:bg-violet-50"
                        onClick={() => openEdit(source)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setToDelete(source)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit source dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeModal(); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Source' : 'Add New Source'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm">Name</Label>
              <Input
                id="name"
                placeholder="e.g., HackerNews RSS"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="url" className="text-sm">URL</Label>
              <Input
                id="url"
                placeholder="https://..."
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Source Type</Label>
              <Select
                value={form.source_type}
                onValueChange={(v) => setForm((f) => ({ ...f, source_type: v as SourceType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="freq" className="text-sm">Scan Frequency (hours)</Label>
              <Input
                id="freq"
                type="number"
                min={1}
                max={168}
                value={form.scan_frequency_hours}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scan_frequency_hours: parseInt(e.target.value) || 24 }))
                }
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={isEditing ? handleEdit : handleAdd}
              disabled={saving || !form.name.trim()}
            >
              {saving
                ? isEditing ? 'Saving...' : 'Adding...'
                : isEditing ? 'Save Changes' : 'Add Source'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={!!toDelete}
        title="Delete Source"
        description={`Are you sure you want to delete "${toDelete?.name}"? This will also remove all content items from this source. This cannot be undone.`}
        confirmLabel="Delete Source"
        variant="destructive"
        onConfirm={() => toDelete && handleDelete(toDelete)}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
