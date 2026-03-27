// ==UserScript==
// @name         Walgreens RxSense - Compare GoodRx
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a floating GoodRx redirect button on Walgreens RxSense drug pages, with form, dosage & quantity tracking
// @author       GiveUs20Minutes
// @homepageURL  https://github.com/herebran/wag-rxsense-compare-goodrx
// @supportURL   https://github.com/herebran/wag-rxsense-compare-goodrx/issues
// @updateURL    https://raw.githubusercontent.com/herebran/wag-rxsense-compare-goodrx/main/Walgreens_RxSense_Compare_GoodRx.user.js
// @downloadURL  https://raw.githubusercontent.com/herebran/wag-rxsense-compare-goodrx/main/Walgreens_RxSense_Compare_GoodRx.user.js
// @match        https://walgreens.rxsense.com/*
// @grant        GM_addStyle
// @run-at       document-body
// ==/UserScript==

(function () {
  'use strict';

  // ─── Drug slug overrides: RxSense URL slug → GoodRx slug ──────────────────
  const DRUG_SLUG_MAP = {
    'pseudoeph-bromphen-dm': 'brompheniramine-dextromethorphan-pseudoephedrine',
    'insulin-glargine-yfgn': 'insulin-glargine',
  };

  // ─── Form name mapping: RxSense value → GoodRx URL value ──────────────────
  const FORM_MAP = {
    'bottle':                    'bottle-of-oral-suspension',
    'bottle of spray':           'bottle-of-spray',
    'ml of oral solution':       'oral-solution',
    'solution':                  'solution',
    'solution (quantity in ml)': 'solution',
    'suspension':                'suspension',
    'syrup':                     'syrup',
    'tablet':                    'tablet',
    'capsule':                   'capsule',
    'cup':                       'cup',
    'cream':                     'cream',
    'ointment':                  'ointment',
    'gel':                       'gel',
    'patch':                     'patch',
    'pen':                       'pen',
    'injection':                 'injection',
    'inhaler':                   'inhaler',
    'powder':                    'powder',
    'drops':                     'drops',
    'spray':                     'spray',
    'lozenge':                   'lozenge',
    'suppository':               'suppository',
    'foam':                      'foam',
    'kit':                       'kit',
    'liquid':                    'liquid',
  };

  // ──────────────────────────────────────────────────────────────────────────

  function getDrugSlug() {
    const match = window.location.pathname.match(/^\/drug\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  // Returns the raw selected name from the Drug Name dropdown e.g. "Lipitor", "Wegovy"
  function getRawDrugName() {
    const el = document.querySelector(
      '[role="combobox"][aria-label="Select Drug Name"], [role="combobox"][id="Drug Name"], [role="combobox"][aria-labelledby="Drug Name"]'
    );
    if (!el) return null;
    const active = el.querySelector('[role="option"].Prescription_active__omQHj');
    return active ? (active.getAttribute('data-value') || '').trim() : null;
  }

  // Drug name dropdown is primary source; URL slug + override map is fallback
  function getDrugSlugForGoodRx() {
    const rawName = getRawDrugName();
    if (rawName) {
      const slug = rawName.trim().toLowerCase().replace(/\s+/g, '-');
      return DRUG_SLUG_MAP[slug] || DRUG_SLUG_MAP[rawName.toLowerCase()] || slug;
    }
    const urlSlug = getDrugSlug();
    if (!urlSlug) return null;
    return DRUG_SLUG_MAP[urlSlug.toLowerCase()] || urlSlug;
  }

  // Find the active data-value from a combobox by label text
  function getSelectedValue(labelText) {
    let el = document.querySelector(`[role="combobox"][aria-label="Select ${labelText}"]`);
    if (!el) el = document.querySelector(`[role="combobox"][aria-labelledby="${labelText}"]`);
    if (!el) el = document.querySelector(`[role="combobox"][id="${labelText}"]`);
    if (!el) {
      const listbox = document.querySelector(`[role="listbox"][aria-labelledby="${labelText}"]`);
      if (listbox) el = listbox.closest('[role="combobox"]') || listbox.parentElement;
    }
    if (!el) return null;
    const active = el.querySelector('[role="option"].Prescription_active__omQHj');
    return active ? (active.getAttribute('data-value') || null) : null;
  }

  function normalizeForm(raw) {
    if (!raw) return null;
    const key = raw.toLowerCase().trim();
    return FORM_MAP[key] || key;
  }

  // Extract implied form from dosage string when Form dropdown is absent
  function extractImpliedForm(raw) {
    if (!raw) return null;
    const lower = raw.toLowerCase();
    if (/inhaler/.test(lower))    return 'inhaler';
    if (/patch/.test(lower))      return 'patch';
    if (/cream/.test(lower))      return 'cream';
    if (/ointment/.test(lower))   return 'ointment';
    if (/gel/.test(lower))        return 'gel';
    if (/solution/.test(lower))   return 'solution';
    if (/suspension/.test(lower)) return 'suspension';
    if (/injection/.test(lower))  return 'injection';
    if (/spray/.test(lower))      return 'spray';
    return null;
  }

  function normalizeDosage(raw) {
    if (!raw) return null;

    // Strip leading "N dose <form>, " e.g. "60 dose inhaler, "
    let d = raw.replace(/^\d+\s+dose\s+\w+,\s*/i, '');

    // Suspension bottle: "400mg/5ml, 75ml bottle" → "75ml-of-400mg-5ml"
    const bottleMatch = d.match(/^(\d+\.?\d*)(mg|g)\/(\d+\.?\d*)(ml),\s*(\d+\.?\d*)(ml)\s+bottle$/i);
    if (bottleMatch) {
      const [, dose, doseUnit, per, perUnit, size, sizeUnit] = bottleMatch;
      return `${size}${sizeUnit}-of-${dose}${doseUnit}-${per}${perUnit}`;
    }

    // Drop trailing "/act" or "/actuation"
    d = d.replace(/\/act(uation)?$/i, '');

    // Dual-component shared unit: "100-50mcg" → "100mcg-50mcg"
    d = d.replace(/^(\d+\.?\d*)-(\d+\.?\d*)(mcg|mg|ml|g)$/i, '$1$3-$2$3');

    // Slash-separated: "6.25-15mg/5ml" → "6.25mg-15mg-5ml"
    d = d.replace(/\//g, '-');
    d = d.replace(/^(\d+\.?\d*)-(\d+\.?\d*)(mg.*)$/i, '$1mg-$2$3');

    return d.trim();
  }

  // Replace spaces with hyphens to avoid + encoding in URLs
  function sanitizeParam(val) {
    if (!val) return val;
    return val.trim().replace(/\s+/g, '-');
  }

  function buildGoodRxUrl(drugSlug, form, dosage, quantity, labelOverride) {
    let url = `https://www.goodrx.com/${drugSlug}`;
    const parts = [];
    if (form)          parts.push(`form=${sanitizeParam(form)}`);
    if (dosage)        parts.push(`dosage=${sanitizeParam(dosage)}`);
    if (quantity)      parts.push(`quantity=${sanitizeParam(quantity)}`);
    if (labelOverride) parts.push(`label_override=${sanitizeParam(labelOverride)}`);
    if (parts.length)  url += '?' + parts.join('&');
    return url;
  }

  function updateButtonHref() {
    const btn = document.getElementById('goodrx-floating-btn');
    if (!btn) return;
    const drugSlug = getDrugSlugForGoodRx();
    if (!drugSlug) return;

    const rawForm   = getSelectedValue('Form');
    const rawDosage = getSelectedValue('Dosage');
    let quantity    = getSelectedValue('Quantity');
    let form        = normalizeForm(rawForm) || extractImpliedForm(rawDosage);
    let dosage      = normalizeDosage(rawDosage);

    // Bottle suspension override
    if (rawDosage && /\d+ml\s+bottle/i.test(rawDosage)) {
      form = 'bottle-of-oral-suspension';
    }

    // Prefilled pen special case:
    // RxSense: "0.5ml prefilled 0.25mg/0.5ml pen", qty=4
    // GoodRx:  dosage="4-prefilled-pens-of-0.25mg-0.5ml", qty=1, form=carton
    if (rawDosage) {
      const penMatch = rawDosage.match(/^(\d+\.?\d*)ml\s+prefilled\s+(\d+\.?\d*)(mg|mcg)\/(\d+\.?\d*)(ml)\s+pen$/i);
      if (penMatch) {
        const [, , dose, doseUnit, vol, volUnit] = penMatch;
        const penCount = quantity || '1';
        dosage   = `${penCount}-prefilled-pens-of-${dose}${doseUnit}-${vol}${volUnit}`;
        quantity = '1';
        form     = 'carton';
      }
    }

    // label_override ensures GoodRx shows the selected brand/generic, not a substitute
    const rawDrugName   = getRawDrugName();
    const labelOverride = rawDrugName
      ? rawDrugName.toLowerCase().replace(/\s+/g, '-')
      : drugSlug;

    const url = buildGoodRxUrl(drugSlug, form, dosage, quantity, labelOverride);
    btn.href = url;
  }

  GM_addStyle(`
    @font-face {
      font-family: 'InterSemiBold';
      src: url('https://walgreens.rxsense.com/fonts/Inter-SemiBold.woff') format('woff');
      font-weight: 600;
      font-style: normal;
    }
    #goodrx-floating-btn {
      position: fixed !important;
      bottom: 28px !important;
      right: 28px !important;
      z-index: 2147483647 !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 10px !important;
      padding: 16px 28px !important;
      background-color: #FCDB00 !important;
      color: #000000 !important;
      font-family: 'InterSemiBold', Arial, sans-serif !important;
      font-size: 16px !important;
      font-weight: 600 !important;
      text-decoration: none !important;
      border-radius: 50px !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25) !important;
      cursor: pointer !important;
      border: none !important;
      letter-spacing: 0.01em !important;
      white-space: nowrap !important;
      line-height: 1 !important;
      transition: background-color 0.15s, transform 0.15s, box-shadow 0.15s !important;
    }
    #goodrx-floating-btn:hover {
      background-color: #e8c800 !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3) !important;
    }
    #goodrx-floating-btn:active {
      transform: scale(0.97) !important;
    }
  `);

  function injectButton() {
    if (document.getElementById('goodrx-floating-btn')) {
      updateButtonHref();
      return;
    }
    if (!getDrugSlug()) return; // only inject on /drug/* pages

    const btn = document.createElement('a');
    btn.id = 'goodrx-floating-btn';
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
      Compare on GoodRx
    `;

    document.body.appendChild(btn);
    updateButtonHref();

    new MutationObserver(() => updateButtonHref()).observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-selected', 'data-value'],
    });
  }

  injectButton();
  document.addEventListener('DOMContentLoaded', injectButton);
  window.addEventListener('load', injectButton);
  setTimeout(injectButton, 500);
  
  const _pushState = history.pushState.bind(history);
  history.pushState = function (...args) {
    _pushState(...args);
    const old = document.getElementById('goodrx-floating-btn');
    if (old) old.remove();
    setTimeout(injectButton, 500);
  };
  window.addEventListener('popstate', () => {
    const old = document.getElementById('goodrx-floating-btn');
    if (old) old.remove();
    setTimeout(injectButton, 500);
  });

})();