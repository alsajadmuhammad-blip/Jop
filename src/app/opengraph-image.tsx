import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const alt = 'MARKAZI';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0f172a 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* حلقات زخرفية */}
        <div style={{
          position: 'absolute',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          border: '1.5px solid rgba(96, 165, 250, 0.15)',
          top: '-180px',
          left: '-180px',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          border: '1.5px solid rgba(96, 165, 250, 0.12)',
          top: '-100px',
          left: '-100px',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          border: '1.5px solid rgba(96, 165, 250, 0.1)',
          bottom: '-350px',
          right: '-200px',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          border: '1.5px solid rgba(96, 165, 250, 0.12)',
          bottom: '-200px',
          right: '-80px',
          display: 'flex',
        }} />

        {/* بقع ضوئية */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.35) 0%, transparent 70%)',
          top: '-80px',
          left: '100px',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
          bottom: '-60px',
          right: '150px',
          display: 'flex',
        }} />

        {/* النقاط الزخرفية */}
        {[
          { top: '80px', left: '80px' },
          { top: '80px', left: '120px' },
          { top: '120px', left: '80px' },
          { bottom: '80px', right: '80px' },
          { bottom: '80px', right: '120px' },
          { bottom: '120px', right: '80px' },
        ].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'rgba(96,165,250,0.5)',
            display: 'flex',
            ...pos,
          }} />
        ))}

        {/* المحتوى المركزي */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0px',
          zIndex: 10,
        }}>

          {/* الشعار / أيقونة */}
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
            boxShadow: '0 0 60px rgba(37,99,235,0.6), 0 0 120px rgba(37,99,235,0.2)',
          }}>
            <div style={{
              color: 'white',
              fontSize: '42px',
              fontWeight: '900',
              letterSpacing: '-2px',
              display: 'flex',
            }}>
              M
            </div>
          </div>

          {/* الاسم الرئيسي */}
          <div style={{
            fontSize: '110px',
            fontWeight: '900',
            letterSpacing: '20px',
            color: 'transparent',
            background: 'linear-gradient(180deg, #ffffff 0%, #93c5fd 100%)',
            backgroundClip: 'text',
            display: 'flex',
            lineHeight: '1',
            marginBottom: '24px',
          }}>
            MARKAZI
          </div>

          {/* خط فاصل */}
          <div style={{
            width: '120px',
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
            borderRadius: '2px',
            marginBottom: '24px',
            display: 'flex',
          }} />

          {/* نص ثانوي */}
          <div style={{
            fontSize: '28px',
            color: 'rgba(148,163,184,0.9)',
            letterSpacing: '8px',
            fontWeight: '300',
            display: 'flex',
          }}>
            مركزي
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
