"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ACCEPTED = /\.(html?|md|markdown)$/i;

const STATUS_LABEL = {
  queued: "Waiting",
  converting: "Converting",
  done: "Ready",
  failed: "Failed",
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function kindOf(name) {
  return /\.(md|markdown)$/i.test(name) ? "Markdown" : "HTML";
}

let nextId = 0;

export default function Home() {
  const [items, setItems] = useState([]);
  const [isOver, setIsOver] = useState(false);
  const [working, setWorking] = useState(false);
  const [rejected, setRejected] = useState(0);
  const [settings, setSettings] = useState({
    format: "A4",
    landscape: false,
    printBackground: true,
    marginVertical: "20mm",
    marginHorizontal: "15mm",
  });

  const inputRef = useRef(null);
  const urlsRef = useRef([]);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const addFiles = useCallback((fileList) => {
    const files = Array.from(fileList);
    const accepted = files.filter((file) => ACCEPTED.test(file.name));

    setRejected(files.length - accepted.length);

    if (accepted.length === 0) return;

    setItems((current) => [
      ...current,
      ...accepted.map((file) => ({
        id: ++nextId,
        file,
        status: "queued",
        url: null,
        pdfName: null,
        error: null,
      })),
    ]);
  }, []);

  const onDrop = (event) => {
    event.preventDefault();
    setIsOver(false);
    if (event.dataTransfer?.files?.length) addFiles(event.dataTransfer.files);
  };

  const convert = async () => {
    const pending = items.filter((item) => item.status === "queued");
    if (pending.length === 0) return;

    setWorking(true);

    for (const item of pending) {
      setItems((current) =>
        current.map((row) =>
          row.id === item.id ? { ...row, status: "converting" } : row
        )
      );

      const body = new FormData();
      body.append("file", item.file);
      body.append("format", settings.format);
      body.append("landscape", String(settings.landscape));
      body.append("printBackground", String(settings.printBackground));
      body.append("marginVertical", settings.marginVertical);
      body.append("marginHorizontal", settings.marginHorizontal);

      try {
        const response = await fetch("/api/convert", { method: "POST", body });

        if (!response.ok) {
          const detail = await response.json().catch(() => ({}));
          throw new Error(detail.error || `Server returned ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        urlsRef.current.push(url);

        const pdfName =
          response.headers.get("X-Pdf-Filename") ||
          item.file.name.replace(ACCEPTED, "") + ".pdf";

        setItems((current) =>
          current.map((row) =>
            row.id === item.id
              ? { ...row, status: "done", url, pdfName, error: null }
              : row
          )
        );
      } catch (error) {
        setItems((current) =>
          current.map((row) =>
            row.id === item.id
              ? { ...row, status: "failed", error: error.message }
              : row
          )
        );
      }
    }

    setWorking(false);
  };

  const clearQueue = () => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = [];
    setItems([]);
    setRejected(0);
  };

  const queuedCount = items.filter((item) => item.status === "queued").length;
  const readyCount = items.filter((item) => item.status === "done").length;

  return (
    <main className={`shell${working ? " is-working" : ""}`}>
      <header className="masthead">
        <p className="wordmark">htmltopdf</p>
        <h1>Drop a page in, take a print-ready PDF out.</h1>
        <p>
          Headless Chromium renders each HTML or Markdown file the way it would
          print, then writes a PDF at the page size you pick. Files stay on this
          machine.
        </p>
      </header>

      <div className="workbench">
        <button
          type="button"
          className={`dropzone${isOver ? " is-over" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsOver(true);
          }}
          onDragLeave={() => setIsOver(false)}
          onDrop={onDrop}
        >
          <span className="dropzone-inner">
            <span>
              <span className="dropzone-headline">
                Drag files onto the sheet
              </span>
              <span className="dropzone-note">
                .html, .htm, .md and .markdown, up to 20 MB each. Or click to
                browse.
              </span>
            </span>

            <span className="sheet-foot">
              <span className="registration" aria-hidden="true" />
              <span>
                {items.length === 0
                  ? "No files yet"
                  : `${items.length} file${items.length === 1 ? "" : "s"} added, ${readyCount} ready`}
              </span>
            </span>
          </span>
        </button>

        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          multiple
          accept=".html,.htm,.md,.markdown,text/html,text/markdown"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <section className="specs" aria-label="Output settings">
          <h2>Output settings</h2>

          <div className="spec-row">
            <label htmlFor="format">Page size</label>
            <select
              id="format"
              value={settings.format}
              onChange={(event) =>
                setSettings({ ...settings, format: event.target.value })
              }
            >
              {["A3", "A4", "A5", "Letter", "Legal", "Tabloid"].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="spec-row">
            <label htmlFor="orientation">Orientation</label>
            <select
              id="orientation"
              value={settings.landscape ? "landscape" : "portrait"}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  landscape: event.target.value === "landscape",
                })
              }
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          <div className="spec-row">
            <label htmlFor="marginVertical">Top and bottom margin</label>
            <input
              id="marginVertical"
              type="text"
              value={settings.marginVertical}
              onChange={(event) =>
                setSettings({ ...settings, marginVertical: event.target.value })
              }
            />
          </div>

          <div className="spec-row">
            <label htmlFor="marginHorizontal">Left and right margin</label>
            <input
              id="marginHorizontal"
              type="text"
              value={settings.marginHorizontal}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  marginHorizontal: event.target.value,
                })
              }
            />
          </div>

          <div className="spec-row">
            <span>Backgrounds</span>
            <span className="switch">
              <input
                id="printBackground"
                type="checkbox"
                checked={settings.printBackground}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    printBackground: event.target.checked,
                  })
                }
              />
              <label htmlFor="printBackground">Print colors and images</label>
            </span>
          </div>

          <div className="actions">
            <button
              type="button"
              className="primary"
              onClick={convert}
              disabled={working || queuedCount === 0}
            >
              {working ? "Converting" : "Convert to PDF"}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={clearQueue}
              disabled={working || items.length === 0}
            >
              Clear queue
            </button>
          </div>
        </section>
      </div>

      {rejected > 0 && (
        <p className="colophon" role="status">
          Skipped {rejected} file{rejected === 1 ? "" : "s"} that is not HTML or
          Markdown.
        </p>
      )}

      {items.length > 0 && (
        <section className="queue">
          <h2>Queue</h2>
          <ol>
            {items.map((item) => (
              <li key={item.id}>
                <div>
                  <div className="file-name">{item.file.name}</div>
                  <div className="file-meta">
                    {kindOf(item.file.name)}, {formatSize(item.file.size)}
                  </div>
                </div>

                <span className={`status ${item.status}`}>
                  {STATUS_LABEL[item.status]}
                </span>

                {item.url ? (
                  <a className="download" href={item.url} download={item.pdfName}>
                    Download PDF
                  </a>
                ) : (
                  <span />
                )}

                {item.error && <p className="error-text">{item.error}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="colophon">
        Rendering runs in a local headless Chromium, so a dropped file gets the
        same network and script access the browser has. Only convert files you
        trust.
      </p>
    </main>
  );
}
