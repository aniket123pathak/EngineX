import { useState } from "react";

export default function DeleteConfirmModal({ problemTitle, onConfirm, onCancel }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDestroy = async () => {
    setDeleting(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Deletion failed."
      );
      setDeleting(false);
    }
  };

  return (
    <div
      id="delete-confirm-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleting) onCancel();
      }}
    >
      <div
        id="delete-confirm-modal"
        className="w-full max-w-md border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        <h2 className="text-xl font-black tracking-tight text-black uppercase">
          ⚠ Warning: Permanent Deletion
        </h2>

        <p className="mt-4 border-l-4 border-black pl-4 text-sm leading-relaxed text-gray-700">
          This will destroy{" "}
          <span className="font-bold text-black">"{problemTitle}"</span> from
          the database and wipe all test cases from the server.{" "}
          <span className="font-black text-black">Proceed?</span>
        </p>

        {error && (
          <div
            id="delete-error-message"
            className="mt-4 border-2 border-red-700 bg-red-50 px-4 py-2 text-xs font-bold text-red-800"
          >
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            id="delete-cancel-btn"
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className="cursor-pointer border-2 border-black bg-white px-5 py-2 text-xs font-bold tracking-wide text-black uppercase transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="delete-destroy-btn"
            type="button"
            disabled={deleting}
            onClick={handleDestroy}
            className="cursor-pointer border-2 border-red-700 bg-red-700 px-5 py-2 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-red-900 hover:border-red-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Destroy"}
          </button>
        </div>
      </div>
    </div>
  );
}
