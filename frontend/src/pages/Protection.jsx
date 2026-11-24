import React, { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Camera } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useData } from '../lib/useData.js';
import { apiPost } from '../lib/api.js';
import { SourceBadge } from '../components/SourceBadge.jsx';
import { Card, DataState, PageHead } from '../components/StateViews.jsx';
import ListenButton from '../components/ListenButton.jsx';

const SYMPTOM_HINTS = {
  'fall-armyworm': ['whorl', 'window pane', 'sawdust', 'frass', 'ragged', 'caterpillar', 'armyworm', 'hole'],
  'pink-bollworm': ['boll', 'rosette', 'lint', 'pink', 'exit hole', 'cotton'],
  'brown-planthopper': ['hopper', 'sooty', 'honeydew', 'burn', 'drying patch', 'base of'],
  'rice-stem-borer': ['dead heart', 'white ear', 'stem borer', 'hollow stem', 'exit hole'],
  aphids: ['aphid', 'curled', 'sticky', 'ants', 'cluster', 'shoot', 'honeydew'],
  whitefly: ['whitefly', 'white fly', 'white insect', 'mosaic', 'yellowing'],
  'fruit-fly': ['fruit drop', 'puncture', 'sunken', 'maggot', 'rot', 'rotting'],
  'red-spider-mite': ['webbing', 'mite', 'bronze', 'speckling', 'red dust', 'underside']
};

