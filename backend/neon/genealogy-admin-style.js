export const genealogyStyles=`
.gen-shell{--gen:#086846;--gen-border:#dce9e1;--gen-muted:#4e685b;--gen-text:#14392a;display:grid;gap:16px;margin-top:19px}
.gen-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}
.gen-summary article{display:grid;gap:4px;padding:17px;background:#ffffff;border:1px solid var(--gen-border);border-radius:16px;min-width:0}
.gen-summary strong{font-size:1.65rem;font-weight:900;color:var(--gen-text)}
.gen-summary small{font-size:.72rem;color:var(--gen-muted)}
.gen-note{display:flex;align-items:flex-start;gap:11px;border:1px solid var(--gen-border);background:#f1f7f3;color:#294b3b;padding:13px 16px;border-radius:12px;font-size:.86rem;line-height:1.85}
.gen-section{padding:clamp(16px,3vw,24px);border-radius:18px;background:#ffffff;border:1px solid var(--gen-border);box-shadow:0 10px 30px #452a180d;min-width:0}
.gen-section-head{display:flex;align-items:center;gap:12px;justify-content:space-between;flex-wrap:wrap;margin-bottom:14px}
.gen-section-head h2{font-size:1.25rem;font-weight:900;color:var(--gen-text)}
.gen-section-head small{font-size:.78rem;color:var(--gen-muted)}
.gen-section-header{display:flex;align-items:center;gap:11px}
.gen-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.gen-form{display:grid;gap:12px}
.gen-form label{display:grid;gap:5px;font-weight:750;color:#294b3b;font-size:.81rem}
.gen-form input:not([type=checkbox]),.gen-form select,.gen-form textarea,.gen-search input{width:100%;min-width:0;min-height:43px;padding:9px 11px;border:1px solid #bdd1c5;border-radius:11px;background:#ffffff;color:#14392a;font:inherit;font-size:.88rem}
.gen-form input:focus,.gen-form select:focus,.gen-search input:focus{outline:2px solid #08754e;outline-offset:1px}
.gen-form textarea{min-height:90px}
.gen-form input[type=checkbox]{width:18px;height:18px;min-height:18px;accent-color:var(--gen)}
.gen-form .gen-check{display:flex;align-items:flex-start;gap:8px}
.gen-form small,.gen-muted{font-size:.77rem;color:var(--gen-muted);line-height:1.8}
.gen-form strong{font-size:.91rem}
.gen-submit{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;width:fit-content;padding:10px 19px;background:#086846;color:#fff;border:0;border-radius:10px;font:inherit;font-weight:850;cursor:pointer}
.gen-submit:hover{background:#054b34}
.gen-bundle{display:grid;gap:12px}
.gen-bundle>fieldset{border:1px solid #dce9e1;border-radius:14px;padding:15px;min-width:0}
.gen-bundle legend{padding:0 10px;font-weight:900;color:#075138}
.gen-relative{display:grid;gap:9px;grid-template-columns:repeat(2,minmax(0,1fr))}
.gen-relative .gen-wide{grid-column:1/-1}
.gen-details{border:1px solid #dce9e1;border-radius:12px;background:#f5faf7;padding:12px}
.gen-details>summary{cursor:pointer;font-weight:850;color:#075138;list-style:none}
.gen-details>summary::-webkit-details-marker{display:none}
.gen-details[open]>summary{margin-bottom:13px;padding-bottom:9px;border-bottom:1px solid #dce9e1}
.gen-details .gen-form{margin-top:11px}
.gen-identity-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.gen-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.gen-search{display:flex;align-items:end;flex-wrap:wrap;gap:9px;padding:12px;background:#f1f7f3;border-radius:12px;margin-bottom:15px}
.gen-search label{display:grid;gap:4px;flex:1 1 220px;min-width:0;color:#3c5c4d;font-size:.8rem}
.gen-search button,.gen-compact-button{padding:8px 15px;min-height:43px;border-radius:10px;border:1px solid #b9cfc2;background:#e7f4ec;color:#075138;font-weight:850}
.gen-table{width:100%;border-collapse:collapse;text-align:start;font-size:.81rem}
.gen-table th,.gen-table td{text-align:start;padding:12px 9px;border-bottom:1px solid #dce9e1;vertical-align:top}
.gen-table th{font-size:.74rem;color:#4e685b;background:#edf5ef;font-weight:900}
.gen-table tr:last-child td{border-bottom:0}
.gen-table td:first-child{font-weight:850;color:#14392a}
.gen-scroll{overflow-x:auto;max-width:100%}
.gen-pill{display:inline-flex;align-items:center;gap:5px;background:#e7f4ec;color:#075138;border-radius:99px;padding:3px 9px;font-weight:800;font-size:.72rem}
.gen-pill.private{background:#edf4e7;color:#49663e}
.gen-result{border-radius:12px;padding:12px 15px;background:#eaf5ea;color:#24653e;font-weight:850;font-size:.88rem;margin-block:10px}
.gen-action-group{display:flex;align-items:center;flex-wrap:wrap;gap:7px}
.gen-action-group details{min-width:150px}
.gen-list-card{padding:12px;border:1px solid #dce9e1;border-radius:12px}
.gen-links{display:flex;gap:9px;flex-wrap:wrap}
.gen-links a{color:#075138;font-size:.81rem;font-weight:850;text-decoration:underline}
.gen-small{font-size:.74rem;color:#4e685b}
.gen-step-notice{margin:5px 0 10px;background:#e7f4ec;color:#294b3b;border-radius:10px;padding:10px 12px;line-height:1.8;font-size:.8rem}
.gen-form select[name=father_id],.gen-form select[name=mother_id]{max-width:100%}

/* The single-person editor stays compact even with complete encrypted profile fields. */
.gen-editor{scroll-margin-top:18px;background:linear-gradient(180deg,#f7fbf8 0%,#ffffff 100%)}
.gen-editor-eyebrow{display:inline-block;letter-spacing:.06em;color:#075138;font-weight:900;font-size:.72rem;margin-bottom:5px}
.gen-editor-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(235px,280px);gap:18px;align-items:start}
.gen-editor-main{min-width:0}
.gen-editor-main>.gen-form{gap:15px}
.gen-editor-side{display:grid;gap:12px;position:sticky;top:15px;min-width:0}
.gen-side-panel{display:grid;gap:11px;padding:18px;background:linear-gradient(145deg,#073d2b,#096844);color:#fff;border-radius:16px;box-shadow:0 10px 22px #4b24181c}
.gen-side-panel h3{color:#fff;font-size:1rem}
.gen-side-panel .gen-muted{color:#e0f3e8}
.gen-side-panel .gen-pill{width:fit-content;background:#e0f3e8;color:#14392a}
.gen-edit-fieldset{border:1px solid #dce9e1;border-radius:15px;padding:clamp(14px,2.5vw,20px);background:#fff;min-width:0}
.gen-edit-fieldset>legend{font-size:1rem;font-weight:900;padding:0 11px;color:#075138}
.gen-edit-fieldset .gen-form-grid{margin-top:6px}
.gen-form-grid .gen-full{grid-column:1/-1;min-width:0}
.gen-edit-fieldset p{margin-block:10px 0}
.gen-edit-fieldset label{font-size:.84rem}
.gen-edit-fieldset input,.gen-edit-fieldset select,.gen-edit-fieldset textarea{transition:border-color .16s ease,box-shadow .16s ease}
.gen-edit-fieldset input:focus,.gen-edit-fieldset select:focus,.gen-edit-fieldset textarea:focus{box-shadow:0 0 0 3px #08754e22}
.gen-edit-fieldset textarea{width:100%;resize:vertical;line-height:1.8;min-height:85px}
.gen-edit-fieldset textarea[name=private_notes]{min-height:178px}
.gen-sensitive{padding:13px 15px;background:#f3f5ed;border:1px solid #dce7d5;border-radius:12px;color:#4a5d3d!important}
.gen-editor .gen-submit{min-width:210px;min-height:49px;background:linear-gradient(120deg,#054b34,#08754e);box-shadow:0 8px 16px #073d2526}
.gen-editor .gen-danger .gen-submit{background:#a63b32;box-shadow:none}
.gen-editor .gen-submit:hover{background:#05412c}
.gen-danger{border-color:#eac7bf;background:#fff7f5}
.gen-danger>summary{color:#b4493d}
.gen-danger .gen-submit{background:#a63b32}
.gen-section:focus-within{border-color:#b9cfc2}
.gen-search input{min-height:45px}
.gen-action-group a,.gen-compact-button{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;transition:transform .12s ease,background .12s ease}
.gen-action-group a:hover,.gen-compact-button:hover{background:#d8eee2;transform:translateY(-1px)}
@media(max-width:1050px){.gen-editor-layout{grid-template-columns:minmax(0,1fr)}.gen-editor-side{position:static;grid-template-columns:repeat(2,minmax(0,1fr))}.gen-side-panel{grid-column:1/-1}}
@media(max-width:620px){.gen-editor-side{grid-template-columns:1fr}.gen-editor .gen-submit{width:100%}.gen-edit-fieldset{padding:13px}.gen-editor-layout{gap:13px}}
.gen-create-extras[open]{border-color:#b9cfc2;background:#f7fbf8}
.gen-create-extras>.gen-form-grid{margin-top:12px}
.gen-create-extras .gen-form-grid .gen-full{grid-column:1/-1}
.gen-create-extras textarea{width:100%;resize:vertical}
.gen-editor .gen-edit-fieldset:nth-of-type(3){border-color:#d5dcba}
.gen-shell :is(a,button,summary,input,select,textarea):focus-visible{outline:3px solid #08754e;outline-offset:2px}

.gen-relation-panel{display:grid;gap:13px;padding:clamp(14px,2.5vw,21px);border:1px solid #dce9e1;border-radius:17px;background:linear-gradient(135deg,#f0f8f3,#ffffff);margin-bottom:16px}
.gen-relation-panel .gen-section-head{margin-bottom:3px}
.gen-relation-panel h3{color:#14392a;font-size:1.06rem;margin:0}
.gen-rel-tabs{display:grid;gap:10px;min-width:0}
.gen-rel-tabs>h3{font-size:.96rem;border-bottom:1px solid #dce9e1;padding-bottom:8px}
.gen-rel-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(min(100%,215px),1fr))}
.gen-rel-group{display:grid;align-content:start;gap:9px;min-width:0}
.gen-rel-group h4{color:#294b3b;font-size:.84rem;margin:0}
.gen-relation-person{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:9px;border:1px solid #dce9e1;border-radius:12px;background:#fff;padding:13px;min-width:0;box-shadow:0 5px 14px #65411d0b}
.gen-relation-person>div{display:grid;gap:3px;min-width:0;flex:1 1 170px}
.gen-relation-person strong{font-size:.87rem;color:#14392a;overflow-wrap:anywhere}
.gen-relation-person small{font-size:.74rem;color:#4e685b}
.gen-relation-person .gen-compact-button{min-height:36px;font-size:.73rem;padding:6px 10px}
.gen-rel-unknown{display:block;padding:13px;color:#4e685b;border:1px dashed #bdd1c5;border-radius:11px;background:#f7fbf8}
.gen-rel-ancestors{background:#edf5ef}
.gen-relation-add{border-color:#b9cfc2;background:#ffffff}
.gen-relation-add>summary{font-size:.9rem}
.gen-relation-add>.gen-form{margin-top:12px;gap:12px}
.gen-relation-add .gen-form-grid .gen-full{grid-column:1/-1}
.gen-relation-add .gen-form-grid label{min-width:0}
.gen-relation-add .gen-form-grid textarea{width:100%;resize:vertical}
.gen-relation-add .gen-form-grid .gen-check{font-size:.8rem;align-items:flex-start}
.gen-relation-add .gen-details{background:#f5faf7}
.gen-relation-add .gen-submit{width:100%;min-height:49px}
@media(max-width:620px){.gen-rel-grid{grid-template-columns:1fr}.gen-relation-panel{padding:12px}.gen-relation-person{align-items:flex-start}.gen-relation-person .gen-compact-button{width:100%}}
@media(max-width:1000px){.gen-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:620px){
 .gen-grid,.gen-form-grid,.gen-relative,.gen-identity-row{grid-template-columns:1fr}
 .gen-summary article{padding:13px}.gen-summary strong{font-size:1.4rem}
 .gen-section{padding:15px}
 .gen-relative .gen-wide{grid-column:1}
 .gen-action-group details{min-width:130px}
}

.gen-pagination{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:14px;color:var(--gen-muted)}
.gen-services,.gen-pagination{max-width:none;margin-inline:0;padding:0}
.gen-services{display:flex;flex-wrap:wrap;gap:8px}
.gen-shell :is(.gen-services,.gen-pagination) .gen-compact-button{color:#075138}
.gen-shell .gen-services .gen-submit{color:#fff;text-decoration:none;padding-inline:19px;background:var(--gen)}
.gen-shell .gen-services .gen-submit:hover{background:#054b34}
.gen-services .gen-compact-button{min-height:46px}
.gen-section[id]{scroll-margin-top:6rem}
.gen-scroll{border:1px solid var(--gen-border);border-radius:12px}
.gen-table tbody tr:nth-child(even){background:#f8fbf9}
.gen-table th,.gen-table td{padding-inline:13px}
.gen-table .gen-action-group a{font-size:.79rem}
.gen-note strong{flex-shrink:0}
@media(max-width:620px){
 .gen-services>a{flex:1 1 auto}
 .gen-note{display:block}
}
@media(prefers-reduced-motion:reduce){
 .gen-shell :is(a,input,select,textarea){transition:none}
 .gen-compact-button:hover{transform:none}
}

.gen-shell{gap:18px}
.gen-shell .gen-services{display:flex;flex-wrap:wrap;justify-content:flex-start;background:#fff;
 border:1px solid var(--gen-border);border-radius:14px;padding:7px;gap:4px}
.gen-shell .gen-services a{display:flex;min-height:44px;align-items:center;justify-content:center;
 padding:7px 12px;color:#385748;font-weight:750;border-radius:8px;text-decoration:none}
.gen-shell .gen-services a[aria-current=page]{background:#e2f2e8;color:#075138;box-shadow:inset 0 -2px #168352}
.gen-shell .gen-services a:hover{background:#edf6f0;color:#075138}
.gen-summary article{border-inline-start:3px solid #80baa0}
.gen-section h2{color:var(--gen-text)}
.gen-section .gen-submit{text-decoration:none}
.gen-section>.gen-muted{margin:5px 0 14px}
.gen-editor-main{display:grid;gap:16px}
.gen-edit-fieldset>summary{cursor:pointer;font-weight:850;color:#075138;min-height:26px}
.gen-edit-fieldset[open]>summary{padding-bottom:10px;border-block-end:1px solid var(--gen-border);margin-bottom:12px}
.gen-relation-fold[open] .gen-relation-panel{margin:0;border:0;padding:6px 0;background:transparent}
.gen-table tbody tr:hover{background:#edf7f1}
.gen-search{margin-top:10px}
.gen-gaps{margin:0 0 12px;gap:14px}
@media(max-width:620px){
 .gen-shell .gen-services{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
 .gen-shell .gen-services a{padding-inline:5px;font-size:.87rem}
}
`;
