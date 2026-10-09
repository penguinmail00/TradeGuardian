"use client";

import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { z } from "zod";

import { sendSupportRequest } from "@/lib/support-api";

import {
  type SupportRequest,
  supportRequestLimits,
  supportRequestSchema,
} from "./support-request";

type FieldErrors = Partial<Record<keyof SupportRequest, string[]>>;

/**
 * Support request form. Validates in the browser, then sends the request
 * straight to the backend.
 */
export function SupportForm() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const {
    mutate: send,
    isPending,
    isSuccess,
    isError,
  } = useMutation({ mutationFn: sendSupportRequest });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = supportRequestSchema.safeParse({
      email: readField(formData, "email"),
      subject: readField(formData, "subject"),
      description: readField(formData, "description"),
    });
    if (!result.success) {
      setFieldErrors(z.flattenError(result.error).fieldErrors);
      return;
    }
    setFieldErrors({});
    send(result.data);
  }

  if (isSuccess) {
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

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const errorMessage = hasFieldErrors
    ? "Check the highlighted fields and try again."
    : isError
      ? "We couldn't send your request. Please try again in a moment."
      : undefined;

  return (
    <form
      // POST, so a submit before hydration can't put the email in the URL.
      method="post"
      onSubmit={handleSubmit}
      noValidate
      className="panel flex flex-col gap-6 p-6 lg:p-8"
    >
      {errorMessage && (
        <p role="alert" className="type-small text-danger">
          {errorMessage}
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
            maxLength={supportRequestLimits.email}
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

function readField(formData: FormData, name: keyof SupportRequest) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

type FieldControlProps = {
  id: string;
  name: keyof SupportRequest;
  className: string;
  autoComplete: "off";
  autoCorrect: "off";
  spellCheck: false;
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
        // No suggestions, autocomplete or spell correction on any field.
        autoComplete: "off",
        autoCorrect: "off",
        spellCheck: false,
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
