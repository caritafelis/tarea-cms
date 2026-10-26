import { useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from '@/components/ui/sidebar';

import { HugeiconsIcon } from '@hugeicons/react';

import {
    LanguageSkillIcon,
    SecurityPasswordIcon,
    UserGroupIcon,
    UserRemove01Icon,
    UserSettings01Icon,
} from '@hugeicons/core-free-icons';
import ProfileForm from './profile-form';
import DeleteUser from '../delete-user';
import SecuritySettings from './security-settings';
import TeamSettings from './team-settings';
import type { Props as ManagePasskeysProps } from '@/components/manage-passkeys';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import { usePage } from '@inertiajs/react';

type SecurityProps = {
    passwordRules: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const items = [
    {
        key: 'profile',
        title: 'Profile',
        icon: UserSettings01Icon,
    },
    {
        key: 'security',
        title: 'Security',
        icon: SecurityPasswordIcon,
    },
    {
        key: 'teams',
        title: 'Teams',
        icon: UserGroupIcon,
    },
    {
        key: 'languages',
        title: 'Languages',
        icon: LanguageSkillIcon,
    },
    {
        key: 'danger',
        title: 'Delete Account',
        icon: UserRemove01Icon,
    },
] as const;

type Section = (typeof items)[number]['key'];

export default function SettingsDialog({
    open,
    onOpenChange,
}: Props) {
    const [section, setSection] =
        useState<Section>('profile');

    const { security } = usePage<{
        security: SecurityProps;
    }>().props;

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className="overflow-hidden p-0 md:max-h-[70dvh] md:max-w-[700px] lg:max-w-[800px]">
                <DialogHeader className="sr-only">
                    <DialogTitle className="sr-only">
                        Settings
                    </DialogTitle>

                    <DialogDescription className="sr-only">
                        Manage your account settings.
                    </DialogDescription>
                </DialogHeader>

                <SidebarProvider className="items-start">
                    <Sidebar
                        collapsible="none"
                        className="hidden border-r md:flex"
                    >
                        <SidebarContent>
                            <SidebarGroup>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {items.map((item) => (
                                            <SidebarMenuItem
                                                key={item.key}
                                            >
                                                <SidebarMenuButton
                                                    isActive={
                                                        section ===
                                                        item.key
                                                    }
                                                    onClick={() =>
                                                        setSection(
                                                            item.key
                                                        )
                                                    }
                                                >
                                                    <HugeiconsIcon
                                                        icon={
                                                            item.icon
                                                        }
                                                        size={
                                                            16
                                                        }
                                                    />

                                                    <span>
                                                        {
                                                            item.title
                                                        }
                                                    </span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </SidebarContent>
                    </Sidebar>

                    <main className="h-[90dvh] flex-1 overflow-y-auto p-6">
                        {section === 'profile' && (
                            <ProfileForm
                                onClose={() =>
                                    onOpenChange(false)
                                }
                            />
                        )}

                        {section === 'security' && (
                            <SecuritySettings {...security} />
                        )}

                        {section === 'teams' && (
                            <TeamSettings />
                        )}

                        {/* {section === 'languages' && (
                            // <LanguagesSettings />
                        )} */}
                        {section === 'danger' && (
                            <DeleteUser />
                        )}

                    </main>
                </SidebarProvider>
            </DialogContent>
        </Dialog>
    );
}