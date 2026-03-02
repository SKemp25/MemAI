import { useState, useRef } from 'react';
import { hasPin, setPin, clearPin, checkPin } from '../data/pinLock';
import { loadTheme, saveTheme, loadCustomAccent, saveCustomAccent } from '../data/store';
import './SecurityAndBackup.css';

const EXPORT_VERSION = 1;

function buildExportData(conversations, recommendations, categories, tags, theme, customAccent) {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    conversations: conversations ?? [],
    recommendations: recommendations ?? [],
    categories: categories ?? [],
    tags: tags ?? [],
    theme: theme ?? loadTheme(),
    customAccent: customAccent ?? loadCustomAccent(),
  };
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJson(data) {
  downloadFile(
    JSON.stringify(data, null, 2),
    `chatgpt-convo-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`,
    'application/json'
  );
}

function escapeCsv(value) {
  const s = String(value ?? '');
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function buildCsv(conversations, recommendations, categories, tags) {
  const getCat = (id) => categories?.find((c) => c.id === id)?.name ?? '';
  const getTagNames = (ids) => (ids || []).map((id) => tags?.find((t) => t.id === id)?.name).filter(Boolean).join(', ');
  const getConvTitle = (id) => conversations?.find((c) => c.id === id)?.title ?? '';

  const rows = [];
  rows.push('Conversations');
  rows.push(['Title', 'Date', 'Category', 'Tags', 'Content', 'Summary'].map(escapeCsv).join(','));
  (conversations || []).forEach((c) => {
    rows.push(
      [
        c.title,
        c.createdAt ? new Date(c.createdAt).toLocaleString() : '',
        getCat(c.categoryId),
        getTagNames(c.tagIds),
        (c.content || '').slice(0, 2000),
        (c.summary || '').slice(0, 500),
      ].map(escapeCsv).join(',')
    );
  });
  rows.push('');
  rows.push('Recommendations');
  rows.push(['Type', 'Text', 'URL', 'From conversation'].map(escapeCsv).join(','));
  (recommendations || []).forEach((r) => {
    rows.push(
      [r.type ?? '', r.text ?? '', r.url ?? '', getConvTitle(r.conversationId)].map(escapeCsv).join(',')
    );
  });
  return '\uFEFF' + rows.join('\r\n'); // BOM for Excel UTF-8
}

function buildTextExport(conversations, recommendations, categories, tags) {
  const getCat = (id) => categories?.find((c) => c.id === id)?.name ?? '';
  const getTagNames = (ids) => (ids || []).map((id) => tags?.find((t) => t.id === id)?.name).filter(Boolean).join(', ');
  const getConvTitle = (id) => conversations?.find((c) => c.id === id)?.title ?? '';

  const lines = [];
  const date = new Date().toLocaleDateString();
  lines.push('Conversation & recommendations export');
  lines.push(`Exported: ${date}`);
  lines.push('');

  lines.push('=== CONVERSATIONS ===');
  (conversations || []).forEach((c) => {
    lines.push('');
    lines.push(`--- ${(c.title || 'Untitled').trim()} ---`);
    lines.push(`Date: ${c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}`);
    lines.push(`Category: ${getCat(c.categoryId)}`);
    lines.push(`Tags: ${getTagNames(c.tagIds)}`);
    if (c.summary) lines.push(`Summary: ${c.summary.trim()}`);
    lines.push('Content:');
    lines.push((c.content || '').trim() || '(none)');
    lines.push('');
  });

  lines.push('=== RECOMMENDATIONS ===');
  (recommendations || []).forEach((r) => {
    lines.push('');
    lines.push(`[${(r.type || 'link').toUpperCase()}] ${(r.text || r.url || '').slice(0, 80)}`);
    if (r.url) lines.push(`  URL: ${r.url}`);
    lines.push(`  From: ${getConvTitle(r.conversationId)}`);
  });

  return lines.join('\r\n');
}

export function SecurityAndBackup({
  conversations,
  recommendations,
  categories,
  tags,
  theme,
  customAccent,
  replaceData,
  setTheme,
  setCustomAccent,
  onLock,
}) {
  const [open, setOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [showSetPin, setShowSetPin] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  const pinIsSet = hasPin();

  const handleSetPin = async (e) => {
    e.preventDefault();
    setPinMessage('');
    const p = newPinInput.trim();
    if (p.length < 4) {
      setPinMessage('Use at least 4 digits.');
      return;
    }
    try {
      await setPin(p);
      setNewPinInput('');
      setShowSetPin(false);
      setPinMessage('PIN set. Lock the app to require it.');
    } catch {
      setPinMessage('Could not set PIN.');
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setPinMessage('');
    const current = pinInput.trim();
    const newP = newPinInput.trim();
    if (!current || !newP) {
      setPinMessage('Enter current and new PIN.');
      return;
    }
    const ok = await checkPin(current);
    if (!ok) {
      setPinMessage('Current PIN is wrong.');
      return;
    }
    if (newP.length < 4) {
      setPinMessage('New PIN: at least 4 digits.');
      return;
    }
    try {
      await setPin(newP);
      setPinInput('');
      setNewPinInput('');
      setShowChangePin(false);
      setPinMessage('PIN updated.');
    } catch {
      setPinMessage('Could not update PIN.');
    }
  };

  const handleRemovePin = async () => {
    const ok = await checkPin(pinInput.trim());
    if (!ok) {
      setPinMessage('Wrong PIN.');
      return;
    }
    clearPin();
    setPinInput('');
    setShowChangePin(false);
    setPinMessage('PIN removed.');
  };

  const handleExportJson = () => {
    const data = buildExportData(
      conversations,
      recommendations,
      categories,
      tags,
      theme,
      customAccent
    );
    downloadJson(data);
  };

  const handleExportCsv = () => {
    const csv = buildCsv(conversations, recommendations, categories, tags);
    downloadFile(
      csv,
      `conversations-and-recommendations-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8'
    );
  };

  const handleExportText = () => {
    const text = buildTextExport(conversations, recommendations, categories, tags);
    downloadFile(
      text,
      `conversations-and-recommendations-${new Date().toISOString().slice(0, 10)}.txt`,
      'text/plain;charset=utf-8'
    );
  };

  const handleImport = (e) => {
    setImportError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const conv = parsed.conversations ?? [];
        const rec = parsed.recommendations ?? [];
        const cat = parsed.categories ?? [];
        const tag = parsed.tags ?? [];
        if (!Array.isArray(conv) || !Array.isArray(rec) || !Array.isArray(cat) || !Array.isArray(tag)) {
          setImportError('Invalid backup file.');
          return;
        }
        if (!confirm('This will replace all current data with the backup. Continue?')) {
          return;
        }
        replaceData({ conversations: conv, recommendations: rec, categories: cat, tags: tag });
        if (parsed.theme != null) {
          saveTheme(parsed.theme);
          setTheme(parsed.theme);
        }
        if (parsed.customAccent != null) {
          saveCustomAccent(parsed.customAccent);
          setCustomAccent(parsed.customAccent);
        }
      } catch {
        setImportError('Could not read file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className={`security-backup ${open ? 'security-backup-open' : ''}`} role="group" aria-label="Security and backup">
      <button
        type="button"
        className="security-backup-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="security-backup-label">Security & Backup</span>
        <span className="security-backup-chevron" aria-hidden>{open ? '▼' : '▶'}</span>
      </button>
      {open && (
        <div className="security-backup-content">
          <p className="security-backup-instruction">
            Your data stays on this device. <strong>Export</strong> as CSV (opens in Excel) or text for reading; export backup (JSON) to restore later. Save files to your computer or cloud (e.g. iCloud, Google Drive, OneDrive) so you don’t lose it. Use a device passcode and an app PIN for extra protection.
          </p>

          <div className="security-backup-block">
            <span className="security-backup-subtitle">Export (read or backup)</span>
            <button type="button" className="security-backup-btn" onClick={handleExportCsv}>
              Export as CSV (Excel)
            </button>
            <button type="button" className="security-backup-btn" onClick={handleExportText}>
              Export as text
            </button>
            <button type="button" className="security-backup-btn" onClick={handleExportJson}>
              Export backup (JSON, for restore)
            </button>
            <span className="security-backup-subtitle" style={{ marginTop: '0.5rem' }}>Import</span>
            <button
              type="button"
              className="security-backup-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Import from file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              className="security-backup-file-input"
              aria-label="Import backup file"
            />
            {importError && <p className="security-backup-error" role="alert">{importError}</p>}
          </div>

          <div className="security-backup-block">
            <span className="security-backup-subtitle">App lock</span>
            {!pinIsSet && (
              <>
                {!showSetPin ? (
                  <button type="button" className="security-backup-btn" onClick={() => setShowSetPin(true)}>
                    Set PIN
                  </button>
                ) : (
                  <form onSubmit={handleSetPin} className="security-backup-pin-form">
                    <input
                      type="password"
                      inputMode="numeric"
                      placeholder="New PIN (4+ digits)"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      className="security-backup-pin-input"
                      autoComplete="off"
                    />
                    <div className="security-backup-pin-actions">
                      <button type="submit" className="security-backup-btn">Save PIN</button>
                      <button type="button" className="security-backup-btn" onClick={() => { setShowSetPin(false); setNewPinInput(''); setPinMessage(''); }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
            {pinIsSet && (
              <>
                <button type="button" className="security-backup-btn" onClick={onLock}>
                  Lock app
                </button>
                {!showChangePin ? (
                  <button type="button" className="security-backup-btn" onClick={() => setShowChangePin(true)}>
                    Change or remove PIN
                  </button>
                ) : (
                  <div className="security-backup-pin-form">
                    <input
                      type="password"
                      inputMode="numeric"
                      placeholder="Current PIN"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      className="security-backup-pin-input"
                      autoComplete="off"
                    />
                    <input
                      type="password"
                      inputMode="numeric"
                      placeholder="New PIN (to change)"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      className="security-backup-pin-input"
                      autoComplete="off"
                    />
                    <div className="security-backup-pin-actions">
                      <button type="button" className="security-backup-btn" onClick={handleChangePin}>
                        Change PIN
                      </button>
                      <button type="button" className="security-backup-btn security-backup-btn-danger" onClick={handleRemovePin}>
                        Remove PIN
                      </button>
                      <button type="button" className="security-backup-btn" onClick={() => { setShowChangePin(false); setPinInput(''); setNewPinInput(''); setPinMessage(''); }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {pinMessage && <p className="security-backup-msg">{pinMessage}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
