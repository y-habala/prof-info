import { NotFoundPanel } from "@/components/not-found-panel";

// 404 inside the student shell: a bad level, unit or session id lands here
// with the header and footer still in place, so the way out is on screen.
export default function StudentNotFound() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-24 sm:py-32">
      <NotFoundPanel />
    </div>
  );
}
