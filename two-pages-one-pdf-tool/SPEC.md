# Two Pages to One PDF — Product Specification

## Purpose

Combine two independently selected and cropped pages from a local PDF into one new PDF page. Each crop should retain its correct orientation and its true physical size, calculated from that source page's actual PDF dimensions—not be enlarged or normalized to match the other crop.

## Privacy and processing

- All file reading, rendering, cropping, PDF creation, previewing, and downloading happen locally in the user's browser.
- The PDF and its page content are not uploaded to a server or sent to a third party.
- The tool is served from the shared PDF-tools site at `/two-pages-one-pdf-tool/`; serving the app does not mean the PDF is processed on that server.

## User flow

1. Choose or drop one PDF containing at least two pages.
2. Select a source page for each of the two crop panels. The same source page cannot be used twice.
3. Inspect each rendered page preview and define its crop independently by dragging on the preview or entering the left, top, right, and bottom crop margins as percentages.
4. Choose an output paper size: match the first selected source page, US Letter, or A4.
5. Choose the arrangement: side by side or stacked.
6. Build the PDF, inspect its one-page preview, then download it under the chosen output name.

Changing the source PDF invalidates the previous output and its preview. The download action is available once a new output has been successfully created.

## Crop geometry and physical scale

- Crop percentages are measured against the displayed page bounds. The selected area is the remaining rectangle after subtracting the four margins.
- For each crop, calculate its physical width and height from the selected region's fractions and that source page's effective physical width and height. Account for the page's rotation when mapping displayed dimensions to physical dimensions.
- Keep the crop's original orientation; do not rotate it to fit a slot or swap its width and height as a layout adjustment.
- Place crops in the selected layout in source-selection order: the first crop is first/left (side by side) or top (stacked); the second is second/right or bottom.
- By default, place each crop at its calculated true physical width and height (a 1:1 physical scale in PDF points). Do not resize it to fit a slot, make it match the other crop, or fill unused space. Center it in its layout slot when space remains.
- If either crop cannot fit entirely within its assigned slot at true physical size, do not silently resize or clip it. Warn the user that the selected crops do not fit the output page, and let them change the crop, paper size, or layout.
- Provide an explicit, opt-in option labeled “Automatically scale crops to fit.” It uniformly scales down each crop only as much as needed to fit its assigned slot, preserving aspect ratio and relative physical proportions. Never upscale a crop. Keep automatic scaling off by default, and make the applied scale clear to the user before output is created.
- Output paper dimensions are US Letter (612 × 792 pt), A4 (595.28 × 841.89 pt), or the first selected source page's effective dimensions for “match source.” Use consistent margins and a gap between the two layout slots.
- The output is exactly one PDF page with a white background.

## Preview and output

- Show the selected source page in each crop panel and visibly indicate its crop rectangle.
- After building, render a preview of the actual generated PDF page in the interface.
- Download the same PDF represented by that preview. Use a `.pdf` extension and a sensible default filename; accept a user-provided output name.
- Preserve the visible result and orientation of each crop. The current implementation renders crops to images before embedding them, so the resulting crop content is rasterized rather than searchable/selectable text or vector content. UI copy must not promise otherwise.

## Validation and error handling

- Reject files that cannot be read as PDFs and PDFs with fewer than two pages, with a clear message.
- Reject selecting the same source page for both crops.
- Keep crop margins within page bounds and ensure each crop has non-zero width and height.
- Report build failures without enabling a stale download. Restore the build button after success or failure.

## Acceptance criteria

- A PDF with at least two pages can be loaded locally, and both page selectors offer its pages.
- Each crop can be set independently by dragging or by percentage fields; its overlay tracks the values.
- A rotated source page remains visually in the same orientation in the output.
- The first and second crops remain in their selected order for either arrangement.
- By default, each crop is placed at the physical size derived from its crop bounds and source page dimensions; if both crops cannot fit, the tool warns instead of silently resizing or clipping them.
- With “Automatically scale crops to fit” enabled, crops are reduced uniformly only as much as needed to fit, without upscaling.
- The selected output paper size determines the single output page's physical dimensions; the output preview matches the downloadable file.
- No PDF data is transmitted off-device.
