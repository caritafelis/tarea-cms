import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { UserSettings01Icon } from '@hugeicons/core-free-icons';

import {
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

import SettingsDialog from './settings-dialog';

export default function ProfileMenuItem() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={() => setOpen(true)}
                    className="cursor-pointer"
                >
                    <HugeiconsIcon
                        icon={UserSettings01Icon}
                        size={16}
                    />

                    <span>Settings</span>
                </SidebarMenuButton>
            </SidebarMenuItem>

            <SettingsDialog
                open={open}
                onOpenChange={setOpen}
            />
        </>
    );
}