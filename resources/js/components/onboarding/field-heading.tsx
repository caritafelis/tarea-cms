export default function FieldHeading({ title, hint }: { title: string; hint?: string }) {
    return (
        <div className="mb-4">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900">{title}</h2>
            {hint && <p className="mt-1.5 text-[15px] leading-relaxed text-neutral-500">{hint}</p>}
        </div>
    );
}