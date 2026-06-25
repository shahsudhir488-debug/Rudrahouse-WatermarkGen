(function () {
  "use strict";

  var state = {
    photos: [],
    activePhotoIndex: -1,
    logo: null,
    logoSource: "none",
    cameraOpen: false,
    textEnabled: false,
    logoEnabled: false,
    dateEnabled: false,
    repeatEnabled: false,
    watermarkText: "",
    textFontFamily: "Arial, Helvetica, sans-serif",
    textFontWeight: "800",
    textFillColor: "#ffffff",
    textStrokeColor: "#000000",
    textShadow: 35,
    position: "bottom-right",
    opacity: 75,
    textSize: 5,
    logoSize: 18,
    rotation: 0,
    repeatColumns: 4,
    repeatRows: 4,
    repeatGapX: 2,
    repeatGapY: 2,
    hasAutoEnabledRepeat: false,
    format: "image/png",
    quality: 92
  };

  var stream = null;
  var renderToken = 0;
  var defaultLogoPromise = null;

  var elements = {
    photoInput: document.getElementById("photoInput"),
    cameraToggleBtn: document.getElementById("cameraToggleBtn"),
    clearPhotoBtn: document.getElementById("clearPhotoBtn"),
    clearAllBtn: document.getElementById("clearAllBtn"),
    prevPhotoBtn: document.getElementById("prevPhotoBtn"),
    nextPhotoBtn: document.getElementById("nextPhotoBtn"),
    photoCount: document.getElementById("photoCount"),
    photoQueueHint: document.getElementById("photoQueueHint"),
    photoList: document.getElementById("photoList"),
    cameraBox: document.getElementById("cameraBox"),
    cameraPreview: document.getElementById("cameraPreview"),
    capturePhotoBtn: document.getElementById("capturePhotoBtn"),
    textEnabled: document.getElementById("textEnabled"),
    watermarkText: document.getElementById("watermarkText"),
    textFontFamily: document.getElementById("textFontFamily"),
    textFontWeight: document.getElementById("textFontWeight"),
    textFillColor: document.getElementById("textFillColor"),
    textStrokeColor: document.getElementById("textStrokeColor"),
    textShadow: document.getElementById("textShadow"),
    textShadowValue: document.getElementById("textShadowValue"),
    dateEnabled: document.getElementById("dateEnabled"),
    logoEnabled: document.getElementById("logoEnabled"),
    logoInput: document.getElementById("logoInput"),
    logoLabel: document.getElementById("logoLabel"),
    sampleLogoBtn: document.getElementById("sampleLogoBtn"),
    position: document.getElementById("position"),
    repeatEnabled: document.getElementById("repeatEnabled"),
    repeatColumns: document.getElementById("repeatColumns"),
    repeatColumnsValue: document.getElementById("repeatColumnsValue"),
    repeatRows: document.getElementById("repeatRows"),
    repeatRowsValue: document.getElementById("repeatRowsValue"),
    repeatGapX: document.getElementById("repeatGapX"),
    repeatGapXValue: document.getElementById("repeatGapXValue"),
    repeatGapY: document.getElementById("repeatGapY"),
    repeatGapYValue: document.getElementById("repeatGapYValue"),
    opacity: document.getElementById("opacity"),
    opacityValue: document.getElementById("opacityValue"),
    textSize: document.getElementById("textSize"),
    textSizeValue: document.getElementById("textSizeValue"),
    logoSize: document.getElementById("logoSize"),
    logoSizeValue: document.getElementById("logoSizeValue"),
    rotation: document.getElementById("rotation"),
    rotationValue: document.getElementById("rotationValue"),
    format: document.getElementById("format"),
    qualityField: document.getElementById("qualityField"),
    quality: document.getElementById("quality"),
    qualityValue: document.getElementById("qualityValue"),
    downloadBtn: document.getElementById("downloadBtn"),
    downloadAllBtn: document.getElementById("downloadAllBtn"),
    statusMessage: document.getElementById("statusMessage"),
    previewInfo: document.getElementById("previewInfo"),
    refreshPreviewBtn: document.getElementById("refreshPreviewBtn"),
    previewDownloadBtn: document.getElementById("previewDownloadBtn"),
    previewCanvas: document.getElementById("previewCanvas"),
    emptyState: document.getElementById("emptyState")
  };

  function setMessage(message) {
    elements.statusMessage.textContent = message;
  }

  function getActivePhoto() {
    if (state.activePhotoIndex < 0 || state.activePhotoIndex >= state.photos.length) {
      return null;
    }

    return state.photos[state.activePhotoIndex];
  }

  function todayStamp() {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date());
  }

  function safeFileName(name, extension) {
    var base = name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
    return (base || "watermarked-photo") + "-watermarked." + extension;
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("Could not read this file."));
      };
      reader.onerror = function () {
        reject(new Error("Could not read this file."));
      };
      reader.readAsDataURL(file);
    });
  }

  function readBlobAsDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("Could not prepare logo.png."));
      };
      reader.onerror = function () {
        reject(new Error("Could not prepare logo.png."));
      };
      reader.readAsDataURL(blob);
    });
  }

  function loadImage(dataUrl) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = function () {
        resolve(image);
      };
      image.onerror = function () {
        reject(new Error("Could not load the selected image."));
      };
      image.src = dataUrl;
    });
  }

  function updateValueBadges() {
    elements.opacityValue.textContent = state.opacity + "%";
    elements.textSizeValue.textContent = stripTrailingZero(state.textSize) + "%";
    elements.textShadowValue.textContent = state.textShadow + "%";
    elements.logoSizeValue.textContent = state.logoSize + "%";
    elements.rotationValue.textContent = state.rotation + "\u00B0";
    elements.repeatColumnsValue.textContent = state.repeatColumns;
    elements.repeatRowsValue.textContent = state.repeatRows;
    elements.repeatGapXValue.textContent = stripTrailingZero(state.repeatGapX) + "%";
    elements.repeatGapYValue.textContent = stripTrailingZero(state.repeatGapY) + "%";
    elements.qualityValue.textContent = state.quality + "%";
  }

  function stripTrailingZero(value) {
    return Number(value).toString();
  }

  function batchStamp() {
    return new Date().toISOString().replace(/[:.]/g, "-");
  }

  function pause(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function updateQualityField() {
    elements.qualityField.classList.toggle("hidden", state.format !== "image/jpeg");
  }

  function updateCameraUi() {
    elements.cameraBox.classList.toggle("hidden", !state.cameraOpen);
    elements.cameraToggleBtn.textContent = state.cameraOpen ? "Close Camera" : "Live Camera";
  }

  function renderPhotoList() {
    if (!state.photos.length) {
      elements.photoList.innerHTML = '<div class="photo-list-empty">No photos in queue yet.</div>';
      return;
    }

    elements.photoList.innerHTML = state.photos
      .map(function (photo, index) {
        var isActive = index === state.activePhotoIndex;
        var subtitle = isActive ? "Current preview" : "Ready for preview or download";

        return (
          '<div class="photo-item' +
          (isActive ? " is-active" : "") +
          '">' +
          '<div class="photo-item-copy">' +
          "<strong>" +
          escapeHtml(index + 1 + ". " + photo.name) +
          "</strong>" +
          "<span>" +
          subtitle +
          "</span>" +
          "</div>" +
          '<div class="photo-item-actions">' +
          '<button type="button" class="btn btn-secondary btn-compact" data-photo-action="preview" data-index="' +
          index +
          '">Preview</button>' +
          '<button type="button" class="btn btn-secondary btn-compact" data-photo-action="download" data-index="' +
          index +
          '">Download</button>' +
          '<button type="button" class="btn btn-secondary btn-compact" data-photo-action="remove" data-index="' +
          index +
          '">Remove</button>' +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function updatePhotoUi() {
    var activePhoto = getActivePhoto();
    var hasPhoto = Boolean(activePhoto);
    var hasPhotos = state.photos.length > 0;

    elements.clearPhotoBtn.disabled = !hasPhoto;
    elements.clearAllBtn.disabled = !hasPhotos;
    elements.prevPhotoBtn.disabled = state.photos.length < 2;
    elements.nextPhotoBtn.disabled = state.photos.length < 2;
    elements.downloadBtn.disabled = !hasPhoto;
    elements.downloadAllBtn.disabled = !hasPhotos;
    elements.previewDownloadBtn.disabled = !hasPhoto;
    elements.refreshPreviewBtn.disabled = !hasPhoto;
    elements.photoCount.textContent = hasPhotos
      ? state.photos.length + " photo" + (state.photos.length === 1 ? "" : "s") + " loaded"
      : "0 photos loaded";
    elements.photoQueueHint.textContent = hasPhotos
      ? "Previewing " + (state.activePhotoIndex + 1) + " of " + state.photos.length + "."
      : "Bulk upload will create a photo queue here.";
    elements.previewInfo.textContent = hasPhoto
      ? "Previewing " + (state.activePhotoIndex + 1) + " of " + state.photos.length + ": " + activePhoto.name
      : "The final image will appear here.";
    elements.emptyState.classList.toggle("hidden", hasPhoto);
    elements.previewCanvas.classList.toggle("hidden-canvas", !hasPhoto);
    renderPhotoList();
  }

  function updateLogoUi() {
    elements.logoLabel.textContent = state.logo ? state.logo.name : "Upload logo";
  }

  function updateTextUi() {
    var textActive = state.textEnabled;
    var textStyleActive = state.textEnabled || state.dateEnabled;

    elements.watermarkText.disabled = !textActive;
    elements.textFontFamily.disabled = !textStyleActive;
    elements.textFontWeight.disabled = !textStyleActive;
    elements.textFillColor.disabled = !textStyleActive;
    elements.textStrokeColor.disabled = !textStyleActive;
    elements.textShadow.disabled = !textStyleActive;
  }

  function setLogoSource(logo, source) {
    state.logo = logo;
    state.logoSource = source || "none";
    updateLogoUi();
  }

  function loadDefaultLogo() {
    if (defaultLogoPromise) {
      return defaultLogoPromise;
    }

    defaultLogoPromise = (async function () {
      try {
        var response = await fetch("./logo.png", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Could not fetch logo.png");
        }

        var blob = await response.blob();
        var dataUrl = await readBlobAsDataUrl(blob);
        return { dataUrl: dataUrl, name: "logo.png" };
      } catch (error) {
        return { dataUrl: "./logo.png", name: "logo.png" };
      }
    })();

    return defaultLogoPromise;
  }

  async function useDefaultLogo() {
    try {
      var defaultLogo = await loadDefaultLogo();
      setLogoSource(defaultLogo, "default");
      state.logoEnabled = true;
      elements.logoEnabled.checked = true;
      setMessage("Default logo loaded from logo.png.");
      drawWatermark();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load the default logo.");
    }
  }

  async function applyPhotoSelectionDefaults() {
    var activePhoto = getActivePhoto();
    if (!activePhoto) {
      return;
    }

    if (!state.hasAutoEnabledRepeat) {
      state.repeatEnabled = true;
      state.hasAutoEnabledRepeat = true;
      elements.repeatEnabled.checked = true;
    }

    if (state.logoSource === "none") {
      var defaultLogo = await loadDefaultLogo();
      setLogoSource(defaultLogo, "default");
      state.logoEnabled = true;
      elements.logoEnabled.checked = true;
    }
  }

  function syncFormControls() {
    elements.textEnabled.checked = state.textEnabled;
    elements.watermarkText.value = state.watermarkText;
    elements.textFontFamily.value = state.textFontFamily;
    elements.textFontWeight.value = state.textFontWeight;
    elements.textFillColor.value = state.textFillColor;
    elements.textStrokeColor.value = state.textStrokeColor;
    elements.textShadow.value = String(state.textShadow);
    elements.dateEnabled.checked = state.dateEnabled;
    elements.logoEnabled.checked = state.logoEnabled;
    elements.position.value = state.position;
    elements.repeatEnabled.checked = state.repeatEnabled;
    elements.repeatColumns.value = String(state.repeatColumns);
    elements.repeatRows.value = String(state.repeatRows);
    elements.repeatGapX.value = String(state.repeatGapX);
    elements.repeatGapY.value = String(state.repeatGapY);
    elements.opacity.value = String(state.opacity);
    elements.textSize.value = String(state.textSize);
    elements.logoSize.value = String(state.logoSize);
    elements.rotation.value = String(state.rotation);
    elements.format.value = state.format;
    elements.quality.value = String(state.quality);
    updateValueBadges();
    updateQualityField();
    updateCameraUi();
    updatePhotoUi();
    updateLogoUi();
    updateTextUi();
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(function (track) {
        track.stop();
      });
    }

    stream = null;
    state.cameraOpen = false;
    elements.cameraPreview.srcObject = null;
    updateCameraUi();
  }

  async function startCamera() {
    setMessage("Requesting camera permission...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMessage("Live camera is not supported in this browser. Use Upload / Camera instead.");
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1600 },
          height: { ideal: 1200 }
        }
      });

      elements.cameraPreview.srcObject = stream;
      state.cameraOpen = true;
      updateCameraUi();
      await elements.cameraPreview.play();
      setMessage("Camera is open. Tap Capture Photo.");
    } catch (error) {
      stopCamera();
      setMessage("Camera permission was blocked, unavailable, or the page is not HTTPS. Use Upload / Camera instead.");
    }
  }

  function clearCanvas() {
    var canvas = elements.previewCanvas;
    var context = canvas.getContext("2d");

    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function addPhotos(photos, activateIndex) {
    if (!photos.length) {
      return;
    }

    Array.prototype.push.apply(state.photos, photos);
    if (typeof activateIndex === "number") {
      state.activePhotoIndex = Math.max(0, Math.min(state.photos.length - 1, activateIndex));
    } else if (state.activePhotoIndex === -1) {
      state.activePhotoIndex = 0;
    }
    updatePhotoUi();
  }

  function setActivePhotoIndex(index) {
    if (!state.photos.length) {
      state.activePhotoIndex = -1;
      updatePhotoUi();
      clearCanvas();
      return;
    }

    state.activePhotoIndex = Math.max(0, Math.min(state.photos.length - 1, index));
    updatePhotoUi();
    applyPhotoSelectionDefaults()
      .catch(function () {
        return null;
      })
      .then(function () {
        drawWatermark();
      });
  }

  function removePhotoAt(index) {
    if (index < 0 || index >= state.photos.length) {
      return null;
    }

    var removed = state.photos.splice(index, 1)[0];

    if (!state.photos.length) {
      state.activePhotoIndex = -1;
      state.hasAutoEnabledRepeat = false;
    } else if (state.activePhotoIndex >= state.photos.length) {
      state.activePhotoIndex = state.photos.length - 1;
    } else if (index < state.activePhotoIndex) {
      state.activePhotoIndex -= 1;
    }

    updatePhotoUi();
    return removed;
  }

  async function handlePhotoUpload(event) {
    var files = Array.prototype.slice.call(event.target.files || []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    var imageFiles = files.filter(function (file) {
      return file.type.startsWith("image/");
    });

    if (!imageFiles.length) {
      setMessage("Please select an image file.");
      return;
    }

    try {
      setMessage("Loading " + imageFiles.length + " photo" + (imageFiles.length === 1 ? "" : "s") + "...");
      var loadedPhotos = await Promise.all(
        imageFiles.map(async function (file) {
          var dataUrl = await readFileAsDataUrl(file);
          return { dataUrl: dataUrl, name: file.name };
        })
      );
      var activateIndex = state.photos.length;
      addPhotos(loadedPhotos, activateIndex);
      stopCamera();
      await applyPhotoSelectionDefaults().catch(function () {
        return null;
      });
      setMessage(
        loadedPhotos.length === 1
          ? "Photo loaded. Watermark preview is preparing."
          : loadedPhotos.length + " photos added. Watermark preview is preparing."
      );
      drawWatermark();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Photo upload failed.");
    }
  }

  async function handleLogoUpload(event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".svg")) {
      setMessage("Please select a PNG, JPG, WEBP, or SVG logo.");
      return;
    }

    try {
      var dataUrl = await readFileAsDataUrl(file);
      setLogoSource({ dataUrl: dataUrl, name: file.name }, "custom");
      state.logoEnabled = true;
      elements.logoEnabled.checked = true;
      setMessage("Logo loaded.");
      drawWatermark();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Logo upload failed.");
    }
  }

  async function capturePhoto() {
    var video = elements.cameraPreview;

    if (!video.videoWidth || !video.videoHeight) {
      setMessage("Camera is not ready yet. Wait a moment and try Capture Photo again.");
      return;
    }

    var captureCanvas = document.createElement("canvas");
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;

    var context = captureCanvas.getContext("2d");
    if (!context) {
      setMessage("Camera capture failed.");
      return;
    }

    context.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    var dataUrl = captureCanvas.toDataURL("image/jpeg", 0.95);
    addPhotos([{ dataUrl: dataUrl, name: "camera-photo-" + Date.now() + ".jpg" }], state.photos.length);
    stopCamera();
    await applyPhotoSelectionDefaults().catch(function () {
      return null;
    });
    setMessage("Camera photo captured. Watermark preview is preparing.");
    drawWatermark();
  }

  function clearPhoto() {
    var activePhoto = getActivePhoto();
    if (!activePhoto) {
      setMessage("Upload or capture a photo first.");
      return;
    }

    var removedPhoto = removePhotoAt(state.activePhotoIndex);

    if (getActivePhoto()) {
      setMessage((removedPhoto ? removedPhoto.name : "Photo") + " removed. Preview updated.");
      drawWatermark();
      return;
    }

    clearCanvas();
    setMessage("Photo cleared. Upload or take another photo.");
  }

  function clearAllPhotos() {
    state.photos = [];
    state.activePhotoIndex = -1;
    state.hasAutoEnabledRepeat = false;
    clearCanvas();
    updatePhotoUi();
    setMessage("All photos cleared. Upload or take another photo.");
  }

  function createRenderSnapshot(photo) {
    return {
      photo: photo,
      logo: state.logo,
      textEnabled: state.textEnabled,
      logoEnabled: state.logoEnabled,
      dateEnabled: state.dateEnabled,
      repeatEnabled: state.repeatEnabled,
      watermarkText: state.watermarkText,
      textFontFamily: state.textFontFamily,
      textFontWeight: state.textFontWeight,
      textFillColor: state.textFillColor,
      textStrokeColor: state.textStrokeColor,
      textShadow: state.textShadow,
      dateText: todayStamp(),
      position: state.position,
      opacity: state.opacity,
      textSize: state.textSize,
      logoSize: state.logoSize,
      rotation: state.rotation,
      repeatColumns: state.repeatColumns,
      repeatRows: state.repeatRows,
      repeatGapX: state.repeatGapX,
      repeatGapY: state.repeatGapY
    };
  }

  async function loadRenderAssets(snapshot) {
    var image = await loadImage(snapshot.photo.dataUrl);
    var logoImage = snapshot.logo && snapshot.logoEnabled ? await loadImage(snapshot.logo.dataUrl) : null;
    return { image: image, logoImage: logoImage };
  }

  function fontDeclaration(snapshot, fontSize) {
    return snapshot.textFontWeight + " " + fontSize + "px " + snapshot.textFontFamily;
  }

  function hexToRgba(hex, alpha) {
    var normalized = String(hex || "")
      .trim()
      .replace(/^#/, "");

    if (normalized.length === 3) {
      normalized = normalized
        .split("")
        .map(function (character) {
          return character + character;
        })
        .join("");
    }

    if (!/^[0-9a-f]{6}$/i.test(normalized)) {
      return "rgba(0, 0, 0, " + alpha + ")";
    }

    return (
      "rgba(" +
      parseInt(normalized.slice(0, 2), 16) +
      ", " +
      parseInt(normalized.slice(2, 4), 16) +
      ", " +
      parseInt(normalized.slice(4, 6), 16) +
      ", " +
      alpha +
      ")"
    );
  }

  function drawSnapshotToCanvas(canvas, snapshot, assets) {
    var context = canvas.getContext("2d");
    if (!context) {
      return false;
    }

    var image = assets.image;
    var logoImage = assets.logoImage;
    var maxSide = 4200;
    var scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));

    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    var textLines = [];
    if (snapshot.textEnabled && snapshot.watermarkText.trim()) {
      textLines.push(snapshot.watermarkText.trim());
    }
    if (snapshot.dateEnabled) {
      textLines.push(snapshot.dateText);
    }

    if (!textLines.length && !logoImage) {
      return false;
    }

    var fontSize = Math.max(18, Math.round(canvas.width * (snapshot.textSize / 100)));
    var gap = Math.max(10, Math.round(canvas.width * 0.012));
    var textFont = fontDeclaration(snapshot, fontSize);
    var textShadowRatio = snapshot.textShadow / 100;
    var strokeWidth = Math.max(2, fontSize * 0.1);
    var shadowBlur = textShadowRatio ? Math.max(0, fontSize * (0.08 + textShadowRatio * 0.24)) : 0;
    var shadowOffsetY = textShadowRatio ? Math.max(0, fontSize * (0.02 + textShadowRatio * 0.08)) : 0;

    context.font = textFont;
    var textWidth = textLines.length
      ? Math.max.apply(
          null,
          textLines.map(function (line) {
            return context.measureText(line).width;
          })
        )
      : 0;
    var textHeight = textLines.length * fontSize * 1.25;

    var logoWidth = logoImage ? Math.round(canvas.width * (snapshot.logoSize / 100)) : 0;
    var logoHeight = logoImage ? Math.round(logoWidth * (logoImage.naturalHeight / logoImage.naturalWidth)) : 0;
    var blockWidth = Math.max(textWidth, logoWidth, 1);
    var blockHeight = logoHeight + textHeight + (logoImage && textLines.length ? gap : 0);

    function drawBlock(centerX, centerY, angle) {
      context.save();
      context.translate(centerX, centerY);
      context.rotate((angle * Math.PI) / 180);
      context.globalAlpha = snapshot.opacity / 100;

      var y = -blockHeight / 2;

      if (logoImage) {
        context.drawImage(logoImage, -logoWidth / 2, y, logoWidth, logoHeight);
        y += logoHeight + (textLines.length ? gap : 0);
      }

      if (textLines.length) {
        context.font = textFont;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.lineWidth = strokeWidth;
        context.strokeStyle = snapshot.textStrokeColor;
        context.fillStyle = snapshot.textFillColor;
        context.shadowColor = hexToRgba(snapshot.textStrokeColor, 0.16 + textShadowRatio * 0.28);
        context.shadowBlur = shadowBlur;
        context.shadowOffsetY = shadowOffsetY;

        textLines.forEach(function (line, index) {
          var lineY = y + fontSize * 0.62 + index * fontSize * 1.25;
          context.strokeText(line, 0, lineY);
          context.fillText(line, 0, lineY);
        });
      }

      context.restore();
    }

    if (snapshot.repeatEnabled) {
      var angle = snapshot.rotation === 0 ? -24 : snapshot.rotation;
      var repeatColumns = Math.max(1, snapshot.repeatColumns);
      var repeatRows = Math.max(1, snapshot.repeatRows);
      var horizontalGap = Math.round(canvas.width * (snapshot.repeatGapX / 100));
      var verticalGap = Math.round(canvas.height * (snapshot.repeatGapY / 100));
      var spacingX = repeatColumns === 1 ? 0 : Math.max(blockWidth + horizontalGap, (canvas.width - blockWidth) / (repeatColumns - 1));
      var spacingY = repeatRows === 1 ? 0 : Math.max(blockHeight + verticalGap, (canvas.height - blockHeight) / (repeatRows - 1));
      var totalWidth = repeatColumns === 1 ? 0 : spacingX * (repeatColumns - 1);
      var totalHeight = repeatRows === 1 ? 0 : spacingY * (repeatRows - 1);
      var startX = repeatColumns === 1 ? canvas.width / 2 : (canvas.width - totalWidth) / 2;
      var startY = repeatRows === 1 ? canvas.height / 2 : (canvas.height - totalHeight) / 2;

      for (var row = 0; row < repeatRows; row += 1) {
        for (var column = 0; column < repeatColumns; column += 1) {
          drawBlock(startX + column * spacingX, startY + row * spacingY, angle);
        }
      }
    } else {
      var padding = Math.max(24, Math.round(canvas.width * 0.035));
      var x = canvas.width - padding - blockWidth / 2;
      var y = canvas.height - padding - blockHeight / 2;

      if (snapshot.position === "bottom-left") {
        x = padding + blockWidth / 2;
        y = canvas.height - padding - blockHeight / 2;
      }
      if (snapshot.position === "top-right") {
        x = canvas.width - padding - blockWidth / 2;
        y = padding + blockHeight / 2;
      }
      if (snapshot.position === "top-left") {
        x = padding + blockWidth / 2;
        y = padding + blockHeight / 2;
      }
      if (snapshot.position === "center") {
        x = canvas.width / 2;
        y = canvas.height / 2;
      }

      drawBlock(x, y, snapshot.rotation);
    }

    return true;
  }

  function canvasToBlob(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(
        function (blob) {
          if (!blob) {
            reject(new Error("Download failed. Try again."));
            return;
          }

          resolve(blob);
        },
        state.format,
        state.format === "image/jpeg" ? state.quality / 100 : undefined
      );
    });
  }

  function triggerBlobDownload(blob, fileName) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function buildWatermarkedAsset(photo) {
    var snapshot = createRenderSnapshot(photo);
    var offscreenCanvas = document.createElement("canvas");
    var assets = await loadRenderAssets(snapshot);
    var drawn = drawSnapshotToCanvas(offscreenCanvas, snapshot, assets);

    if (!drawn) {
      throw new Error("Enable text, logo, or date watermark before downloading.");
    }

    var extension = state.format === "image/png" ? "png" : "jpg";
    return {
      blob: await canvasToBlob(offscreenCanvas),
      fileName: safeFileName(photo.name, extension)
    };
  }

  async function downloadPhotoByIndex(index, options) {
    var settings = options || {};
    var photo = state.photos[index];

    if (!photo) {
      if (!settings.silent) {
        setMessage("That photo is no longer available.");
      }
      return;
    }

    if (!settings.silent) {
      setMessage("Preparing " + photo.name + "...");
    }

    var asset = await buildWatermarkedAsset(photo);
    triggerBlobDownload(asset.blob, asset.fileName);

    if (!settings.silent) {
      setMessage("Downloaded " + photo.name + ".");
    }
  }

  async function downloadImage() {
    if (!getActivePhoto()) {
      setMessage("Upload or capture a photo first.");
      return;
    }

    try {
      await downloadPhotoByIndex(state.activePhotoIndex);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Download failed. Try again.");
    }
  }

  async function fallbackBulkDownload() {
    setMessage(
      "Starting separate downloads. If your browser asks, allow multiple downloads for this page."
    );

    for (var index = 0; index < state.photos.length; index += 1) {
      await downloadPhotoByIndex(index, { silent: true });
      await pause(140);
    }

    setMessage("All photos were sent to the browser download queue.");
  }

  async function downloadAllPhotos() {
    if (!state.photos.length) {
      setMessage("Upload one or more photos first.");
      return;
    }

    try {
      if (window.JSZip) {
        setMessage("Preparing ZIP for " + state.photos.length + " photos...");
        var zip = new window.JSZip();

        for (var index = 0; index < state.photos.length; index += 1) {
          var asset = await buildWatermarkedAsset(state.photos[index]);
          zip.file(asset.fileName, asset.blob);
        }

        var zipBlob = await zip.generateAsync({ type: "blob" });
        triggerBlobDownload(zipBlob, "watermark-studio-batch-" + batchStamp() + ".zip");
        setMessage("ZIP download is ready.");
        return;
      }

      await fallbackBulkDownload();
    } catch (error) {
      if (window.JSZip) {
        setMessage("ZIP download failed, so the app is switching to separate downloads.");
        try {
          await fallbackBulkDownload();
          return;
        } catch (fallbackError) {
          setMessage(fallbackError instanceof Error ? fallbackError.message : "Bulk download failed.");
          return;
        }
      }

      setMessage(error instanceof Error ? error.message : "Bulk download failed.");
    }
  }

  async function drawWatermark() {
    var photo = getActivePhoto();
    var canvas = elements.previewCanvas;

    if (!photo) {
      renderToken += 1;
      updatePhotoUi();
      return;
    }

    var token = ++renderToken;
    var snapshot = createRenderSnapshot(photo);

    try {
      var assets = await loadRenderAssets(snapshot);

      if (token !== renderToken) {
        return;
      }

      var drawn = drawSnapshotToCanvas(canvas, snapshot, assets);

      if (token !== renderToken) {
        return;
      }

      if (!drawn) {
        updatePhotoUi();
        setMessage("Photo loaded. Enable text, logo, or date watermark.");
        return;
      }

      updatePhotoUi();
      setMessage("Preview ready. You can download the selected photo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong while drawing the image.");
    }
  }

  function bindEvents() {
    elements.photoInput.addEventListener("change", handlePhotoUpload);
    elements.logoInput.addEventListener("change", handleLogoUpload);
    elements.sampleLogoBtn.addEventListener("click", useDefaultLogo);
    elements.clearPhotoBtn.addEventListener("click", clearPhoto);
    elements.clearAllBtn.addEventListener("click", clearAllPhotos);
    elements.capturePhotoBtn.addEventListener("click", capturePhoto);
    elements.downloadBtn.addEventListener("click", downloadImage);
    elements.downloadAllBtn.addEventListener("click", downloadAllPhotos);
    elements.previewDownloadBtn.addEventListener("click", downloadImage);
    elements.refreshPreviewBtn.addEventListener("click", drawWatermark);
    elements.prevPhotoBtn.addEventListener("click", function () {
      if (state.photos.length < 2) {
        return;
      }

      setActivePhotoIndex((state.activePhotoIndex - 1 + state.photos.length) % state.photos.length);
    });
    elements.nextPhotoBtn.addEventListener("click", function () {
      if (state.photos.length < 2) {
        return;
      }

      setActivePhotoIndex((state.activePhotoIndex + 1) % state.photos.length);
    });

    elements.photoList.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-photo-action]");
      if (!button) {
        return;
      }

      var index = Number(button.getAttribute("data-index"));
      var action = button.getAttribute("data-photo-action");

      if (action === "preview") {
        setActivePhotoIndex(index);
        return;
      }

      if (action === "download") {
        downloadPhotoByIndex(index).catch(function (error) {
          setMessage(error instanceof Error ? error.message : "Download failed. Try again.");
        });
        return;
      }

      if (action === "remove") {
        var removed = removePhotoAt(index);

        if (getActivePhoto()) {
          setMessage((removed ? removed.name : "Photo") + " removed. Preview updated.");
          drawWatermark();
          return;
        }

        clearCanvas();
        setMessage("Photo removed. Upload more photos to continue.");
      }
    });

    elements.cameraToggleBtn.addEventListener("click", function () {
      if (state.cameraOpen) {
        stopCamera();
        setMessage("Camera closed.");
        return;
      }

      startCamera();
    });

    elements.textEnabled.addEventListener("change", function (event) {
      state.textEnabled = event.target.checked;
      updateTextUi();
      drawWatermark();
    });

    elements.watermarkText.addEventListener("input", function (event) {
      state.watermarkText = event.target.value;
      drawWatermark();
    });

    elements.textFontFamily.addEventListener("change", function (event) {
      state.textFontFamily = event.target.value;
      drawWatermark();
    });

    elements.textFontWeight.addEventListener("change", function (event) {
      state.textFontWeight = event.target.value;
      drawWatermark();
    });

    elements.textFillColor.addEventListener("input", function (event) {
      state.textFillColor = event.target.value;
      drawWatermark();
    });

    elements.textStrokeColor.addEventListener("input", function (event) {
      state.textStrokeColor = event.target.value;
      drawWatermark();
    });

    elements.textShadow.addEventListener("input", function (event) {
      state.textShadow = Number(event.target.value);
      updateValueBadges();
      drawWatermark();
    });

    elements.dateEnabled.addEventListener("change", function (event) {
      state.dateEnabled = event.target.checked;
      updateTextUi();
      drawWatermark();
    });

    elements.logoEnabled.addEventListener("change", function (event) {
      state.logoEnabled = event.target.checked;
      drawWatermark();
    });

    elements.position.addEventListener("change", function (event) {
      state.position = event.target.value;
      drawWatermark();
    });

    elements.repeatEnabled.addEventListener("change", function (event) {
      state.repeatEnabled = event.target.checked;
      drawWatermark();
    });

    elements.repeatColumns.addEventListener("input", function (event) {
      state.repeatColumns = Number(event.target.value);
      updateValueBadges();
      drawWatermark();
    });

    elements.repeatRows.addEventListener("input", function (event) {
      state.repeatRows = Number(event.target.value);
      updateValueBadges();
      drawWatermark();
    });

    elements.repeatGapX.addEventListener("input", function (event) {
      state.repeatGapX = Number(event.target.value);
      updateValueBadges();
      drawWatermark();
    });

    elements.repeatGapY.addEventListener("input", function (event) {
      state.repeatGapY = Number(event.target.value);
      updateValueBadges();
      drawWatermark();
    });

    elements.opacity.addEventListener("input", function (event) {
      state.opacity = Number(event.target.value);
      updateValueBadges();
      drawWatermark();
    });

    elements.textSize.addEventListener("input", function (event) {
      state.textSize = Number(event.target.value);
      updateValueBadges();
      drawWatermark();
    });

    elements.logoSize.addEventListener("input", function (event) {
      state.logoSize = Number(event.target.value);
      updateValueBadges();
      drawWatermark();
    });

    elements.rotation.addEventListener("input", function (event) {
      state.rotation = Number(event.target.value);
      updateValueBadges();
      drawWatermark();
    });

    elements.format.addEventListener("change", function (event) {
      state.format = event.target.value;
      updateQualityField();
      drawWatermark();
    });

    elements.quality.addEventListener("input", function (event) {
      state.quality = Number(event.target.value);
      updateValueBadges();
    });

    window.addEventListener("beforeunload", stopCamera);
  }

  syncFormControls();
  bindEvents();
})();
