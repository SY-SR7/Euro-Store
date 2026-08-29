import { CollectionEditor } from '../CollectionEditor';

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CollectionEditor id={id} />;
}
