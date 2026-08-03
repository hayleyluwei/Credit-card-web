"use client";

type ConfirmSubmitButtonProps = {
  action: (formData: FormData) => Promise<void> | void;
  hiddenFields: Record<string, string | number>;
  confirmMessage: string;
  label: string;
  tone?: "default" | "danger";
};

export function ConfirmSubmitButton({ action, hiddenFields, confirmMessage, label, tone = "default" }: ConfirmSubmitButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <button
        className={`rounded-md border px-3 py-2 text-sm font-semibold ${
          tone === "danger" ? "border-red-200 text-red-700 hover:bg-red-50" : "border-line text-ink"
        }`}
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
