import { SettingsSection } from '@/components/settings/settings-section';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, router, usePage } from '@inertiajs/react';
import { updateBackupSettings, runBackup, destroyBackup, downloadBackup } from '@/actions/App/Http/Controllers/Admin/SettingController';
import type { BackupsSettings } from '@/types/settings';
import { toast } from 'sonner';
import { Download, Trash2 } from 'lucide-react';

export default function BackupsTab({ data }: { data: BackupsSettings }) {
  const page = usePage();
  const { currentTeam, standaloneModules = [] } = page.props as {
    currentTeam?: any;
    standaloneModules?: Array<{
      id: number; title: string; slug: string; label: string; icon: string;
    }>;
  };
  const teamSlug = currentTeam!.slug;
  const s = data.settings;
  const form = useForm({
    destination: s.destination ?? 'local',
    schedule: s.schedule ?? 'daily',
    retention_days: s.retention_days ?? 30,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    form.patch(updateBackupSettings(teamSlug).url, { preserveScroll: true, onSuccess: () => toast.success('Backup settings saved.') });
  }

  function runNow() {
    router.post(runBackup(teamSlug).url, {}, { preserveScroll: true, onSuccess: () => toast.success('Backup started.') });
  }

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    completed: 'default', running: 'secondary', pending: 'outline', failed: 'destructive',
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit}>
        <SettingsSection title="Backup schedule" actions={<Button type="button" onClick={runNow}>Create backup now</Button>}>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Destination</Label>
              <Select value={form.data.destination} onValueChange={(v) => form.setData('destination', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local disk</SelectItem>
                  <SelectItem value="s3">Amazon S3</SelectItem>
                  <SelectItem value="r2">Cloudflare R2</SelectItem>
                  <SelectItem value="spaces">DigitalOcean Spaces</SelectItem>
                  <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Schedule</Label>
              <Select value={form.data.schedule} onValueChange={(v) => form.setData('schedule', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">Disabled</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Retention (days)</Label>
              <Input type="number" value={form.data.retention_days} onChange={(e) => form.setData('retention_days', Number(e.target.value))} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={form.processing}>Save changes</Button>
          </div>
        </SettingsSection>
      </form>

      <SettingsSection title="Recent backups">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Created</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Disk</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((backup) => (
              <TableRow key={backup.id}>
                <TableCell className="text-sm">{backup.created_at}</TableCell>
                <TableCell className="text-sm capitalize">{backup.type}</TableCell>
                <TableCell className="text-sm">{backup.disk}</TableCell>
                <TableCell className="text-sm">{(backup.size_bytes / 1024 / 1024).toFixed(1)} MB</TableCell>
                <TableCell><Badge variant={statusVariant[backup.status] ?? 'outline'}>{backup.status}</Badge></TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button size="icon" variant="ghost" asChild>
                    <a href={downloadBackup([teamSlug, backup.id]).url}>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => router.delete(destroyBackup([teamSlug, backup.id]).url, { preserveScroll: true })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SettingsSection>
    </div>
  );
}