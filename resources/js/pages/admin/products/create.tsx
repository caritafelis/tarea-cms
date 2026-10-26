import ProductEditor, { type ProductEditorPageProps } from '@/components/admin/product-editor';

export default function CreateProduct(props: ProductEditorPageProps) {
    return <ProductEditor {...props} mode="create" product={null} />;
}