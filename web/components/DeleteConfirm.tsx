"use client";

interface DeleteConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirm({ onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded p-4 max-w-sm w-full mx-4">
        <p className="text-text-primary mb-4">Delete this thought? This cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary"
          >
            cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs border border-red-400/30 text-red-400 rounded hover:bg-red-400/10"
          >
            delete
          </button>
        </div>
      </div>
    </div>
  );
}
