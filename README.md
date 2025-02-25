# SVG Logos

A modern web application for searching, managing, and batch formatting SVG logos.

## Features

- **One-shot Logo Search**: Search and download multiple logos at once, eliminating tedious manual searches
- **Batch Formatting**: Apply consistent styling and formatting to multiple logos simultaneously
- **SVG Format Support**: Work with crisp, high-quality, resolution-independent vector graphics
- **Logo Grid**: Organize up to 15 logos in a visual grid for easy management
- **Logo Refresh**: Find alternative versions of logos with a single click
- **Drag & Drop**: Easily upload your own SVG files via drag and drop
- **Bulk Download**: Download all logos as a ZIP file with one click

## System Requirements

- **Node.js**: v18.0.0 or higher (v18.18.0 recommended)
- **npm**: v8.0.0 or higher
- **Browsers**: Chrome, Firefox, Safari, or Edge (latest versions)
- **OS**: Windows, macOS, or Linux

## Installation

```bash
# Clone the repository
git clone https://github.com/ppzgenome/svgLogos.git
cd svgLogos

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Environment Setup

### Using nvm (recommended)

This project includes an `.nvmrc` file to ensure consistent Node.js versions across environments:

```bash
# Install nvm if you don't have it already
# See: https://github.com/nvm-sh/nvm#installing-and-updating

# Use the correct Node.js version
nvm use

# If you don't have the required version installed
nvm install
```

### CORS Configuration

The development server is configured with CORS enabled to allow cross-origin requests. If you encounter CORS issues:

1. Check that you're running the latest version of the code
2. Ensure your browser isn't blocking requests
3. If needed, modify the CORS settings in `vite.config.ts`

## Usage

1. **Search for Logos**: Enter company names separated by commas in the search field
2. **Upload SVGs**: Drag and drop SVG files or use the upload button
3. **Manage Logos**: 
   - Click on a logo to select it
   - Hover over a logo to see action buttons
   - Use the refresh button to find alternative versions
   - Use the eye button to view the full SVG
   - Use the X button to remove a logo
4. **Download**: Click "Download All" to get a ZIP file with all logos

## Troubleshooting

### Logo Search Issues

If you're having trouble finding logos:
- Ensure you have internet access
- Try different search terms (simpler terms often work better)
- Some sources may be blocked in certain regions or networks
- The application will automatically retry failed sources after 5 minutes

### Browser Compatibility

This application uses modern browser features:
- URL.createObjectURL for file handling
- Fetch API for network requests
- Modern JavaScript features (async/await, etc.)

If you encounter issues, ensure you're using a modern browser (Chrome, Firefox, Safari, or Edge).

## Technologies Used

- **React**: Frontend UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **React Icons**: Icon components
- **Axios**: HTTP client for API requests
- **JSZip**: Library for creating ZIP files

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
