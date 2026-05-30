"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignatureBlockProps = {
  typedNameDefaultValue: string;
  attestedDefaultChecked: boolean;
  typedNameError?: string | null;
  attestedError?: string | null;
};

export function SignatureBlock({
  typedNameDefaultValue,
  attestedDefaultChecked,
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
          defaultValue={typedNameDefaultValue}
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
            defaultChecked={attestedDefaultChecked}
          />
          I attest the above is accurate.
        </Label>
        {attestedError ? <p className="text-sm text-destructive">{attestedError}</p> : null}
      </div>
    </div>
  );
}
