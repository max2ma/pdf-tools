# Compress PDF Tool

Run `npm install`, then `npm start`. Open `http://max-nas:4890/`. Select a quality/resolution method. The PDF is rendered and rebuilt locally in the browser; it is never uploaded.

This tool intentionally rasterizes pages to JPEG images. That is effective for image-heavy PDFs, but means selectable text, vector graphics, forms, links, and annotations are not preserved as editable PDF objects.
