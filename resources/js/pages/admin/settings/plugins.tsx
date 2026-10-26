import { SettingsSection } from '@/components/settings/settings-section';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { router, usePage } from '@inertiajs/react';
import { togglePlugin } from '@/actions/App/Http/Controllers/Admin/SettingController';
import type { Plugin } from '@/types/settings';
import { toast } from 'sonner';

export default function PluginsTab({ data }: { data: Plugin[] }) {
  const page = usePage();
  const { currentTeam, standaloneModules = [] } = page.props as {
    currentTeam?: any;
    standaloneModules?: Array<{
      id: number; title: string; slug: string; label: string; icon: string;
    }>;
  };
  const teamSlug = currentTeam!.slug;
  function toggle(plugin: Plugin) {
    router.patch(
      togglePlugin([teamSlug, plugin.id]).url,
      { is_active: !plugin.is_active },
      {
        preserveScroll: true,
        onSuccess: () => toast.success(`${plugin.name} ${plugin.is_active ? 'deactivated' : 'activated'}.`),
      }
    );
  }

  return (
    <SettingsSection title="Plugins" description="Extend the CMS with self-contained feature packages.">
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No plugins found. Drop a plugin folder into <code>app/Plugins</code> to get started.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plugin</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((plugin) => (
              <TableRow key={plugin.id}>
                <TableCell>
                  <p className="font-medium">{plugin.name}</p>
                  <p className="text-xs text-muted-foreground">{plugin.description}</p>
                </TableCell>
                <TableCell className="text-sm">{plugin.version ?? '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{plugin.author ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={plugin.is_active ? 'default' : 'outline'}>{plugin.is_active ? 'Active' : 'Inactive'}</Badge>
                </TableCell>
                <TableCell className="flex justify-end items-center gap-2">
                  <Button size="sm" variant="ghost">Update</Button>
                  <Switch checked={plugin.is_active} onCheckedChange={() => toggle(plugin)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SettingsSection>
  );
}