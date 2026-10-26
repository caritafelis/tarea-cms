import { useForm } from '@inertiajs/react';
import FieldHeading from './field-heading';
import OptionGrid from './option-grid';
import StepShell from './step-shell';
import type { Option, Team, Template } from '@/types';
import { useState } from 'react';

type Props = {
    team: Team;
    name: string;
    businessTypes: Option[];
    projectTypes: Option[];
    templates: Template[];
    onBack: () => void;
    /** Devuelve el project_type elegido para que el padre decida si bloquea la tienda */
    onDone: (projectType: string) => void;
};

export default function BusinessStep({ team, name, businessTypes, projectTypes, templates, onBack, onDone }: Props) {
    const recommendedFor = (project: string) => (project === 'sales_services' ? 'ecommerce' : 'business');
    const form = useForm({
        name,
        business_type: team.business_type ?? '',
        project_type: team.project_type ?? '',
        template: recommendedFor(team.project_type ?? ''),
    });
    const [touched, setTouched] = useState(false);

    const submit = () => {
        form.transform((d) => ({ ...d, name }));
        form.post('/onboarding/business', {
            preserveScroll: true,
            onSuccess: () => onDone(form.data.project_type),
        });
    };

    return (
        <StepShell
            index={1}
            title="Tell us about your business"
            description="This helps us prepare the right tools for you. You can adjust it later."
            onBack={onBack}
            nextLabel="Save and continue"
            disabled={!form.data.business_type || !form.data.project_type}
            loading={form.processing}
            onSubmit={submit}
        >
            <div className="space-y-8">
                <section>
                    <FieldHeading title="What type of business do you have?" />
                    <OptionGrid options={businessTypes} value={form.data.business_type} onChange={(v) => form.setData('business_type', v)} />
                    {form.errors.business_type && <p className="mt-2 text-sm text-red-600">{form.errors.business_type}</p>}
                </section>

                <section>
                    <FieldHeading title="What are you building?" hint="Choose the option that best describes your project." />
                    <OptionGrid layout="column" options={projectTypes} value={form.data.project_type} onChange={(v) => { form.setData((d) => ({ ...d, project_type: v, template: touched ? d.template : recommendedFor(v) })); }} />
                    {form.errors.project_type && <p className="mt-2 text-sm text-red-600">{form.errors.project_type}</p>}
                </section>

                <section>
                    <FieldHeading title="Start with a structure" hint="We create the pages and content blocks so you don't start from zero." />
                    <OptionGrid
                        layout="column"
                        options={templates.map((t) => ({ value: t.id, label: `${t.label} — ${t.description}` }))}
                        value={form.data.template}
                        onChange={(v) => { setTouched(true); form.setData('template', v); }}
                    />
                </section>

                {form.errors.name && <p className="text-sm text-red-600">{form.errors.name}</p>}
            </div>
        </StepShell>
    );
}