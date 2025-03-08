interface LogoBannerProps {
  logos: Array<{ id: string; url: string }>
  isLoading: boolean
}

export const LogoBanner = ({ logos, isLoading }: LogoBannerProps) => {

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
      <div className="logo-scroll">
        {/* First set of logos */}
        <div className="logo-container">
          {logos.map((logo, index) => (
            <div key={logo.id} className="logo-item">
              <div 
                className="svg-logo-wrapper"
                style={{ 
                  '--svg-url': `url(${logo.url})`,
                  width: '100px',
                  height: '32px'
                } as React.CSSProperties}
              >
                <img 
                  src={logo.url} 
                  alt="Brand Logo" 
                  className="svg-logo"
                  style={{ opacity: 0 }}
                />
                <div className={`svg-logo-gradient-${(index % 4) + 1}`}></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Duplicate set for seamless looping */}
        <div className="logo-container">
          {logos.map((logo, index) => (
            <div key={`dup-${logo.id}`} className="logo-item">
              <div 
                className="svg-logo-wrapper"
                style={{ 
                  '--svg-url': `url(${logo.url})`,
                  width: '100px',
                  height: '32px'
                } as React.CSSProperties}
              >
                <img 
                  src={logo.url} 
                  alt="Brand Logo" 
                  className="svg-logo"
                  style={{ opacity: 0 }}
                />
                <div className={`svg-logo-gradient-${(index % 4) + 1}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
