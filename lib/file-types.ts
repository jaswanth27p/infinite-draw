export interface FileListItem {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  updatedAt: string;
  starred: boolean;
}

export interface SharedFileListItem extends FileListItem {
  role: "EDITOR" | "COMMENTER" | "VIEWER";
  owner: { name: string | null; email: string };
}

export interface TrashedFileListItem {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  deletedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}
