import { auth } from "@clerk/nextjs/server";
import { FileEditor } from "@/components/file-editor";

export default async function FileEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth.protect({ unauthenticatedUrl: "/sign-in" });
  const { id } = await params;
  return <FileEditor fileId={id} />;
}
