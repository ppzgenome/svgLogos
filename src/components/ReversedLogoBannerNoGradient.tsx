interface ReversedLogoBannerNoGradientProps {
  logos: Array<{ id: string; url: string }>
  isLoading: boolean
}

export const ReversedLogoBannerNoGradient = ({ logos, isLoading }: ReversedLogoBannerNoGradientProps) => {

  if (isLoading) {
    return (
      <div className="logo-banner bg-white py-4">
        <div className="flex justify-center">
          <p className="text-gray-500">Loading logos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="logo-banner bg-white py-4 overflow-hidden">
      <div className="logo-scroll-reverse">
        {/* First set of logos */}
        <div className="logo-container">
          {logos.map((logo) => (
            <div key={logo.id} className="logo-item">
              <div 
                className="svg-logo-wrapper"
                style={{ 
                  width: '100px',
                  height: '32px'
                }}
              >
                <img 
                  src={logo.url} 
                  alt="Brand Logo" 
                  className="svg-logo"
                  style={{ 
                    opacity: 1,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Duplicate set for seamless looping */}
        <div className="logo-container">
          {logos.map((logo) => (
            <div key={`dup-${logo.id}`} className="logo-item">
              <div 
                className="svg-logo-wrapper"
                style={{ 
                  width: '100px',
                  height: '32px'
                }}
              >
                <img 
                  src={logo.url} 
                  alt="Brand Logo" 
                  className="svg-logo"
                  style={{ 
                    opacity: 1,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
