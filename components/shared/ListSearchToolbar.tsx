"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ListSearchToolbarProps = {
  id: string;
  label: string;
  placeholder: string;
  query: string;
  onQueryChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
};

export function ListSearchToolbar({
  id,
  label,
  placeholder,
  query,
  onQueryChange,
  filteredCount,
  totalCount,
}: ListSearchToolbarProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-lg space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <Input
            id={id}
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
          />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {filteredCount} of {totalCount}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onQueryChange("")}
            disabled={query.length === 0}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