function fileToDataUrl(file, max = 768) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read-failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode-failed'));
      img.onload = () => {
        try {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } catch (err) {
          reject(err);
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function suggestPests(list, desc, crop) {
  const text = desc.toLowerCase();
  const words = new Set(
    text
      .split(/[^a-z\u0900-\u097f\u0b80-\u0bff\u0c00-\u0c7f\u0980-\u09ff\u0a80-\u0aff]+/)
      .filter((w) => w.length >= 4)
  );
  const scored = list.map((p) => {
    let score = 0;
    const hay = `${p.name} ${p.symptoms}`.toLowerCase();
    for (const w of words) {
      const stem = w.length > 6 ? w.slice(0, w.length - 2) : w;
      if (hay.includes(stem)) score += 2;
    }
    for (const hint of SYMPTOM_HINTS[p.id] || []) {
      if (text.includes(hint)) score += 3;
    }
    if (crop && crop !== 'all' && p.crops && p.crops.includes(crop)) score += 4;
    return { pest: p, score };
  });
  return scored
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.pest);
}

export default function Protection() {
  const { t, lang } = useApp();
  const [pestId, setPestId] = useState(null);
  const [aiCrop, setAiCrop] = useState('all');
  const [imgSrc, setImgSrc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [fallback, setFallback] = useState(false);
  const [desc, setDesc] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const fileRef = useRef(null);

  const pestsQ = useData('/pests?lang=en');
  const pestList = pestsQ.data ? pestsQ.data.pests : [];

  const cropOptions = useMemo(() => {
    const set = new Set();
    for (const p of pestList) for (const c of p.crops || []) set.add(c);
    return Array.from(set).sort();
  }, [pestList]);

  const pQuery = pestId ? `/pesticides?pestId=${pestId}&lang=en` : '/pesticides';
  const pQ = useData(pQuery, [pestId]);

  const selectedPest = pestList.find((p) => p.id === pestId);

  const matchedPest = aiResult
    ? pestList.find((p) => {
        const tighter = (p.name || '').toLowerCase();
        const lower = (aiResult.pest || '').toLowerCase();
        if (!lower || lower === 'uncertain') return false;
        return lower.includes(tighter.split(' ')[0]) || tighter.split(/[^a-z]+/).some((tok) => tok.length > 4 && lower.includes(tok));
      })
    : null;

  const prose = selectedPest
    ? `${selectedPest.name}: ${selectedPest.symptoms} ${t('protection.disclaimer')}`
    : `${t('protection.subtitle')}. ${t('protection.disclaimer')}`;

  async function onPickFile(e) {
    setAiError(null);
    setAiResult(null);
    setSuggestions(null);
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setImgSrc(dataUrl);
    } catch {
      setAiError(t('ai.errImage'));
    }
    e.target.value = '';
  }

  async function analyze() {
    if (!imgSrc || busy) return;
    setBusy(true);
    setAiError(null);
    setAiResult(null);
    try {
      const res = await apiPost('/ai/pest-identify', { image: imgSrc, crop: aiCrop, lang });
      if (res && res.pest) {
        setAiResult(res);
        setFallback(false);
      } else {
        setAiError(t('ai.errImage'));
      }
    } catch {
      setFallback(true);
      setSuggestions(suggestPests(pestList, '', aiCrop));
    } finally {
      setBusy(false);
    }
  }

  function runChecklist() {
    setSuggestions(suggestPests(pestList, desc, aiCrop));
    setFallback(true);
  }

  function showGuide(p) {
    setPestId(p.id);
    const el = document.getElementById('protection-products');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="page">
      <PageHead
        kicker={t('group.advise')}
        title={t('protection.title')}
        subtitle={t('protection.subtitle')}
        right={<ListenButton text={prose} />}
      />

      <div className="disclaimer" role="note">
        <AlertTriangle size={18} aria-hidden="true" style={{ flex: 'none', color: 'var(--warn-text)' }} />
        <span>{t('protection.disclaimer')}</span>
      </div>

      <DataState loading={pestsQ.loading} error={pestsQ.error}>
        <Card kicker="AI" title={t('ai.title')} className="mt-6" right={<ListenButton text={`${t('ai.desc')}. ${t('protection.disclaimer')}`} />}>
          <p className="small">{t('ai.desc')}</p>
          <div className="form-grid cols-2 mt-4">
            <label className="field">
              <span className="small">{t('ai.crop')}</span>
              <select value={aiCrop} onChange={(e) => setAiCrop(e.target.value)} aria-label={t('ai.crop')}>
                <option value="all">{t('common.all')}</option>
                {cropOptions.map((c) => (
                  <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>
                ))}
              </select>
            </label>
            <div className="field">
              <span className="small">{imgSrc ? t('ai.retake') : t('ai.choosePhoto')}</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPickFile}
                style={{ display: 'none' }}
              />
              <div className="ai-actions">
                <button className="btn small" type="button" onClick={() => fileRef.current && fileRef.current.click()}>
                  <Camera size={14} aria-hidden="true" style={{ flex: 'none' }} /> {t('ai.choosePhoto')}
                </button>
                {imgSrc && (
                  <button className="btn ghost small" type="button" onClick={() => { setImgSrc(null); setAiResult(null); setFallback(false); setSuggestions(null); }}>
                    {t('ai.retake')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {imgSrc && (
            <div className="ai-preview mt-4">
              <img src={imgSrc} alt={t('ai.aiSymptoms')} />
            </div>
          )}

          {imgSrc && (
            <div className="mt-4">
              <button className="btn" type="button" disabled={busy} onClick={analyze}>
                {busy ? t('ai.analyzing') : t('ai.analyze')}
              </button>
            </div>
          )}

          {aiError && <p className="form-err small mt-4">{aiError}</p>}

          {aiResult && (
            <div className="ai-result mt-6">
              <div className="ai-result-head">
                <h3>{aiResult.pest}</h3>
                <span className={`sev ${aiResult.severity}`}>{aiResult.severity}</span>
              </div>
              {typeof aiResult.confidence === 'number' && (
                <p className="small mono mt-2">{t('ai.confidence')}: {Math.round(aiResult.confidence * 100)}%</p>
              )}
              {aiResult.symptoms && <p className="small mt-2"><strong>{t('ai.aiSymptoms')}: </strong>{aiResult.symptoms}</p>}
              {aiResult.action && <p className="small mt-2"><strong>{t('ai.action')}: </strong>{aiResult.action}</p>}
              {matchedPest ? (
                <button className="btn small mt-4" type="button" onClick={() => showGuide(matchedPest)}>
                  {t('ai.showGuide')} — {matchedPest.name}
                </button>
              ) : (
                <p className="small mt-4">{t('protection.disclaimer')}</p>
              )}
            </div>
          )}

          <div className="mt-6" />
          <h3 className="small mono">{t('ai.checklistTitle')}</h3>
          <p className="small">
            <label className="field mt-2" style={{ display: 'block' }}>
              <span className="small">{t('ai.describe')}</span>
              <textarea
                rows={2}
                value={desc}
                placeholder={t('ai.describeNote')}
                onChange={(e) => setDesc(e.target.value)}
                aria-label={t('ai.describe')}
                style={{ width: '100%' }}
              />
            </label>
          </p>
          <button className="btn small" type="button" onClick={runChecklist} disabled={!desc.trim()}>
            {t('ai.suggest')}
          </button>
          {fallback && <p className="small mt-2" style={{ color: 'var(--ink-2)' }}>{t('ai.matchNote')}</p>}
          {suggestions && suggestions.length > 0 && (
            <div className="mt-4">
              <p className="small mono">{t('ai.suggestions')}</p>
              <div className="grid cols-3 mt-2">
                {suggestions.map((p) => (
                  <div className="ai-suggestion" key={p.id}>
                    <span className={`sev ${p.severity}`}>{p.severity}</span>
                    <strong className="small">{p.name}</strong>
                    <p className="small">{p.symptoms}</p>
                    <button className="btn small" type="button" onClick={() => showGuide(p)}>
                      {t('ai.showGuide')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {suggestions && suggestions.length === 0 && (
            <p className="small mt-2">{t('ai.noMatch')}</p>
          )}
        </Card>
      </DataState>

      <DataState loading={pestsQ.loading} error={pestsQ.error}>
        <div className="grid cols-3 mt-6">
          {pestList.map((p) => (
            <Card
              key={p.id}
              title={p.name}
              right={<span className={`sev ${p.severity}`}>{p.severity}</span>}
              className={pestId === p.id ? 'active-card' : ''}
            >
              <p className="small">{p.symptoms}</p>
              <p className="small mt-2">
                <strong>{t('protection.affected')}: </strong>
                {p.crops.join(', ')}
              </p>
              <p className="small mono">{p.stage}</p>
              <button
                className="btn small mt-4"
                aria-pressed={pestId === p.id}
                onClick={() => setPestId(pestId === p.id ? null : p.id)}
              >
                {pestId === p.id ? t('common.filter') : t('protection.subtitle')}
              </button>
            </Card>
          ))}
        </div>
      </DataState>

      <div className="mt-6" id="protection-products" />

      <DataState loading={pQ.loading} error={pQ.error}>
        {pQ.data && (
          <Card
            title={selectedPest ? `${selectedPest.name} — ${t('protection.dosage')}` : t('protection.title')}
            right={<SourceBadge source={pQ.data.source} />}
          >
            <div className="table-scroll">
              <table className="data">
                <thead>
                  <tr>
                    <th>{t('nav.protection')}</th>
                    <th>Formula</th>
                    <th>{t('protection.dosage')}</th>
                    <th>{t('protection.phi')}</th>
                    <th>{t('protection.toxicity')}</th>
                    <th>{t('protection.safety')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pQ.data.pesticides.map((p) => (
                    <tr key={p.id}>
                      <td>{p.product}<div className="small">{p.formulation}</div></td>
                      <td className="mono">{p.formula}</td>
                      <td className="mono">{p.dosePerAcre}</td>
                      <td className="mono">{p.phi} d</td>
                      <td className="small">{p.toxicityClass}</td>
                      <td className="small" style={{ maxWidth: 320 }}>{p.safety}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </DataState>
    </div>
  );
}
