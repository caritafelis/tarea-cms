import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import RichTextEditor from '@/components/RichTextEditor';
import LocaleSwitcher from '@/components/locale-switcher';

interface Post {
  id: number;
  title: Record<string, string> | string;
  content: Record<string, string> | string;
  slug: string;
  status: string;
  created_at: string;
}

interface PostsProps {
  posts: Post[];
  locales: string[];
  defaultLocale: string;
}

type FormData = Record<string, string>;

export default function Posts({ posts, locales, defaultLocale }: PostsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editorLocale, setEditorLocale] = useState(defaultLocale);

  const buildInitialData = (): FormData => {
    const data: FormData = { status: 'draft' };
    locales.forEach(loc => {
      data[`title_${loc}`] = '';
      data[`content_${loc}`] = '';
    });
    return data;
  };

  const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm<FormData>(buildInitialData());

  const getTranslation = (field: any, lang: string): string => {
    if (!field) return '';
    if (typeof field === 'string') {
      try { return JSON.parse(field)[lang] ?? ''; } catch { return field; }
    }
    return field[lang] ?? field[defaultLocale] ?? '';
  };

  const openCreateModal = () => {
    setEditingPost(null);
    reset();
    setEditorLocale(defaultLocale);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Post) => {
    setEditingPost(p);
    const updates: FormData = { status: p.status };
    locales.forEach(loc => {
      updates[`title_${loc}`] = getTranslation(p.title, loc);
      updates[`content_${loc}`] = getTranslation(p.content, loc);
    });
    setData(updates);
    setEditorLocale(defaultLocale);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingPost
      ? put(`/admin/posts/${editingPost.id}`, { onSuccess: () => { setIsModalOpen(false); reset(); } })
      : post('/admin/posts', { onSuccess: () => { setIsModalOpen(false); reset(); } });
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this post?')) destroy(`/admin/posts/${id}`);
  };

  const columns = [
    { header: 'Title', accessor: (p: Post) => getTranslation(p.title, defaultLocale) },
    { header: 'Slug', accessor: (p: Post) => p.slug },
    {
      header: 'Status',
      accessor: (p: Post) => (
        <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${p.status === 'published'
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
          }`}>{p.status}</span>
      ),
    },
    { header: 'Created', accessor: (p: Post) => new Date(p.created_at).toLocaleDateString() },
    {
      header: 'Actions',
      accessor: (p: Post) => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(p)} className="text-sm text-blue-600 hover:underline">Edit</button>
          <button onClick={() => handleDelete(p.id)} className="text-sm text-red-600 hover:underline">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Posts" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
            <p className="text-sm text-neutral-500">Manage blog posts and content translations.</p>
          </div>
          <button onClick={openCreateModal} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900">
            Add New Post
          </button>
        </div>

        <DataTable
          data={posts}
          columns={columns}
          searchKey={(p) => getTranslation(p.title, defaultLocale) + ' ' + p.slug}
          searchPlaceholder="Search posts..."
        />

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-xl dark:bg-neutral-900 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{editingPost ? 'Edit Post' : 'Create Post'}</h2>
                <LocaleSwitcher locales={locales} active={editorLocale} onChange={setEditorLocale} />
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
                    Title ({editorLocale.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={data[`title_${editorLocale}`] ?? ''}
                    onChange={e => setData(`title_${editorLocale}`, e.target.value)}
                    className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800"
                    required={editorLocale === defaultLocale}
                  />
                  {errors[`title_${editorLocale}`] && (
                    <span className="text-xs text-red-600">{errors[`title_${editorLocale}`]}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
                    Content ({editorLocale.toUpperCase()})
                  </label>
                  <RichTextEditor
                    value={data[`content_${editorLocale}`] ?? ''}
                    onChange={val => setData(`content_${editorLocale}`, val)}
                    placeholder={`Write content in ${editorLocale.toUpperCase()}...`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Status</label>
                  <select
                    value={data.status}
                    onChange={e => setData('status', e.target.value)}
                    className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    Cancel
                  </button>
                  <button type="submit" disabled={processing} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900">
                    {editingPost ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

Posts.layout = (page: React.ReactNode) => (
  <AppLayout breadcrumbs={[{ title: 'Posts', href: '/admin/posts' }]}>{page}</AppLayout>
);