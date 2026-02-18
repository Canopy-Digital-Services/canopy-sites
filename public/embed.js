"use strict";(()=>{var x={fontSize:14,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:8,density:"normal",buttonWidth:"full",buttonAlign:"left",bodyFont:void 0,headingFont:void 0,fontUrl:void 0,fontFamily:void 0,buttonText:void 0},T=new Set;function v(r,t){if(!r)return t;let n=r.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:t:t}function $(r,t){return{...x,...r!=null?r:{},...t!=null?t:{}}}function z(r){let t=/^#?([0-9a-f]{6})$/i.exec(r.trim());if(!t)return null;let n=parseInt(t[1],16);return[n>>16&255,n>>8&255,n&255]}function H(r,t,n){let[e,i,a]=[r,t,n].map(c=>{let h=c/255;return h<=.03928?h/12.92:Math.pow((h+.055)/1.055,2.4)});return .2126*e+.7152*i+.0722*a}function R(r){try{let t=z(r);return t&&H(...t)>.179?"#18181b":"#ffffff"}catch(t){return"#ffffff"}}function S(r,t){var a,c;let n=L(t.bodyFont,t.fontFamily);r.style.setProperty("--canopy-font",n);let e=L(t.headingFont);r.style.setProperty("--canopy-heading-font",e==="inherit"?"var(--canopy-font)":e),r.style.setProperty("--canopy-font-size",`${(a=t.fontSize)!=null?a:x.fontSize}px`),r.style.setProperty("--canopy-text",v(t.text,x.text)),r.style.setProperty("--canopy-bg",v(t.background,x.background)),r.style.setProperty("--canopy-field-bg",v(t.fieldBackground,x.fieldBackground));let i=v(t.primary,x.primary);r.style.setProperty("--canopy-primary",i),r.style.setProperty("--canopy-button-text",R(i)),r.style.setProperty("--canopy-border",v(t.border,x.border)),r.style.setProperty("--canopy-radius",`${(c=t.radius)!=null?c:x.radius}px`),r.style.setProperty("--canopy-button-width",t.buttonWidth==="auto"?"auto":"100%"),r.style.setProperty("--canopy-button-align",t.buttonAlign||x.buttonAlign)}function A(r){switch(r.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function L(r,t){return r&&r!=="inherit"?`'${r}', sans-serif`:t&&t!=="inherit"?t:"inherit"}function k(r){let t=r.filter(a=>!!a&&a!=="inherit"&&!T.has(a));if(t.length===0)return;let e=`https://fonts.googleapis.com/css2?${t.map(a=>`family=${encodeURIComponent(a)}:wght@400;500;600;700`).join("&")}&display=swap`,i=document.createElement("link");i.rel="stylesheet",i.href=e,i.dataset.canopyFont="true",document.head.appendChild(i),t.forEach(a=>T.add(a))}function D(r){if(!r||T.has(r))return;let t=document.createElement("link");t.rel="stylesheet",t.href=r,t.dataset.canopyFont="true",document.head.appendChild(t),T.add(r)}var V={TEXT:200,EMAIL:254,TEXTAREA:2e3};function C(r){var t;return(t=r.validation)!=null&&t.maxLength?r.validation.maxLength:V[r.type]}function P(r){return r.label||r.name}function N(r,t){let n={};return r.forEach(e=>{var o,u,g,f,y,p;let i=t[e.name],a=P(e);if(e.required){if(e.type==="CHECKBOX"){if(!i){n[e.name]=`${a} is required.`;return}}else if(e.type!=="NAME"){if(i==null||String(i).trim()===""){n[e.name]=`${a} is required.`;return}}}if(e.type!=="NAME"){if(i==null||String(i).trim()==="")return}if(e.type==="EMAIL"){let s=String(i);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(s)){n[e.name]="Enter a valid email address";return}let d=(o=e.validation)==null?void 0:o.domainRules;if(d){let m=(u=s.split("@")[1])==null?void 0:u.toLowerCase();if(d.allow&&d.allow.length>0&&!d.allow.map(E=>E.toLowerCase()).includes(m)){n[e.name]=`${a} must be from an allowed domain.`;return}if(d.block&&d.block.length>0&&d.block.map(E=>E.toLowerCase()).includes(m)){n[e.name]=`${a} domain is not allowed.`;return}}}if(e.type==="PHONE"){let s=String(i),l=((g=e.validation)==null?void 0:g.format)||"lenient";if(l==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(s)){n[e.name]=`${a} must be a valid phone number.`;return}}else if(l==="strict"){let d=s.replace(/[^\d+]/g,"");if(d.startsWith("+1"))d=d.substring(2);else if(d.startsWith("+")){n[e.name]=`${a} must be a valid US phone number (10 digits).`;return}else d.startsWith("1")&&d.length===11&&(d=d.substring(1));if(!/^\d{10}$/.test(d)){n[e.name]=`${a} must be a valid US phone number (10 digits).`;return}}return}if(e.type==="DATE"){let s=String(i),l=new Date(s);if(isNaN(l.getTime())){n[e.name]=`${a} must be a valid date.`;return}let d=new Date;d.setHours(0,0,0,0),l.setHours(0,0,0,0);let m=e.validation;if(m!=null&&m.noFuture&&l>d){n[e.name]=`${a} cannot be a future date.`;return}if(m!=null&&m.noPast&&l<d){n[e.name]=`${a} cannot be a past date.`;return}if(m!=null&&m.minDate){let b=new Date(m.minDate==="today"?d:m.minDate);if(b.setHours(0,0,0,0),l<b){n[e.name]=`${a} must be on or after ${b.toLocaleDateString()}.`;return}}if(m!=null&&m.maxDate){let b=new Date(m.maxDate==="today"?d:m.maxDate);if(b.setHours(0,0,0,0),l>b){n[e.name]=`${a} must be on or before ${b.toLocaleDateString()}.`;return}}}if(e.type==="NAME"){let s=i,l=e.options||{parts:["first","last"]},d=l.parts||["first","last"],m=l.partsRequired||{};for(let b of d){let E=s[b];if((e.required||m[b])&&(!E||E.trim()==="")){let O=((f=l.partLabels)==null?void 0:f[b])||b;n[e.name]=`${O} is required.`;return}}return}if(e.type==="SELECT"&&Array.isArray(e.options)&&!e.options.map(l=>l.value).includes(String(i))){n[e.name]=`${a} must be a valid option.`;return}let c=String(i),h=C(e);if((y=e.validation)!=null&&y.minLength&&c.length<e.validation.minLength){n[e.name]=`${a} must be at least ${e.validation.minLength} characters.`;return}if(h&&c.length>h){n[e.name]=`${a} must be at most ${h} characters.`;return}if(e.type==="TEXT"||e.type==="TEXTAREA"){let s=(p=e.validation)==null?void 0:p.format;if(s&&s!=="alphanumeric"){let l=!0,d=`${a} is invalid.`;switch(s){case"numbers":l=/^\d+$/.test(c),d=`${a} must contain only numbers.`;break;case"letters":l=/^[A-Za-z]+$/.test(c),d=`${a} must contain only letters.`;break;case"url":{let m=c.startsWith("http")?c:`https://${c}`;try{l=new URL(m).hostname.includes(".")}catch(b){l=!1}d=`${a} must be a valid URL.`;break}case"postal-us":l=/^\d{5}(-\d{4})?$/.test(c),d=`${a} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":l=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(c),d=`${a} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}l||(n[e.name]=d)}}}),n}var q=0,w=class{constructor(t,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.submitButton=null;this.instanceId=`canopy-${q++}`;this.container=t,this.options=n}async init(){try{this.container.classList.add("canopy-root");let t=await this.fetchDefinition();this.formDefinition=t,this.render(t)}catch(t){console.error(t),this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){let t=this.options.baseUrl||"",n=await fetch(`${t}/api/embed/${this.options.formId}`,{method:"GET",credentials:"omit"});if(!n.ok)throw new Error("Failed to load form definition");return n.json()}render(t){this.container.innerHTML="",this.fieldElements.clear();let n=$(t.defaultTheme,this.options.themeOverrides);if(S(this.container,n),k([n.bodyFont,n.headingFont]),!n.bodyFont&&!n.headingFont&&D(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(A(n)),!t.fields||t.fields.length===0){this.renderError("This form is not configured yet.");return}if(t.title||t.description){let y=document.createElement("div");if(y.className="canopy-header",t.title){let p=document.createElement("h2");p.className="canopy-title",p.textContent=t.title,y.appendChild(p)}if(t.description){let p=document.createElement("p");p.className="canopy-description",p.textContent=t.description,y.appendChild(p)}this.container.appendChild(y)}let e=document.createElement("div");e.className="canopy-status",e.setAttribute("role","status"),this.statusEl=e;let i=document.createElement("form");i.className="canopy-form",i.addEventListener("submit",y=>this.handleSubmit(y)),t.fields.forEach(y=>{let{wrapper:p,input:s,errorEl:l}=this.createField(y);p&&i.appendChild(p),this.fieldElements.set(y.name,{input:s,errorEl:l})});let a=document.createElement("button");a.type="submit",a.className="canopy-submit",a.textContent=n.buttonText||"Submit";let c=getComputedStyle(this.container),h=c.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",o=c.getPropertyValue("--canopy-button-text").trim()||"#ffffff",u=c.getPropertyValue("--canopy-radius").trim()||"8px",g=c.getPropertyValue("--canopy-button-width").trim()||"100%";a.style.cssText=`
      display: block !important;
      width: ${g} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${u} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${h} !important;
      background-color: ${h} !important;
      color: ${o} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=a;let f=document.createElement("div");f.className="canopy-form-actions",f.appendChild(a),i.appendChild(f),this.container.appendChild(e),this.container.appendChild(i)}createField(t){let n=`${this.instanceId}-${t.name}`;if(t.type==="HIDDEN"){let o=document.createElement("input");o.type="hidden",o.name=t.name,o.id=n;let u=t.options;if(u&&typeof u=="object"&&"valueSource"in u){let f=u.valueSource;if(f==="static")o.value=u.staticValue||"";else if(f==="urlParam"){let y=u.paramName;if(y){let p=new URLSearchParams(window.location.search);o.value=p.get(y)||""}}else f==="pageUrl"?o.value=window.location.href:f==="referrer"&&(o.value=document.referrer)}let g=document.createElement("span");return{wrapper:null,input:o,errorEl:g}}let e=document.createElement("div");e.className="canopy-field";let i=document.createElement("label");if(i.className="canopy-label",i.htmlFor=n,i.textContent=t.label||t.name,t.required){let o=document.createElement("span");o.className="canopy-required",o.textContent=" *",i.appendChild(o)}let a;switch(t.type){case"TEXTAREA":{let o=document.createElement("textarea");o.className="canopy-textarea";let u=C(t);if(u){let g=Math.min(Math.max(Math.ceil(u/60),4),15);o.rows=g}else o.rows=4;a=o;break}case"SELECT":{let o=t.options,u=o&&typeof o=="object"&&"options"in o,g=u?o.options:Array.isArray(t.options)?t.options:[],f=u?o.defaultValue:void 0,y=u?o.allowOther:!1,p=document.createElement("select");if(p.className="canopy-select",g.forEach(s=>{let l=document.createElement("option");l.value=s.value,l.textContent=s.label,f&&s.value===f&&(l.selected=!0),p.appendChild(l)}),y){let s=document.createElement("option");s.value="__other__",s.textContent="Other",p.appendChild(s)}if(a=p,y){let s=document.createElement("input");s.type="text",s.className="canopy-input canopy-select-other",s.name=`${t.name}_other`,s.placeholder="Please specify...",s.style.display="none",s.style.marginTop="0.5rem",s.addEventListener("input",()=>{s.setCustomValidity("")}),p.addEventListener("change",()=>{p.value==="__other__"?(s.style.display="block",t.required&&(s.required=!0)):(s.style.display="none",s.required=!1,s.value="")}),p.__otherInput=s}break}case"CHECKBOX":{let o=document.createElement("label");o.className="canopy-checkbox";let u=document.createElement("input");u.type="checkbox",u.id=n,u.name=t.name,o.appendChild(u);let g=document.createElement("span");if(g.textContent=t.label||t.name,o.appendChild(g),e.appendChild(o),t.helpText){let y=document.createElement("p");y.className="canopy-help-text",y.textContent=t.helpText,e.appendChild(y)}let f=document.createElement("span");return f.className="canopy-error",f.id=`${n}-error`,e.appendChild(f),u.setAttribute("aria-describedby",f.id),u.setAttribute("aria-invalid","false"),{wrapper:e,input:u,errorEl:f}}case"EMAIL":{let o=document.createElement("input");o.type="email",o.className="canopy-input",a=o;break}case"PHONE":{let o=document.createElement("input");o.type="tel",o.setAttribute("inputmode","tel"),o.setAttribute("autocomplete","tel"),o.className="canopy-input",a=o;break}case"DATE":{let o=document.createElement("input");o.type="date",o.className="canopy-input";let u=t.validation;u&&(u.minDate&&(o.min=this.resolveDate(u.minDate)),u.maxDate&&(o.max=this.resolveDate(u.maxDate)),u.noFuture&&(o.max=new Date().toISOString().split("T")[0]),u.noPast&&(o.min=new Date().toISOString().split("T")[0])),a=o;break}case"NAME":return this.createNameField(t);default:{let o=document.createElement("input");o.type="text",o.className="canopy-input",a=o}}a.id=n,a.name=t.name,a.setAttribute("aria-invalid","false"),t.placeholder&&a.setAttribute("placeholder",t.placeholder);let c=C(t);c&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=c),a.addEventListener("input",()=>{a.setCustomValidity("")});let h=document.createElement("span");if(h.className="canopy-error",h.id=`${n}-error`,a.setAttribute("aria-describedby",h.id),e.appendChild(i),e.appendChild(a),a.__otherInput&&e.appendChild(a.__otherInput),t.helpText){let o=document.createElement("p");o.className="canopy-help-text",o.textContent=t.helpText,e.appendChild(o)}return e.appendChild(h),{wrapper:e,input:a,errorEl:h}}resolveDate(t){return t==="today"?new Date().toISOString().split("T")[0]:t}createNameField(t){let n=`${this.instanceId}-${t.name}`,e=document.createElement("div");e.className="canopy-field canopy-name-group";let i=document.createElement("label");if(i.className="canopy-label",i.textContent=t.label||t.name,t.required){let p=document.createElement("span");p.className="canopy-required",p.textContent=" *",i.appendChild(p)}e.appendChild(i);let a=t.options||{parts:["first","last"]},c=a.parts||["first","last"],h=a.partLabels||{},o=a.partsRequired||{},u={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},g=document.createElement("div");g.className="canopy-name-parts";let f=document.createElement("input");f.type="hidden",f.id=n,f.name=t.name;let y=document.createElement("span");if(y.className="canopy-error",y.id=`${n}-error`,c.forEach(p=>{let s=document.createElement("div");s.className="canopy-name-part";let l=document.createElement("label");l.className="canopy-name-part-label";let d=`${n}-${p}`;if(l.htmlFor=d,l.textContent=h[p]||u[p]||p,t.required||o[p]){let b=document.createElement("span");b.className="canopy-required",b.textContent=" *",l.appendChild(b)}let m=document.createElement("input");m.type="text",m.className="canopy-input",m.id=d,m.name=`${t.name}.${p}`,m.setAttribute("data-name-part",p),m.setAttribute("data-name-field",t.name),m.addEventListener("input",()=>{m.setCustomValidity("")}),s.appendChild(l),s.appendChild(m),g.appendChild(s)}),e.appendChild(g),t.helpText){let p=document.createElement("p");p.className="canopy-help-text",p.textContent=t.helpText,e.appendChild(p)}return e.appendChild(y),{wrapper:e,input:f,errorEl:y}}collectValues(){let t={};return this.fieldElements.forEach((n,e)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")t[e]=n.input.checked;else if(n.input.type==="hidden"){let i=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(i.length>0){let a={};i.forEach(c=>{let h=c,o=h.getAttribute("data-name-part");o&&(a[o]=h.value)}),t[e]=a}else t[e]=n.input.value}else t[e]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?t[e]=n.input.__otherInput.value:t[e]=n.input.value}),t}showErrors(t){this.fieldElements.forEach((e,i)=>{let a=t[i]||"";if(e.input.type==="hidden"){let c=this.container.querySelector(`input[data-name-field="${i}"]`);c&&c.setCustomValidity(a)}else e.input.setCustomValidity(a);e.errorEl.textContent=a,e.input.setAttribute("aria-invalid",a?"true":"false")});let n=Object.keys(t);if(n.length>0){let e=this.fieldElements.get(n[0]);if(e)if(e.input.type==="hidden"){let i=this.container.querySelector(`input[data-name-field="${n[0]}"]`);i&&(i.reportValidity(),i.focus())}else e.input.reportValidity(),e.input.focus()}}setStatus(t,n){this.statusEl&&(this.statusEl.textContent=t,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(t){var i,a;if(t.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach(c=>{c.input.setCustomValidity("")});let n=this.collectValues(),e=N(this.formDefinition.fields,n);if(this.showErrors(e),Object.keys(e).length>0){let c=Object.keys(e).length;this.setStatus(`Please fix ${c} field${c>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let c=this.options.baseUrl||"",h=await fetch(`${c}/api/embed/${this.options.formId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),o=await h.json();if(!h.ok){o!=null&&o.fields&&this.showErrors(o.fields),this.setStatus((o==null?void 0:o.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}this.setStatus(this.formDefinition.successMessage||"Thanks for your submission!","success"),t.target.reset()}catch(c){console.error(c),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let c=((a=(i=this.formDefinition)==null?void 0:i.defaultTheme)==null?void 0:a.buttonText)||"Submit";this.submitButton.textContent=c,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderError(t){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=t,this.container.appendChild(n)}};var M=`
.canopy-root {
  font-family: var(--canopy-font, inherit);
  font-size: var(--canopy-font-size, 14px);
  color: var(--canopy-text, #18181b);
  background: var(--canopy-bg, #ffffff);
  padding: 4px;
  --canopy-heading-font: var(--canopy-font, inherit);
}

.canopy-form {
  display: grid;
  gap: 16px;
}

.canopy-form-actions {
  display: flex;
  justify-content: var(--canopy-button-align, left);
}

.canopy-density-compact .canopy-form {
  gap: 8px;
}

.canopy-density-comfortable .canopy-form {
  gap: 24px;
}

.canopy-field {
  display: grid;
  gap: 6px;
}

.canopy-label {
  font-size: var(--canopy-font-size, 14px);
  font-weight: 500;
}

.canopy-required {
  color: var(--canopy-primary, #005F6A);
}

.canopy-root .canopy-input,
.canopy-root .canopy-textarea,
.canopy-root .canopy-select {
  display: block !important;
  width: 100%;
  box-sizing: border-box;
  border-radius: var(--canopy-radius, 8px);
  border: 1px solid var(--canopy-border, #e4e4e7) !important;
  padding: 10px 12px;
  font-family: inherit;
  font-size: var(--canopy-font-size, 14px);
  background: var(--canopy-field-bg, #ffffff) !important;
  color: inherit;
  min-height: 40px;
  opacity: 1 !important;
  visibility: visible !important;
}

.canopy-root .canopy-textarea {
  min-height: 80px;
  resize: none;
}

.canopy-root .canopy-input:focus,
.canopy-root .canopy-textarea:focus,
.canopy-root .canopy-select:focus {
  outline: 2px solid var(--canopy-primary, #005F6A);
  outline-offset: 2px;
}

.canopy-root .canopy-input::placeholder,
.canopy-root .canopy-textarea::placeholder {
  color: var(--canopy-text, #18181b);
  opacity: 0.5;
}

.canopy-help-text {
  font-size: calc(var(--canopy-font-size, 14px) - 1px);
  color: #71717a;
  margin-top: 4px;
  line-height: 1.4;
}

.canopy-error {
  /* Hidden - using native HTML5 validation popups instead */
  /* Keep in DOM for screen reader accessibility */
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.canopy-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.canopy-name-parts {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.canopy-name-part {
  display: grid;
  gap: 4px;
}

.canopy-name-part-label {
  font-size: calc(var(--canopy-font-size, 14px) - 1px);
  font-weight: 500;
  color: var(--canopy-text, #18181b);
}

.canopy-root .canopy-submit {
  display: block;
  width: var(--canopy-button-width, 100%);
  box-sizing: border-box;
  border: none;
  border-radius: var(--canopy-radius, 8px);
  padding: 10px 16px;
  font-size: var(--canopy-font-size, 14px);
  font-weight: 600;
  background: var(--canopy-primary, #005F6A);
  color: var(--canopy-button-text, #ffffff);
  cursor: pointer;
  min-height: 40px;
}

.canopy-root .canopy-submit[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.canopy-status {
  font-size: var(--canopy-font-size, 14px);
}

.canopy-status.canopy-status-error {
  color: #FF6B5A;
}

.canopy-status.canopy-status-success {
  color: #5FD48C;
}

.canopy-header {
  margin-bottom: 16px;
}

.canopy-title {
  font-family: var(--canopy-heading-font, var(--canopy-font, inherit));
  font-size: 1.25em;
  font-weight: 600;
  color: var(--canopy-text, #18181b);
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.canopy-description {
  font-size: var(--canopy-font-size, 14px);
  color: var(--canopy-text, #18181b);
  opacity: 0.75;
  margin: 0;
  line-height: 1.5;
}
`;var I="canopy-embed-styles";function _(){if(document.getElementById(I))return;let r=document.createElement("style");r.id=I,r.textContent=M,document.head.appendChild(r)}function U(r){var t;return r.dataset.baseUrl||((t=document.querySelector("script[data-base-url]"))==null?void 0:t.getAttribute("data-base-url"))||""}function B(r){let t=r.dataset.theme;if(t)try{return JSON.parse(t)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function F(){_(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(t=>{if(t.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=t.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}t.dataset.canopyInitialized="true";let e=B(t),i=U(t);new w(t,{formId:n,themeOverrides:e,baseUrl:i}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",F):F();window.CanopyForms={init:F};})();
