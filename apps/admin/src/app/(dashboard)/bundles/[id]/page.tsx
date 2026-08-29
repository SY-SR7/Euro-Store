import { BundleEditor } from '../BundleEditor';

export default async function EditBundlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BundleEditor id={id} />;
}
