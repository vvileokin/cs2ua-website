import { AdminHead, Panel } from "@/components/admin/ui";
import { MajorStageAdmin, type AdminStage } from "@/components/admin/MajorStageAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StageKind } from "@/lib/major-pickem";

/**
 * Стадії пікемів на мейджор.
 *
 * Читає сервер, а не браузер. Картки чужих людей закриті політикою до замка
 * (0094), тож клієнтський запит показав би адміну нуль карток саме тоді, коли
 * знати їхню кількість найпотрібніше — доки стадія ще відкрита. Доступ до
 * сторінки й так вирішено в layout, тому службовий клієнт тут на місці.
 */
export const dynamic = "force-dynamic";

export default async function MajorAdminPage() {
  const admin = createAdminClient();
  const [{ data: rows }, { data: cards }] = await Promise.all([
    admin.from("major_stages").select("*").order("stage"),
    admin.from("major_pickem").select("stage"),
  ]);

  const stages: AdminStage[] = (rows ?? []).map((r) => ({
    stage: r.stage as number,
    title: r.title as string,
    kind: ((r.kind as StageKind | null) ?? "swiss") as StageKind,
    teams: (r.teams as string[]) ?? [],
    startsAt: r.starts_at as string,
    played: (r.played as { a: string; b: string; w: string }[] | null) ?? [],
    opening: (r.opening as AdminStage["opening"] | null) ?? [],
    actual: (r.actual as Record<string, string> | null) ?? null,
    scoredAt: (r.scored_at as string | null) ?? null,
  }));

  const counts: Record<number, number> = {};
  for (const c of cards ?? []) {
    const n = c.stage as number;
    counts[n] = (counts[n] ?? 0) + 1;
  }

  return (
    <div>
      <AdminHead
        title="Пікеми на мейджор"
        subtitle="Замок стадії, підсумок і нарахування очок за картки."
      />
      {stages.length ? (
        <MajorStageAdmin stages={stages} counts={counts} />
      ) : (
        <Panel>
          <p className="text-sm text-ink-muted">Стадії ще не заведені.</p>
        </Panel>
      )}
    </div>
  );
}
