import { router, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { HiOutlineCheck } from 'react-icons/hi';
import { RiLogoutCircleRLine } from 'react-icons/ri';
import { TfiHelpAlt } from 'react-icons/tfi';
import { VscInfo } from 'react-icons/vsc';
import { BRAND, STEPS, SUPPORT_EMAIL } from './constants';
import type { AuthProps } from '@/types';
import PlinthMark from './plinth-mark';

type Props = { step: number; maxStep: number; onJump: (i: number) => void; children: ReactNode };

export default function Frame({ step, maxStep, onJump, children }: Props) {
    const { auth } = usePage<AuthProps>().props;

    return (
        <div className="no-scrollbar flex h-screen items-center justify-center overflow-hidden bg-[#eeecec] p-3 sm:p-6 lg:p-8">
            <div className="flex h-full w-full max-w-[1280px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]">
                {/* Header */}
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5 sm:px-12">
                    <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-neutral-900">
                        <PlinthMark />
                        {BRAND}
                    </div>
                    <div className="flex items-center gap-5 text-sm">
                        <span className="hidden text-neutral-500 sm:inline">Login as {auth.user.email}</span>
                        <span className="hidden h-5 w-px bg-neutral-200 sm:block" />
                        <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-1.5 font-medium text-neutral-900 hover:opacity-70">
                            <TfiHelpAlt className="size-4" /> <span className="hidden sm:inline">Help Assistance</span>
                        </a>
                        <button onClick={() => router.post('/logout')} className="flex items-center gap-1.5 font-medium text-neutral-900 hover:opacity-70">
                            <RiLogoutCircleRLine className="size-4" /> Log out
                        </button>
                    </div>
                </header>

                {/* Cuerpo */}
                <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-6 bg-[#f9f9f9] p-4 sm:p-8 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)] lg:grid-rows-1 lg:gap-13 lg:p-10">
                    <MobileProgress step={step} />
                    <Stepper step={step} maxStep={maxStep} onJump={onJump} />
                    <main id="onboarding-main" className="no-scrollbar flex min-w-0 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}

function Stepper({ step, maxStep, onJump }: { step: number; maxStep: number; onJump: (i: number) => void }) {
    return (
        <aside className="no-scrollbar relative hidden overflow-y-auto rounded-3xl bg-gradient-to-b from-[#e9f1fc] via-[#efeaf6] to-[#f8e9ef] lg:flex">
            <div className="m-auto w-full p-10">
                <p className="flex items-center gap-3 text-sm font-medium text-neutral-900">
                    <VscInfo className="size-5 shrink-0 text-neutral-500" strokeWidth={0.2} />
                    Get started by setting up your workspace and subscription.
                </p>

                <ol className="mt-8">
                    {STEPS.map((s, i) => {
                        const done = i < step;
                        const current = i === step;
                        const Icon = s.icon;
                        const clickable = i <= maxStep && !current;
                        return (
                            <li key={s.key} className="relative pb-9 last:pb-0">
                                {i < STEPS.length - 1 && (
                                    <span
                                        className={`absolute left-6.75 top-15 bottom-1 w-px ${done ? 'bg-[#e11d9b]' : 'border-l border-dashed border-neutral-300'}`}
                                    />
                                )}
                                <button
                                    type="button"
                                    disabled={!clickable}
                                    onClick={() => onJump(i)}
                                    className="flex w-full items-center gap-5 text-left disabled:cursor-default"
                                    aria-current={current ? 'step' : undefined}
                                >
                                    <span
                                        className={`relative grid size-14 shrink-0 place-items-center rounded-full ${done
                                            ? 'bg-[#e11d9b]/15 p-1.5'
                                            : current
                                                ? 'bg-white shadow-[0_8px_24px_-6px_rgba(196,34,159,0.35)]'
                                                : 'bg-white shadow-sm'
                                            }`}
                                    >
                                        {done ? (
                                            <span className="grid size-full place-items-center rounded-full bg-[#e11d9b] text-white">
                                                <HiOutlineCheck className="size-5" strokeWidth={3} />
                                            </span>
                                        ) : (
                                            <Icon className={`size-6 ${current ? 'text-[#e11d9b]' : 'text-neutral-500'}`} strokeWidth={1.5} />
                                        )}
                                    </span>
                                    <span>
                                        <span className="block text-lg font-semibold tracking-tight text-neutral-900">{s.title}</span>
                                        <span className="block text-[15px] leading-relaxed tracking-tight text-neutral-500">{s.desc}</span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </aside>
    );
}

function MobileProgress({ step }: { step: number }) {
    return (
        <div className="lg:hidden">
            <div className="flex gap-1.5">
                {STEPS.map((s, i) => (
                    <span key={s.key} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-[#e11d9b]' : 'bg-neutral-200'}`} />
                ))}
            </div>
            <p className="mt-2 text-sm text-neutral-500">{STEPS[step].title}</p>
        </div>
    );
}