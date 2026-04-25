import { Helmet } from "react-helmet";

interface SEOProps {
  title: string;
  description: string;
  keywords: string[];
}

export function SEO({ title, description, keywords }: SEOProps) {
  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(", ")} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {url ? <meta property="og:url" content={url} /> : null}
      {url ? <link rel="canonical" href={url} /> : null}
    </Helmet>
  );
}
