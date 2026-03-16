import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'assemblEAT Roast';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface RoastPayload {
  firstName: string;
  roastText: string;
  score: string;
  mode: 'roast' | 'kind';
  date: string;
}

function decodePayload(id: string): RoastPayload | null {
  try {
    const json = decodeURIComponent(
      atob(id.replace(/-/g, '+').replace(/_/g, '/'))
    );
    return JSON.parse(json) as RoastPayload;
  } catch {
    return null;
  }
}

const SCORE_COLORS: Record<string, string> = {
  A: '#10b981',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  E: '#ef4444',
};

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = decodePayload(id);

  const firstName = payload?.firstName ?? '???';
  const roastText = payload?.roastText ?? '';
  const score = payload?.score ?? '';
  const isRoast = (payload?.mode ?? 'roast') === 'roast';
  const accentColor = isRoast ? '#f97316' : '#ec4899';

  // Truncate roast text for the image
  const displayText =
    roastText.length > 280 ? roastText.slice(0, 277) + '...' : roastText;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#030712',
          padding: '48px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          <span style={{ fontSize: '40px' }}>🥗</span>
          <span
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.5px',
            }}
          >
            assemblEAT
          </span>
        </div>

        {/* Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#111827',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '900px',
            width: '100%',
            border: `2px solid ${accentColor}33`,
          }}
        >
          {/* Mode badge + name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  backgroundColor: `${accentColor}33`,
                  color: accentColor,
                  fontSize: '18px',
                  fontWeight: 700,
                  padding: '6px 16px',
                  borderRadius: '999px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                {isRoast ? '🔥 Roast' : '💚 Kind'}
              </span>
              <span style={{ color: '#9ca3af', fontSize: '18px' }}>
                Le bilan de{' '}
                <span style={{ color: '#ffffff', fontWeight: 600 }}>
                  {firstName}
                </span>
              </span>
            </div>

            {score && score !== '-' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: SCORE_COLORS[score] ?? '#4b5563',
                  borderRadius: '12px',
                  padding: '8px 16px',
                }}
              >
                <span
                  style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff' }}
                >
                  {score}
                </span>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                  Indice
                </span>
              </div>
            )}
          </div>

          {/* Roast text */}
          <div
            style={{
              display: 'flex',
              borderLeft: `4px solid ${accentColor}`,
              paddingLeft: '20px',
            }}
          >
            <p
              style={{
                fontSize: '22px',
                lineHeight: 1.6,
                color: '#f3f4f6',
                fontWeight: 500,
                margin: 0,
              }}
            >
              &ldquo;{displayText}&rdquo;
            </p>
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            marginTop: '24px',
            fontSize: '16px',
            color: '#6b7280',
          }}
        >
          assembleat.app — Planifie tes repas avec le Nutri-Score
        </p>
      </div>
    ),
    { ...size }
  );
}
