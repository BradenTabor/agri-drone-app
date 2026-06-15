"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignatureBlockProps = {
  typedNameValue: string;
  onTypedNameChange: (value: string) => void;
  attestedChecked: boolean;
  onAttestedChange: (checked: boolean) => void;
  typedNameError?: string | null;
  attestedError?: string | null;
};

export function SignatureBlock({
  typedNameValue,
  onTypedNameChange,
  attestedChecked,
  onAttestedChange,
  typedNameError,
  attestedError,
}: SignatureBlockProps) {
  return (
    <div className="space-y-3 rounded-md border border-dashed p-3">
      <div className="space-y-2">
        <Label htmlFor="signedTypedName">Typed signature</Label>
        <Input
          id="signedTypedName"
          name="signedTypedName"
          value={typedNameValue}
          onChange={(event) => onTypedNameChange(event.target.value)}
          aria-invalid={Boolean(typedNameError)}
          required
        />
        {typedNameError ? <p className="text-sm text-destructive">{typedNameError}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signatureAttested" className="flex min-h-11 items-center gap-3">
          <input type="hidden" name="signatureAttested" value="false" />
          <Checkbox
            id="signatureAttested"
            name="signatureAttested"
            value="true"
            checked={attestedChecked}
            onChange={(event) => onAttestedChange(event.target.checked)}
            aria-invalid={Boolean(attestedError)}
            required
          />
          I attest the above is accurate. (required)
        </Label>
        {attestedError ? <p className="text-sm text-destructive">{attestedError}</p> : null}
      </div>
    </div>
  );
}
