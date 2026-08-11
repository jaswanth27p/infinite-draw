import { FileEditor } from "@/components/file-editor";

export default async function FileEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FileEditor fileId={id} />;
}
