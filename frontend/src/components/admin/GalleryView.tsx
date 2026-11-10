'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { adminApi, uploadGalleryImage } from '@/lib/admin-api';
import { Button, Card, EmptyState, ErrorNote, Field, Modal, PageHeader, Spinner } from '@/components/admin/ui';
import { MediaImage } from '@/components/ui/MediaImage';
import type { GalleryImage } from '@/lib/types';

export function GalleryView() {
  const [items, setItems] = useState<GalleryImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altSv, setAltSv] = useState('');
  const [altEn, setAltEn] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    adminApi
      .gallery()
      .then(setItems)
      .catch((e) => setError(e?.message ?? 'Kunde inte hämta galleriet.'));
  }, []);

  useEffect(load, [load]);

  function pick(f: File | undefined) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setAltSv('');
    setAltEn('');
    setFormError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function upload() {
    if (!file) {
      setFormError('Välj en bild först.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await uploadGalleryImage(file, altSv || undefined, altEn || undefined);
      setOpen(false);
      reset();
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Uppladdning misslyckades.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(img: GalleryImage) {
    if (!confirm('Ta bort bilden från galleriet? Filen raderas också.')) return;
    setError(null);
    try {
      await adminApi.deleteGallery(img.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte ta bort.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Galleri"
        subtitle="Bilder som visas i galleriet på webbplatsen."
        action={<Button onClick={() => { reset(); setOpen(true); }}><ImagePlus size={16} /> Ladda upp bild</Button>}
      />

      {error && <div className="mb-4"><ErrorNote message={error} /></div>}
      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState message="Galleriet är tomt. Ladda upp bilder för att visa dem på webbplatsen." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((img) => (
            <Card key={img.id} className="group relative overflow-hidden">
              <div className="relative aspect-square">
                <MediaImage src={img.imageUrl} alt={img.altSv ?? ''} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
              </div>
              <button
                onClick={() => remove(img)}
                aria-label="Ta bort bild"
                className="absolute right-2 top-2 bg-ink/60 p-2 text-ivory opacity-0 transition-opacity hover:bg-[#b23b3b] group-hover:opacity-100"
              >
                <Trash2 size={15} strokeWidth={1.5} />
              </button>
              {(img.altSv || img.altEn) && (
                <p className="truncate px-3 py-2 text-xs text-stone">{img.altSv ?? img.altEn}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Ladda upp galleribild">
        <div className="space-y-4">
          {formError && <ErrorNote message={formError} />}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex aspect-video w-full items-center justify-center overflow-hidden border border-dashed border-sand-dark bg-cream text-stone hover:border-gold"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Förhandsvisning" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm">
                <ImagePlus size={24} strokeWidth={1.5} />
                Klicka för att välja bild
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          <Field label="Bildtext (svenska, valfritt)">
            <input className="field" value={altSv} onChange={(e) => setAltSv(e.target.value)} />
          </Field>
          <Field label="Bildtext (engelska, valfritt)">
            <input className="field" value={altEn} onChange={(e) => setAltEn(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Avbryt</Button>
            <Button onClick={upload} loading={saving}>Ladda upp</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}