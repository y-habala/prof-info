"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Kind = "blocked" | "reloaded";

function isReloadShortcut(e: KeyboardEvent) {
  return e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r");
}

// Browsers only show their own generic text in the beforeunload prompt, so
// keyboard reloads are intercepted here to show an explicit warning instead.
// The reload button / pull-to-refresh can't be intercepted: those still hit
// the native prompt, and if the student confirms we explain on return.
function wasReloaded() {
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return nav?.type === "reload";
}
const noSubscribe = () => () => {};

export function ExamReloadWarning() {
  const reloaded = useSyncExternalStore(noSubscribe, wasReloaded, () => false);
  const [reloadSeen, setReloadSeen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const kind: Kind | null = blocked ? "blocked" : reloaded && !reloadSeen ? "reloaded" : null;

  function close() {
    setBlocked(false);
    setReloadSeen(true);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isReloadShortcut(e)) return;
      e.preventDefault();
      setBlocked(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={kind !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-md border-2 border-destructive/40">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive text-white">
            <AlertTriangle className="size-7" strokeWidth={2.5} />
          </div>
          <DialogTitle className="text-xl font-bold text-destructive">
            {kind === "reloaded" ? "Tentative de triche détectée" : "Attention : tentative de triche"}
          </DialogTitle>

          <div className="space-y-3 text-sm leading-relaxed">
            <p className="text-base">
              Ton examen a <strong>déjà été envoyé à ton enseignant</strong>. Il est donc{" "}
              <strong>impossible de le recommencer</strong> en rechargeant la page.
            </p>
            <p>
              {kind === "reloaded"
                ? "Le chrono a continué et tes réponses non validées sont perdues. Termine ton examen sans quitter cette page."
                : "Le chrono continue. Si tu recharges la page, tes réponses non validées seront perdues."}
            </p>
            <p
              dir="rtl"
              lang="ar"
              className="rounded-xl bg-destructive/10 px-3 py-2.5 text-base font-bold text-destructive"
            >
              امتحانك أُرسل بالفعل إلى الأستاذ، لهذا لا يمكنك إعادته. أي محاولة لإعادة تحميل
              الصفحة تعتبر محاولة غش.
            </p>
          </div>

          <Button type="button" size="lg" className="mt-2 w-full" onClick={close}>
            Continuer l&apos;examen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
