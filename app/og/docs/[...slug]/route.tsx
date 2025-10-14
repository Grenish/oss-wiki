import { getPageImage, source } from "@/lib/source";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/og/docs/[...slug]">,
) {
  const { slug } = await params;

  // Remove 'image.png' if it's the last segment
  // For index page: ['image.png'] -> []
  // For other pages: ['credits', 'image.png'] -> ['credits']
  const pageSlug =
    slug[slug.length - 1] === "image.png" ? slug.slice(0, -1) : slug;

  const page = source.getPage(pageSlug);
  if (!page) notFound();

  // Subtle accent colors
  const accentColors = [
    "#2563eb", // Blue
    "#7c3aed", // Purple
    "#059669", // Green
    "#dc2626", // Red
    "#ea580c", // Orange
  ];

  const accentColor = accentColors[slug.join("").length % accentColors.length];

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          padding: "0",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            width: "100%",
            height: "8px",
            background: accentColor,
          }}
        />

        {/* Main container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "80px",
            height: "100%",
            justifyContent: "space-between",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "32px",
                background: accentColor,
                borderRadius: "3px",
              }}
            />
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: "#0f172a",
                letterSpacing: "-0.5px",
              }}
            >
              OSS Wiki
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              marginTop: "60px",
              marginBottom: "auto",
            }}
          >
            {/* Title */}
            <h1
              style={{
                fontSize: page.data.title.length > 50 ? 60 : 76,
                fontWeight: 700,
                color: "#0f172a",
                margin: 0,
                lineHeight: 1.1,
                letterSpacing: "-2px",
              }}
            >
              {page.data.title}
            </h1>

            {/* Description */}
            {page.data.description && (
              <p
                style={{
                  fontSize: 26,
                  fontWeight: 400,
                  color: "#64748b",
                  margin: 0,
                  lineHeight: 1.5,
                  maxWidth: "85%",
                }}
              >
                {page.data.description.length > 150
                  ? `${page.data.description.slice(0, 150)}...`
                  : page.data.description}
              </p>
            )}
          </div>

          {/* Footer - Path breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "60px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: 20,
                color: "#94a3b8",
                fontWeight: 500,
              }}
            >
              {pageSlug.map((segment, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  {index > 0 && <span>/</span>}
                  <span>{segment.replace(/-/g, " ")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
