"use client";

import { useActionState } from "react";

import { submitSupportRequest } from "./actions";
import {
  type SupportRequest,
  type SupportRequestState,
  supportRequestLimits,
} from "./support-request";

const initialState: SupportRequestState = { status: "idle" };

/**
 * Support request form. Submits through a Server Action, so it also works
 * before JavaScript loads; client state only drives errors and the pending
 * button.
 */
export function SupportForm() {
  const [state, formAction, isPending] = useActionState(
    submitSupportRequest,
    initialState,
  );

  if (state.status === "success") {
    return (
      <div role="status" className="panel p-6 lg:p-8">
        <h2 className="type-h3">Request sent</h2>
        <p className="type-body mt-2 text-muted">
          Thanks for getting in touch. We&apos;ll reply to your email as soon
          as we can.
        </p>
      </div>
    );
  }

  const hasError = state.status === "error";
  const values = hasError ? state.values : {};
  const fieldErrors = hasError ? state.fieldErrors : {};

  return (
    <form
      action={formAction}
      noValidate
      className="panel flex flex-col gap-6 p-6 lg:p-8"
    >
      {hasError && (
        <p role="alert" className="type-small text-danger">
          {state.message}
        </p>
      )}

      <Field
        name="email"
        label="Your email address"
        error={fieldErrors.email?.[0]}
      >
        {(fieldProps) => (
          <input
            {...fieldProps}
            type="email"
            autoComplete="email"
            maxLength={supportRequestLimits.email}
            defaultValue={values.email}
            required
          />
        )}
      </Field>

      <Field name="subject" label="Subject" error={fieldErrors.subject?.[0]}>
        {(fieldProps) => (
          <input
            {...fieldProps}
            type="text"
            maxLength={supportRequestLimits.subject}
            defaultValue={values.subject}
            required
          />
        )}
      </Field>

      <Field
        name="description"
        label="Description"
        error={fieldErrors.description?.[0]}
      >
        {(fieldProps) => (
          <textarea
            {...fieldProps}
            rows={6}
            maxLength={supportRequestLimits.description}
            defaultValue={values.description}
            required
          />
        )}
      </Field>

      <button
        type="submit"
        className="btn btn-lg btn-primary w-full sm:w-auto sm:self-start"
        aria-busy={isPending}
        disabled={isPending}
      >
        {isPending ? "Sending…" : "Submit request"}
      </button>
    </form>
  );
}

type FieldControlProps = {
  id: string;
  name: keyof SupportRequest;
  className: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
};

/** Label, control and error message, with the accessibility wiring between them. */
function Field({
  name,
  label,
  error,
  children,
}: {
  name: keyof SupportRequest;
  label: string;
  error?: string;
  children: (props: FieldControlProps) => React.ReactNode;
}) {
  const id = `support-${name}`;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="type-small font-semibold">
        {label}
      </label>
      {children({
        id,
        name,
        className: "field",
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="type-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
