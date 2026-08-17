import {
  DotsThreeVertical,
  DownloadSimple,
  FileImage,
  UploadSimple,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { ToolButton } from './ToolButton.tsx';

type Props = {
  onSave: () => void;
  onLoad: (file: File) => void;
  onExportPng: () => void;
};

/** File actions, kept out of the bar because they are used rarely. */
export function OverflowMenu({ onSave, onLoad, onExportPng }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();
    const onPointer = (ev: PointerEvent) => {
      if (!wrapRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <div className="overflow" ref={wrapRef}>
      <ToolButton
        icon={DotsThreeVertical}
        label="File actions"
        expanded={open}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <div className="pop" role="menu" aria-label="File actions">
          <button
            ref={firstItemRef}
            type="button"
            role="menuitem"
            onClick={() => run(onSave)}
          >
            <DownloadSimple aria-hidden="true" />
            Save .json
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => fileRef.current?.click()}
          >
            <UploadSimple aria-hidden="true" />
            Load .json
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => run(onExportPng)}
          >
            <FileImage aria-hidden="true" />
            Export PNG
          </button>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          setOpen(false);
          onLoad(f);
        }}
      />
    </div>
  );
}
