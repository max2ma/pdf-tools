(() => {
  const presets = {
    passport: { name: 'Passport photo', width: 35, height: 45, unit: 'mm' },
    usvisa: { name: 'US visa photo', width: 2, height: 2, unit: 'in' },
    id: { name: 'ID photo', width: 30, height: 40, unit: 'mm' },
    wallet: { name: 'Wallet photo', width: 2.5, height: 3.5, unit: 'in' },
    '4x6': { name: 'Print', width: 4, height: 6, unit: 'in' },
    square: { name: 'Square photo', width: 1, height: 1, unit: 'in' }
  };
  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), photo = $('photo'), cropWindow = $('cropWindow');
  const fileInput = $('fileInput'), presetSelect = $('presetSelect');
  let imageUrl = null, imageWidth = 0, imageHeight = 0, rotation = 0;
  let crop = { x: 0, y: 0, width: 0, height: 0 }, image = { x: 0, y: 0, width: 0, height: 0 };
  let zoom = 1, drag = null, toastTimer = null;

  function dimensions() {
    if (presetSelect.value === 'custom') {
      return { name: 'Custom photo', width: Math.max(10, Number($('customWidth').value) || 35), height: Math.max(10, Number($('customHeight').value) || 45), unit: 'mm' };
    }
    return presets[presetSelect.value];
  }

  function updateSummary() {
    const size = dimensions(), ratio = size.width / size.height;
    const dpi = Number($('qualitySelect').value);
    const inchesW = size.unit === 'mm' ? size.width / 25.4 : size.width;
    const inchesH = size.unit === 'mm' ? size.height / 25.4 : size.height;
    $('formatName').textContent = size.name;
    $('formatDetail').innerHTML = `${size.width} × ${size.height} ${size.unit} <i>·</i> ${ratio.toFixed(2)} ratio`;
    $('pixelSize').textContent = `${Math.round(inchesW * dpi)} × ${Math.round(inchesH * dpi)} px`;
    if (photo.naturalWidth) layout();
  }

  function rotatedSize() { return rotation % 180 ? [imageHeight, imageWidth] : [imageWidth, imageHeight]; }

  function layout() {
    if (!photo.naturalWidth) return;
    const bounds = stage.getBoundingClientRect();
    const ratio = dimensions().width / dimensions().height;
    const maxW = bounds.width * .72, maxH = bounds.height * .78;
    let cw = maxW, ch = cw / ratio;
    if (ch > maxH) { ch = maxH; cw = ch * ratio; }
    crop.width = cw; crop.height = ch;
    crop.x = (bounds.width - cw) / 2; crop.y = (bounds.height - ch) / 2;
    const [iw, ih] = rotatedSize();
    const baseScale = Math.max(cw / iw, ch / ih);
    const scale = baseScale * zoom;
    image.width = iw * scale; image.height = ih * scale;
    image.x = crop.x + (cw - image.width) / 2;
    image.y = crop.y + (ch - image.height) / 2;
    clampImage(); render();
  }

  function clampImage() {
    image.x = Math.min(crop.x, Math.max(crop.x + crop.width - image.width, image.x));
    image.y = Math.min(crop.y, Math.max(crop.y + crop.height - image.height, image.y));
  }

  function render() {
    if (!photo.naturalWidth) return;
    const rotated = rotation % 180 !== 0;
    const elementWidth = rotated ? image.height : image.width;
    const elementHeight = rotated ? image.width : image.height;
    photo.style.width = `${elementWidth}px`; photo.style.height = `${elementHeight}px`;
    photo.style.left = `${image.x + (image.width - elementWidth) / 2}px`;
    photo.style.top = `${image.y + (image.height - elementHeight) / 2}px`;
    photo.style.transform = `rotate(${rotation}deg)`;
    photo.style.transformOrigin = 'center';
    cropWindow.style.left = `${crop.x}px`; cropWindow.style.top = `${crop.y}px`;
    cropWindow.style.width = `${crop.width}px`; cropWindow.style.height = `${crop.height}px`;
  }

  function loadFile(file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { showToast('Choose a JPG, PNG or WEBP photo.'); return; }
    if (file.size > 25 * 1024 * 1024) { showToast('That photo is over 25 MB.'); return; }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = URL.createObjectURL(file);
    photo.onload = () => {
      imageWidth = photo.naturalWidth; imageHeight = photo.naturalHeight; rotation = 0; zoom = 1;
      $('emptyState').hidden = true; photo.hidden = false; cropWindow.hidden = false;
      $('stageHint').hidden = false; $('replaceButton').hidden = false; $('rotateButton').hidden = false;
      $('zoomControl').hidden = false; $('exportButton').disabled = false; $('resetButton').disabled = false;
      $('zoomSlider').value = 100; $('zoomValue').value = '100%'; layout();
    };
    photo.src = imageUrl;
  }

  function showToast(message) {
    const el = $('toast'); el.textContent = message; el.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2800);
  }

  function makeSourceImage() {
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
    const [iw, ih] = rotatedSize(); canvas.width = iw; canvas.height = ih;
    ctx.translate(iw / 2, ih / 2); ctx.rotate(rotation * Math.PI / 180);
    ctx.drawImage(photo, -imageWidth / 2, -imageHeight / 2);
    return canvas;
  }

  function exportPhoto() {
    const size = dimensions(), dpi = Number($('qualitySelect').value);
    const unitScale = size.unit === 'mm' ? dpi / 25.4 : dpi;
    const outW = Math.round(size.width * unitScale), outH = Math.round(size.height * unitScale);
    const scale = image.width / rotatedSize()[0];
    const sx = Math.max(0, (crop.x - image.x) / scale), sy = Math.max(0, (crop.y - image.y) / scale);
    const sw = crop.width / scale, sh = crop.height / scale;
    const source = makeSourceImage(), canvas = document.createElement('canvas');
    canvas.width = outW; canvas.height = outH;
    canvas.getContext('2d').drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
    canvas.toBlob((blob) => {
      if (!blob) { showToast('Could not create the photo. Try another image.'); return; }
      const link = document.createElement('a'), url = URL.createObjectURL(blob);
      link.href = url; link.download = `stillframe-${presetSelect.value === 'custom' ? 'custom' : presetSelect.value}.jpg`;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/jpeg', .94);
  }

  $('chooseButton').addEventListener('click', () => fileInput.click());
  $('replaceButton').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (event) => { loadFile(event.target.files[0]); event.target.value = ''; });
  presetSelect.addEventListener('change', () => { $('customFields').hidden = presetSelect.value !== 'custom'; updateSummary(); });
  $('customWidth').addEventListener('input', updateSummary); $('customHeight').addEventListener('input', updateSummary);
  $('qualitySelect').addEventListener('change', updateSummary);
  $('zoomSlider').addEventListener('input', (event) => {
    const next = Number(event.target.value) / 100, centerX = crop.x + crop.width / 2, centerY = crop.y + crop.height / 2;
    const oldCenterX = (centerX - image.x) / image.width, oldCenterY = (centerY - image.y) / image.height;
    zoom = next;
    const [iw, ih] = rotatedSize();
    const scale = Math.max(crop.width / iw, crop.height / ih) * zoom;
    image.width = iw * scale; image.height = ih * scale;
    image.x = centerX - oldCenterX * image.width; image.y = centerY - oldCenterY * image.height;
    clampImage(); render(); $('zoomValue').value = `${Math.round(zoom * 100)}%`;
  });
  $('rotateButton').addEventListener('click', () => { rotation = (rotation + 90) % 360; layout(); });
  $('resetButton').addEventListener('click', () => { zoom = 1; rotation = 0; $('zoomSlider').value = 100; $('zoomValue').value = '100%'; layout(); });
  $('exportButton').addEventListener('click', exportPhoto);

  cropWindow.addEventListener('pointerdown', (event) => { drag = { x: event.clientX, y: event.clientY }; cropWindow.setPointerCapture(event.pointerId); });
  cropWindow.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const bounds = stage.getBoundingClientRect(), dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    drag = { x: event.clientX, y: event.clientY };
    image.x += dx * bounds.width / stage.clientWidth; image.y += dy * bounds.height / stage.clientHeight;
    clampImage(); render();
  });
  cropWindow.addEventListener('pointerup', () => { drag = null; });
  cropWindow.addEventListener('pointercancel', () => { drag = null; });
  new ResizeObserver(() => layout()).observe(stage);
  updateSummary();
})();
