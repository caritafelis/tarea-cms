import { ResourceForm } from '@/components/admin/resource-pages';

export default function Page(props: Record<string, any>) {
    return <ResourceForm slug="discounts" {...props} />;
}
