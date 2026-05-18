// src/components/DhfPortfolioCard.tsx
// Renders the user's CardioSense Pro DHF Portfolio.
// Fetches dhf_documents for the current user, groups by DHF section, and
// offers individual PDF downloads + a "Download full DHF" bundle.
//
// Mount on Profile.tsx.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, BookOpen } from "lucide-react";
import {
  downloadFullDhfPortfolio, downloadSingleDhfPdf, DhfDoc,
} from "@/lib/dhfPdf";

interface DbRow {
  id: string;
  doc_code: string;
  doc_title: string;
  doc_section: string | null;
  body_markdown: string;
  score: number;
  created_at: string;
}

const DhfPortfolioCard = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DbRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("dhf_documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      setDocs((data as DbRow[] | null) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const grouped = useMemo(() => {
    const out: Record<string, DbRow[]> = {};
    for (const d of docs) {
      const key = d.doc_section ?? "Uncategorised";
      if (!out[key]) out[key] = [];
      out[key].push(d);
    }
    return out;
  }, [docs]);

  const ownerName = user?.user_metadata?.display_name ?? user?.email ?? "Navoro Engineer";

  const handleDownloadAll = () => {
    const payload: DhfDoc[] = docs.map((d) => ({
      doc_code: d.doc_code,
      doc_title: d.doc_title,
      doc_section: d.doc_section,
      body_markdown: d.body_markdown,
      created_at: d.created_at,
      score: d.score,
    }));
    downloadFullDhfPortfolio(payload, ownerName);
  };

  const handleDownloadOne = (d: DbRow) => {
    downloadSingleDhfPdf(
      {
        doc_code: d.doc_code,
        doc_title: d.doc_title,
        doc_section: d.doc_section,
        body_markdown: d.body_markdown,
        created_at: d.created_at,
        score: d.score,
      },
      ownerName,
    );
  };

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-accent" />
          DHF Portfolio — CardioSense Pro
        </CardTitle>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {loading
              ? "Loading…"
              : docs.length === 0
                ? "No documents yet. Complete a Document Builder task to start your DHF."
                : `${docs.length} controlled document${docs.length === 1 ? "" : "s"}`}
          </p>
          {docs.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDownloadAll}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download full DHF
            </Button>
          )}
        </div>
      </CardHeader>
      {docs.length > 0 && (
        <CardContent className="space-y-4">
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                {section}
              </p>
              <div className="space-y-2">
                {items.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/60 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3.5 w-3.5 text-accent shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          <span className="text-accent">{d.doc_code}</span> — {d.doc_title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(d.created_at).toLocaleDateString()} · score {d.score}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        Rev 1
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadOne(d)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};

export default DhfPortfolioCard;
