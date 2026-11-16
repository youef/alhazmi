export const genealogyStyles=`
.gen-shell{--gen:#a55838;--gen-border:#e9ddd0;--gen-muted:#806c5e;--gen-text:#3c2a1f;display:grid;gap:16px;margin-top:19px}
.gen-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}
.gen-summary article{display:flex;align-items:center;gap:12px;padding:17px;background:#fffdfa;border:1px solid var(--gen-border);border-radius:16px;min-width:0}
.gen-summary .gen-count{display:grid;place-items:center;background:#f6e5d4;border-radius:12px;color:var(--gen);font-size:1.4rem;font-weight:900;width:51px;height:51px;flex:0 0 51px}
.gen-summary article div:last-child{display:grid;gap:3px;min-width:0}
.gen-summary strong{font-size:1.2rem;font-weight:900;color:var(--gen-text)}
.gen-summary small{font-size:.72rem;color:var(--gen-muted)}
.gen-note{display:flex;align-items:flex-start;gap:11px;border:1px solid #dec5a1;background:#fff7e9;color:#74552b;padding:13px 16px;border-radius:12px;font-size:.86rem;line-height:1.85}
.gen-section{padding:clamp(16px,3vw,24px);border-radius:18px;background:#fffdfa;border:1px solid var(--gen-border);box-shadow:0 10px 30px #452a180d;min-width:0}
.gen-section-head{display:flex;align-items:center;gap:12px;justify-content:space-between;flex-wrap:wrap;margin-bottom:14px}
.gen-section-head h2{font-size:1.25rem;font-weight:900;color:var(--gen-text)}
.gen-section-head small{font-size:.78rem;color:var(--gen-muted)}
.gen-section-header{display:flex;align-items:center;gap:11px}
.gen-section-icon{display:grid;place-items:center;width:43px;height:43px;background:#f5e3d3;color:var(--gen);border-radius:11px;font-size:1.4rem}
.gen-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.gen-form{display:grid;gap:12px}
.gen-form label{display:grid;gap:5px;font-weight:750;color:#5b4736;font-size:.81rem}
.gen-form input:not([type=checkbox]),.gen-form select,.gen-form textarea,.gen-search input{width:100%;min-width:0;min-height:43px;padding:9px 11px;border:1px solid #dfd0bf;border-radius:11px;background:#fffefa;color:#3a2b1f;font:inherit;font-size:.88rem}
.gen-form input:focus,.gen-form select:focus,.gen-search input:focus{outline:2px solid #bd8453;outline-offset:1px}
.gen-form textarea{min-height:90px}
.gen-form input[type=checkbox]{width:18px;height:18px;min-height:18px;accent-color:var(--gen)}
.gen-form .gen-check{display:flex;align-items:flex-start;gap:8px}
.gen-form small,.gen-muted{font-size:.77rem;color:var(--gen-muted);line-height:1.8}
.gen-form strong{font-size:.91rem}
.gen-submit{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;width:fit-content;padding:10px 19px;background:#a55838;color:#fff;border:0;border-radius:10px;font:inherit;font-weight:850;cursor:pointer}
.gen-submit:hover{background:#854028}
.gen-bundle{display:grid;gap:12px}
.gen-bundle>fieldset{border:1px solid #e6d5c3;border-radius:14px;padding:15px;min-width:0}
.gen-bundle legend{padding:0 10px;font-weight:900;color:#925632}
.gen-relative{display:grid;gap:9px;grid-template-columns:repeat(2,minmax(0,1fr))}
.gen-relative .gen-wide{grid-column:1/-1}
.gen-details{border:1px solid #e7d7c5;border-radius:12px;background:#fcf6ed;padding:12px}
.gen-details>summary{cursor:pointer;font-weight:850;color:#8b4f32;list-style:none}
.gen-details>summary::-webkit-details-marker{display:none}
.gen-details[open]>summary{margin-bottom:13px;padding-bottom:9px;border-bottom:1px solid #e4d4c3}
.gen-details .gen-form{margin-top:11px}
.gen-identity-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.gen-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.gen-search{display:flex;align-items:end;flex-wrap:wrap;gap:9px;padding:12px;background:#f8f2eb;border-radius:12px;margin-bottom:15px}
.gen-search label{display:grid;gap:4px;flex:1;min-width:200px;color:#775f4f;font-size:.8rem}
.gen-search button,.gen-compact-button{padding:8px 15px;min-height:43px;border-radius:10px;border:1px solid #d3b192;background:#f4e6d6;color:#8b492c;font-weight:850}
.gen-table{width:100%;border-collapse:collapse;text-align:start;font-size:.81rem}
.gen-table th,.gen-table td{text-align:start;padding:12px 9px;border-bottom:1px solid #eaded1;vertical-align:top}
.gen-table th{font-size:.74rem;color:#7a6656;background:#faf4ed;font-weight:900}
.gen-table tr:last-child td{border-bottom:0}
.gen-table td:first-child{font-weight:850;color:#3e2d24}
.gen-scroll{overflow-x:auto;max-width:100%}
.gen-pill{display:inline-flex;align-items:center;gap:5px;background:#f3e7d9;color:#8a502d;border-radius:99px;padding:3px 9px;font-weight:800;font-size:.72rem}
.gen-pill.private{background:#edf4e7;color:#49663e}
.gen-result{border-radius:12px;padding:12px 15px;background:#eaf5ea;color:#24653e;font-weight:850;font-size:.88rem;margin-block:10px}
.gen-action-group{display:flex;align-items:center;flex-wrap:wrap;gap:7px}
.gen-action-group details{min-width:150px}
.gen-list-card{padding:12px;border:1px solid #e7d8cb;border-radius:12px}
.gen-links{display:flex;gap:9px;flex-wrap:wrap}
.gen-links a{color:#9a5733;font-size:.81rem;font-weight:850;text-decoration:underline}
.gen-small{font-size:.74rem;color:#887462}
.gen-step-notice{margin:5px 0 10px;background:#f4e9d9;color:#79512e;border-radius:10px;padding:10px 12px;line-height:1.8;font-size:.8rem}
.gen-form select[name=father_id],.gen-form select[name=mother_id]{max-width:100%}
@media(max-width:1000px){.gen-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:620px){
 .gen-grid,.gen-form-grid,.gen-relative,.gen-identity-row{grid-template-columns:1fr}
 .gen-summary article{padding:11px}.gen-summary .gen-count{flex-basis:42px;width:42px;height:42px;font-size:1.2rem}
 .gen-section{padding:15px}
 .gen-relative .gen-wide{grid-column:1}
 .gen-action-group details{min-width:130px}
}
`;
