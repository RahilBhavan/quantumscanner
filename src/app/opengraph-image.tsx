import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Bitcoin Quantum Exposure Scanner'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: '#F5F0E8',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative',
      }}
    >
      {/* Outer border */}
      <div
        style={{
          position: 'absolute',
          inset: '20px',
          border: '4px solid #B8A882',
          borderRadius: '12px',
        }}
      />
      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          zIndex: 1,
        }}
      >
        {/* Tag hole */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '4px solid #B8A882',
            background: '#F5F0E8',
          }}
        />
        <div
          style={{
            fontSize: 88,
            color: '#2C2416',
            letterSpacing: '0.1em',
            lineHeight: 1,
            textAlign: 'center',
            fontWeight: 900,
          }}
        >
          QUANTUM SCANNER
        </div>
        <div
          style={{
            width: '100px',
            height: '3px',
            background: '#B8A882',
          }}
        />
        <div
          style={{
            fontSize: 26,
            color: '#9E8E75',
            letterSpacing: '0.2em',
            textAlign: 'center',
          }}
        >
          BITCOIN QUANTUM EXPOSURE CLASSIFIER
        </div>
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            gap: '40px',
            fontSize: 18,
            color: '#B8A882',
            letterSpacing: '0.15em',
          }}
        >
          <span>EXPOSED</span>
          <span>·</span>
          <span>SAFE AT REST</span>
          <span>·</span>
          <span>EMPTY</span>
        </div>
      </div>
    </div>,
    { ...size }
  )
}
