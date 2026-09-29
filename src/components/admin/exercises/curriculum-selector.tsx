"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";

export type CurriculumTree = {
  levels: { id: string; name: string }[];
  units: { id: string; title: string; level_id: string }[];
  sequences: { id: string; title: string; unit_id: string }[];
  sessions: { id: string; title: string; sequence_id: string }[];
};

type Selection = { levelId: string; unitId: string; sequenceId: string; sessionId: string };

export function CurriculumSelector({
  tree,
  initialValues,
}: {
  tree: CurriculumTree;
  initialValues?: Partial<Selection>;
}) {
  const [levelId, setLevelId] = useState(initialValues?.levelId ?? "");
  const [unitId, setUnitId] = useState(initialValues?.unitId ?? "");
  const [sequenceId, setSequenceId] = useState(initialValues?.sequenceId ?? "");
  const [sessionId, setSessionId] = useState(initialValues?.sessionId ?? "");

  const units = tree.units.filter((u) => u.level_id === levelId);
  const sequences = tree.sequences.filter((s) => s.unit_id === unitId);
  const sessions = tree.sessions.filter((s) => s.sequence_id === sequenceId);

  const selectClass =
    "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label htmlFor="levelId">Niveau</Label>
        <select
          id="levelId"
          name="levelId"
          className={selectClass}
          value={levelId}
          onChange={(e) => {
            setLevelId(e.target.value);
            setUnitId("");
            setSequenceId("");
            setSessionId("");
          }}
        >
          <option value="">—</option>
          {tree.levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="unitId">Unité</Label>
        <select
          id="unitId"
          name="unitId"
          className={selectClass}
          value={unitId}
          disabled={!levelId}
          onChange={(e) => {
            setUnitId(e.target.value);
            setSequenceId("");
            setSessionId("");
          }}
        >
          <option value="">—</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.title}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sequenceId">Séquence</Label>
        <select
          id="sequenceId"
          name="sequenceId"
          className={selectClass}
          value={sequenceId}
          disabled={!unitId}
          onChange={(e) => {
            setSequenceId(e.target.value);
            setSessionId("");
          }}
        >
          <option value="">—</option>
          {sequences.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sessionId">Séance</Label>
        <select
          id="sessionId"
          name="sessionId"
          className={selectClass}
          value={sessionId}
          disabled={!sequenceId}
          onChange={(e) => setSessionId(e.target.value)}
        >
          <option value="">—</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
