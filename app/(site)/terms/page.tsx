import { supabase } from "@/lib/supabase";

export const revalidate = 300;
export const metadata = { title: "Terms & Conditions — La Shefa Cafe" };

export default async function TermsPage() {
  const { data } = await supabase
    .from("legal_documents")
    .select("*")
    .eq("doc_type", "terms")
    .eq("is_current", true)
    .maybeSingle();

  return (
    <div className="container-lsc py-16 max-w-prose">
      <h1 className="font-display text-4xl text-brown mb-4">Terms &amp; Conditions</h1>
      {!data ? (
        <p className="text-brown/60 text-sm">
          Terms &amp; conditions have not been published yet.
        </p>
      ) : (
        <div>
          <p className="text-xs text-brown/50 mb-6">
            Version {data.version} · Published {new Date(data.published_at).toLocaleDateString()}
          </p>
          <div className="text-brown/80 leading-relaxed whitespace-pre-wrap">{data.content}</div>
        </div>
      )}
    </div>
  );
}
