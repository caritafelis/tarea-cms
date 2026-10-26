import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { PINK, PINK_TEXT, STEPS } from './constants';

type Props = {
    index: number;
    title: string;
    description: string;
    children: ReactNode;
    onBack?: () => void;
    nextLabel: string;
    nextIcon?: ReactNode;
    disabled?: boolean;
    loading?: boolean;
    onSubmit: () => void;
};

export default function StepShell(props: Props) {
    const last = props.index === STEPS.length - 1;
    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!props.disabled && !props.loading) props.onSubmit();
    };

    return (
        <form onSubmit={submit} className="my-auto flex h-full w-full flex-col px-1">
            <div className="mt-7 flex-1">
                <p className={`text-md font-semibold uppercase tracking-wide ${PINK_TEXT}`}>
                    {last ? 'Last step' : `Step ${props.index + 1} of ${STEPS.length}`}
                </p>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900">{props.title}</h1>
                <p className="text-md mt-5 max-w-3xl text-neutral-900">{props.description}</p>
                <div className="mt-8">{props.children}</div>
            </div>

            <div className="mt-auto flex items-center gap-4 pt-10">
                {props.onBack && (
                    <button
                        type="button"
                        onClick={props.onBack}
                        className="flex items-center gap-2 rounded-full px-4 py-3 font-medium text-neutral-900 hover:bg-neutral-100"
                    >
                        <ArrowLeft className="size-5" strokeWidth={1.5} />
                        Back
                    </button>
                )}

                <button
                    type="submit"
                    disabled={props.disabled || props.loading}
                    className={`flex h-12 items-center gap-2 rounded-full px-8 text-base font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${PINK}`}
                >
                    {props.loading && <Spinner />}
                    {props.nextLabel}
                    {props.nextIcon}
                </button>
            </div>
        </form>
    );
}