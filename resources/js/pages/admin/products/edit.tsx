import ProductEditor, { type ProductEditorPageProps } from '@/components/admin/product-editor';
import type { Product } from '@/components/admin/product/shared';

export default function EditProduct(props: ProductEditorPageProps & { product: Product }) {
    return <ProductEditor {...props} mode="edit" />;
}