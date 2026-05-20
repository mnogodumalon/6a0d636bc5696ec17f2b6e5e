import { useDashboardData } from '@/hooks/useDashboardData';
import type { FeierDerZahl1 } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate, displayLookup } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { IconAlertCircle, IconTool, IconRefresh, IconCheck, IconPlus, IconPencil, IconTrash, IconUsers, IconCalendar, IconMapPin, IconSparkles, IconSearch, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FeierDerZahl1Dialog } from '@/components/dialogs/FeierDerZahl1Dialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';

const APPGROUP_ID = '6a0d636bc5696ec17f2b6e5e';
const REPAIR_ENDPOINT = '/claude/build/repair';

const ANLASS_COLORS: Record<string, string> = {
  erster_geburtstag: 'bg-pink-100 text-pink-700',
  erster_jahrestag: 'bg-purple-100 text-purple-700',
  erster_arbeitstag: 'bg-blue-100 text-blue-700',
  erster_schultag: 'bg-amber-100 text-amber-700',
  sonstiges: 'bg-slate-100 text-slate-700',
};

export default function DashboardOverview() {
  const {
    feierDerZahl1,
    loading, error, fetchAll,
  } = useDashboardData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<FeierDerZahl1 | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeierDerZahl1 | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return feierDerZahl1;
    return feierDerZahl1.filter(f => {
      const { vorname, nachname, ort, botschaft } = f.fields;
      return [vorname, nachname, ort, botschaft].some(v => v?.toLowerCase().includes(q));
    });
  }, [feierDerZahl1, search]);

  const totalTeilnehmer = useMemo(() =>
    feierDerZahl1.reduce((sum, f) => sum + (f.fields.teilnehmerzahl ?? 0), 0),
    [feierDerZahl1]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteFeierDerZahl1Entry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feiern</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Besondere erste Momente im Überblick</p>
        </div>
        <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }}>
          <IconPlus size={16} className="mr-1.5 shrink-0" />
          Neue Feier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Feiern gesamt"
          value={String(feierDerZahl1.length)}
          description="Eingetragen"
          icon={<IconSparkles size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Teilnehmer"
          value={String(totalTeilnehmer)}
          description="Über alle Feiern"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Mit Foto"
          value={String(feierDerZahl1.filter(f => f.fields.foto).length)}
          description="Feiern mit Bild"
          icon={<IconCalendar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Mit Botschaft"
          value={String(feierDerZahl1.filter(f => f.fields.botschaft).length)}
          description="Persönliche Nachrichten"
          icon={<IconMapPin size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none shrink-0" />
        <Input
          className="pl-9 pr-9"
          placeholder="Suchen nach Name, Ort, Botschaft…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearch('')}
          >
            <IconX size={14} />
          </button>
        )}
      </div>

      {/* Gallery */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <IconSparkles size={48} className="text-muted-foreground" stroke={1.5} />
          <div>
            <p className="font-medium text-foreground">Noch keine Feiern eingetragen</p>
            <p className="text-sm text-muted-foreground mt-1">Trage jetzt den ersten besonderen Moment ein.</p>
          </div>
          <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }}>
            <IconPlus size={16} className="mr-1.5 shrink-0" />
            Erste Feier anlegen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(feier => (
            <FeierCard
              key={feier.record_id}
              feier={feier}
              onEdit={() => { setEditRecord(feier); setDialogOpen(true); }}
              onDelete={() => setDeleteTarget(feier)}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      <FeierDerZahl1Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={async (fields) => {
          if (editRecord) {
            await LivingAppsService.updateFeierDerZahl1Entry(editRecord.record_id, fields);
          } else {
            await LivingAppsService.createFeierDerZahl1Entry(fields);
          }
          fetchAll();
        }}
        defaultValues={editRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['FeierDerZahl1']}
        enablePhotoLocation={AI_PHOTO_LOCATION['FeierDerZahl1']}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Feier löschen"
        description={`Soll die Feier von ${deleteTarget?.fields.vorname ?? ''} ${deleteTarget?.fields.nachname ?? ''} wirklich gelöscht werden?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function FeierCard({
  feier,
  onEdit,
  onDelete,
}: {
  feier: FeierDerZahl1;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { vorname, nachname, datum_feier, ort, teilnehmerzahl, anlass, botschaft, foto } = feier.fields;
  const anlassKey = typeof anlass === 'object' && anlass !== null && 'key' in anlass ? (anlass as { key: string }).key : '';
  const anlassLabel = displayLookup(anlass);
  const colorClass = ANLASS_COLORS[anlassKey] ?? ANLASS_COLORS['sonstiges'];
  const name = [vorname, nachname].filter(Boolean).join(' ') || 'Unbekannt';

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
      {/* Photo or placeholder */}
      <div className="aspect-video bg-muted relative overflow-hidden shrink-0">
        {foto ? (
          <img
            src={foto}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IconSparkles size={36} className="text-muted-foreground" stroke={1.5} />
          </div>
        )}
        {anlassLabel !== '—' && (
          <div className="absolute top-2 left-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
              {anlassLabel}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{name}</h3>

        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          {datum_feier && (
            <div className="flex items-center gap-1.5 min-w-0">
              <IconCalendar size={14} className="shrink-0" />
              <span className="truncate">{formatDate(datum_feier)}</span>
            </div>
          )}
          {ort && (
            <div className="flex items-center gap-1.5 min-w-0">
              <IconMapPin size={14} className="shrink-0" />
              <span className="truncate">{ort}</span>
            </div>
          )}
          {teilnehmerzahl != null && (
            <div className="flex items-center gap-1.5 min-w-0">
              <IconUsers size={14} className="shrink-0" />
              <span className="truncate">{teilnehmerzahl} Teilnehmer</span>
            </div>
          )}
        </div>

        {botschaft && (
          <p className="text-sm text-foreground/70 italic line-clamp-2 mt-1">
            „{botschaft}"
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <IconPencil size={14} className="mr-1 shrink-0" />
            Bearbeiten
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 shrink-0" onClick={onDelete}>
            <IconTrash size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
