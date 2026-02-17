"use strict";(()=>{var x={fontFamily:"inherit",fontSize:14,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:8,density:"normal",buttonWidth:"full",buttonAlign:"left",fontUrl:void 0,buttonText:void 0},L=new Set;function v(o,t){if(!o)return t;let n=o.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:t:t}function $(o,t){return{...x,...o!=null?o:{},...t!=null?t:{}}}function I(o){let t=/^#?([0-9a-f]{6})$/i.exec(o.trim());if(!t)return null;let n=parseInt(t[1],16);return[n>>16&255,n>>8&255,n&255]}function O(o,t,n){let[e,i,r]=[o,t,n].map(c=>{let f=c/255;return f<=.03928?f/12.92:Math.pow((f+.055)/1.055,2.4)});return .2126*e+.7152*i+.0722*r}function H(o){try{let t=I(o);return t&&O(...t)>.179?"#18181b":"#ffffff"}catch(t){return"#ffffff"}}function S(o,t){var e,i;o.style.setProperty("--canopy-font",t.fontFamily||"inherit"),o.style.setProperty("--canopy-font-size",`${(e=t.fontSize)!=null?e:x.fontSize}px`),o.style.setProperty("--canopy-text",v(t.text,x.text)),o.style.setProperty("--canopy-bg",v(t.background,x.background)),o.style.setProperty("--canopy-field-bg",v(t.fieldBackground,x.fieldBackground));let n=v(t.primary,x.primary);o.style.setProperty("--canopy-primary",n),o.style.setProperty("--canopy-button-text",H(n)),o.style.setProperty("--canopy-border",v(t.border,x.border)),o.style.setProperty("--canopy-radius",`${(i=t.radius)!=null?i:x.radius}px`),o.style.setProperty("--canopy-button-width",t.buttonWidth==="auto"?"auto":"100%"),o.style.setProperty("--canopy-button-align",t.buttonAlign||x.buttonAlign)}function A(o){switch(o.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function F(o){if(!o||L.has(o))return;let t=document.createElement("link");t.rel="stylesheet",t.href=o,t.dataset.canopyFont="true",document.head.appendChild(t),L.add(o)}var z={TEXT:200,EMAIL:254,TEXTAREA:2e3};function T(o){var t;return(t=o.validation)!=null&&t.maxLength?o.validation.maxLength:z[o.type]}function R(o){return o.label||o.name}function D(o,t){let n={};return o.forEach(e=>{var a,p,g,y,h,m;let i=t[e.name],r=R(e);if(e.required){if(e.type==="CHECKBOX"){if(!i){n[e.name]=`${r} is required.`;return}}else if(e.type!=="NAME"){if(i==null||String(i).trim()===""){n[e.name]=`${r} is required.`;return}}}if(e.type!=="NAME"){if(i==null||String(i).trim()==="")return}if(e.type==="EMAIL"){let s=String(i);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(s)){n[e.name]="Enter a valid email address";return}let u=(a=e.validation)==null?void 0:a.domainRules;if(u){let d=(p=s.split("@")[1])==null?void 0:p.toLowerCase();if(u.allow&&u.allow.length>0&&!u.allow.map(E=>E.toLowerCase()).includes(d)){n[e.name]=`${r} must be from an allowed domain.`;return}if(u.block&&u.block.length>0&&u.block.map(E=>E.toLowerCase()).includes(d)){n[e.name]=`${r} domain is not allowed.`;return}}}if(e.type==="PHONE"){let s=String(i),l=((g=e.validation)==null?void 0:g.format)||"lenient";if(l==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(s)){n[e.name]=`${r} must be a valid phone number.`;return}}else if(l==="strict"){let u=s.replace(/[^\d+]/g,"");if(u.startsWith("+1"))u=u.substring(2);else if(u.startsWith("+")){n[e.name]=`${r} must be a valid US phone number (10 digits).`;return}else u.startsWith("1")&&u.length===11&&(u=u.substring(1));if(!/^\d{10}$/.test(u)){n[e.name]=`${r} must be a valid US phone number (10 digits).`;return}}return}if(e.type==="DATE"){let s=String(i),l=new Date(s);if(isNaN(l.getTime())){n[e.name]=`${r} must be a valid date.`;return}let u=new Date;u.setHours(0,0,0,0),l.setHours(0,0,0,0);let d=e.validation;if(d!=null&&d.noFuture&&l>u){n[e.name]=`${r} cannot be a future date.`;return}if(d!=null&&d.noPast&&l<u){n[e.name]=`${r} cannot be a past date.`;return}if(d!=null&&d.minDate){let b=new Date(d.minDate==="today"?u:d.minDate);if(b.setHours(0,0,0,0),l<b){n[e.name]=`${r} must be on or after ${b.toLocaleDateString()}.`;return}}if(d!=null&&d.maxDate){let b=new Date(d.maxDate==="today"?u:d.maxDate);if(b.setHours(0,0,0,0),l>b){n[e.name]=`${r} must be on or before ${b.toLocaleDateString()}.`;return}}}if(e.type==="NAME"){let s=i,l=e.options||{parts:["first","last"]},u=l.parts||["first","last"],d=l.partsRequired||{};for(let b of u){let E=s[b];if((e.required||d[b])&&(!E||E.trim()==="")){let M=((y=l.partLabels)==null?void 0:y[b])||b;n[e.name]=`${M} is required.`;return}}return}if(e.type==="SELECT"&&Array.isArray(e.options)&&!e.options.map(l=>l.value).includes(String(i))){n[e.name]=`${r} must be a valid option.`;return}let c=String(i),f=T(e);if((h=e.validation)!=null&&h.minLength&&c.length<e.validation.minLength){n[e.name]=`${r} must be at least ${e.validation.minLength} characters.`;return}if(f&&c.length>f){n[e.name]=`${r} must be at most ${f} characters.`;return}if(e.type==="TEXT"||e.type==="TEXTAREA"){let s=(m=e.validation)==null?void 0:m.format;if(s&&s!=="alphanumeric"){let l=!0,u=`${r} is invalid.`;switch(s){case"numbers":l=/^\d+$/.test(c),u=`${r} must contain only numbers.`;break;case"letters":l=/^[A-Za-z]+$/.test(c),u=`${r} must contain only letters.`;break;case"url":{let d=c.startsWith("http")?c:`https://${c}`;try{l=new URL(d).hostname.includes(".")}catch(b){l=!1}u=`${r} must be a valid URL.`;break}case"postal-us":l=/^\d{5}(-\d{4})?$/.test(c),u=`${r} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":l=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(c),u=`${r} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}l||(n[e.name]=u)}}}),n}var V=0,w=class{constructor(t,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.submitButton=null;this.instanceId=`canopy-${V++}`;this.container=t,this.options=n}async init(){try{this.container.classList.add("canopy-root");let t=await this.fetchDefinition();this.formDefinition=t,this.render(t)}catch(t){console.error(t),this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){let t=this.options.baseUrl||"",n=await fetch(`${t}/api/embed/${this.options.formId}`,{method:"GET",credentials:"omit"});if(!n.ok)throw new Error("Failed to load form definition");return n.json()}render(t){this.container.innerHTML="",this.fieldElements.clear();let n=$(t.defaultTheme,this.options.themeOverrides);if(S(this.container,n),F(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(A(n)),!t.fields||t.fields.length===0){this.renderError("This form is not configured yet.");return}let e=document.createElement("div");e.className="canopy-status",e.setAttribute("role","status"),this.statusEl=e;let i=document.createElement("form");i.className="canopy-form",i.addEventListener("submit",h=>this.handleSubmit(h)),t.fields.forEach(h=>{let{wrapper:m,input:s,errorEl:l}=this.createField(h);m&&i.appendChild(m),this.fieldElements.set(h.name,{input:s,errorEl:l})});let r=document.createElement("button");r.type="submit",r.className="canopy-submit",r.textContent=n.buttonText||"Submit";let c=getComputedStyle(this.container),f=c.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",a=c.getPropertyValue("--canopy-button-text").trim()||"#ffffff",p=c.getPropertyValue("--canopy-radius").trim()||"8px",g=c.getPropertyValue("--canopy-button-width").trim()||"100%";r.style.cssText=`
      display: block !important;
      width: ${g} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${p} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${f} !important;
      background-color: ${f} !important;
      color: ${a} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=r;let y=document.createElement("div");y.className="canopy-form-actions",y.appendChild(r),i.appendChild(y),this.container.appendChild(e),this.container.appendChild(i)}createField(t){let n=`${this.instanceId}-${t.name}`;if(t.type==="HIDDEN"){let a=document.createElement("input");a.type="hidden",a.name=t.name,a.id=n;let p=t.options;if(p&&typeof p=="object"&&"valueSource"in p){let y=p.valueSource;if(y==="static")a.value=p.staticValue||"";else if(y==="urlParam"){let h=p.paramName;if(h){let m=new URLSearchParams(window.location.search);a.value=m.get(h)||""}}else y==="pageUrl"?a.value=window.location.href:y==="referrer"&&(a.value=document.referrer)}let g=document.createElement("span");return{wrapper:null,input:a,errorEl:g}}let e=document.createElement("div");e.className="canopy-field";let i=document.createElement("label");if(i.className="canopy-label",i.htmlFor=n,i.textContent=t.label||t.name,t.required){let a=document.createElement("span");a.className="canopy-required",a.textContent=" *",i.appendChild(a)}let r;switch(t.type){case"TEXTAREA":{let a=document.createElement("textarea");a.className="canopy-textarea";let p=T(t);if(p){let g=Math.min(Math.max(Math.ceil(p/60),4),15);a.rows=g}else a.rows=4;r=a;break}case"SELECT":{let a=t.options,p=a&&typeof a=="object"&&"options"in a,g=p?a.options:Array.isArray(t.options)?t.options:[],y=p?a.defaultValue:void 0,h=p?a.allowOther:!1,m=document.createElement("select");if(m.className="canopy-select",g.forEach(s=>{let l=document.createElement("option");l.value=s.value,l.textContent=s.label,y&&s.value===y&&(l.selected=!0),m.appendChild(l)}),h){let s=document.createElement("option");s.value="__other__",s.textContent="Other",m.appendChild(s)}if(r=m,h){let s=document.createElement("input");s.type="text",s.className="canopy-input canopy-select-other",s.name=`${t.name}_other`,s.placeholder="Please specify...",s.style.display="none",s.style.marginTop="0.5rem",s.addEventListener("input",()=>{s.setCustomValidity("")}),m.addEventListener("change",()=>{m.value==="__other__"?(s.style.display="block",t.required&&(s.required=!0)):(s.style.display="none",s.required=!1,s.value="")}),m.__otherInput=s}break}case"CHECKBOX":{let a=document.createElement("label");a.className="canopy-checkbox";let p=document.createElement("input");p.type="checkbox",p.id=n,p.name=t.name,a.appendChild(p);let g=document.createElement("span");if(g.textContent=t.label||t.name,a.appendChild(g),e.appendChild(a),t.helpText){let h=document.createElement("p");h.className="canopy-help-text",h.textContent=t.helpText,e.appendChild(h)}let y=document.createElement("span");return y.className="canopy-error",y.id=`${n}-error`,e.appendChild(y),p.setAttribute("aria-describedby",y.id),p.setAttribute("aria-invalid","false"),{wrapper:e,input:p,errorEl:y}}case"EMAIL":{let a=document.createElement("input");a.type="email",a.className="canopy-input",r=a;break}case"PHONE":{let a=document.createElement("input");a.type="tel",a.setAttribute("inputmode","tel"),a.setAttribute("autocomplete","tel"),a.className="canopy-input",r=a;break}case"DATE":{let a=document.createElement("input");a.type="date",a.className="canopy-input";let p=t.validation;p&&(p.minDate&&(a.min=this.resolveDate(p.minDate)),p.maxDate&&(a.max=this.resolveDate(p.maxDate)),p.noFuture&&(a.max=new Date().toISOString().split("T")[0]),p.noPast&&(a.min=new Date().toISOString().split("T")[0])),r=a;break}case"NAME":return this.createNameField(t);default:{let a=document.createElement("input");a.type="text",a.className="canopy-input",r=a}}r.id=n,r.name=t.name,r.setAttribute("aria-invalid","false"),t.placeholder&&r.setAttribute("placeholder",t.placeholder);let c=T(t);c&&(r instanceof HTMLInputElement||r instanceof HTMLTextAreaElement)&&(r.maxLength=c),r.addEventListener("input",()=>{r.setCustomValidity("")});let f=document.createElement("span");if(f.className="canopy-error",f.id=`${n}-error`,r.setAttribute("aria-describedby",f.id),e.appendChild(i),e.appendChild(r),r.__otherInput&&e.appendChild(r.__otherInput),t.helpText){let a=document.createElement("p");a.className="canopy-help-text",a.textContent=t.helpText,e.appendChild(a)}return e.appendChild(f),{wrapper:e,input:r,errorEl:f}}resolveDate(t){return t==="today"?new Date().toISOString().split("T")[0]:t}createNameField(t){let n=`${this.instanceId}-${t.name}`,e=document.createElement("div");e.className="canopy-field canopy-name-group";let i=document.createElement("label");if(i.className="canopy-label",i.textContent=t.label||t.name,t.required){let m=document.createElement("span");m.className="canopy-required",m.textContent=" *",i.appendChild(m)}e.appendChild(i);let r=t.options||{parts:["first","last"]},c=r.parts||["first","last"],f=r.partLabels||{},a=r.partsRequired||{},p={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},g=document.createElement("div");g.className="canopy-name-parts";let y=document.createElement("input");y.type="hidden",y.id=n,y.name=t.name;let h=document.createElement("span");if(h.className="canopy-error",h.id=`${n}-error`,c.forEach(m=>{let s=document.createElement("div");s.className="canopy-name-part";let l=document.createElement("label");l.className="canopy-name-part-label";let u=`${n}-${m}`;if(l.htmlFor=u,l.textContent=f[m]||p[m]||m,t.required||a[m]){let b=document.createElement("span");b.className="canopy-required",b.textContent=" *",l.appendChild(b)}let d=document.createElement("input");d.type="text",d.className="canopy-input",d.id=u,d.name=`${t.name}.${m}`,d.setAttribute("data-name-part",m),d.setAttribute("data-name-field",t.name),d.addEventListener("input",()=>{d.setCustomValidity("")}),s.appendChild(l),s.appendChild(d),g.appendChild(s)}),e.appendChild(g),t.helpText){let m=document.createElement("p");m.className="canopy-help-text",m.textContent=t.helpText,e.appendChild(m)}return e.appendChild(h),{wrapper:e,input:y,errorEl:h}}collectValues(){let t={};return this.fieldElements.forEach((n,e)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")t[e]=n.input.checked;else if(n.input.type==="hidden"){let i=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(i.length>0){let r={};i.forEach(c=>{let f=c,a=f.getAttribute("data-name-part");a&&(r[a]=f.value)}),t[e]=r}else t[e]=n.input.value}else t[e]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?t[e]=n.input.__otherInput.value:t[e]=n.input.value}),t}showErrors(t){this.fieldElements.forEach((e,i)=>{let r=t[i]||"";if(e.input.type==="hidden"){let c=this.container.querySelector(`input[data-name-field="${i}"]`);c&&c.setCustomValidity(r)}else e.input.setCustomValidity(r);e.errorEl.textContent=r,e.input.setAttribute("aria-invalid",r?"true":"false")});let n=Object.keys(t);if(n.length>0){let e=this.fieldElements.get(n[0]);if(e)if(e.input.type==="hidden"){let i=this.container.querySelector(`input[data-name-field="${n[0]}"]`);i&&(i.reportValidity(),i.focus())}else e.input.reportValidity(),e.input.focus()}}setStatus(t,n){this.statusEl&&(this.statusEl.textContent=t,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(t){var i,r;if(t.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach(c=>{c.input.setCustomValidity("")});let n=this.collectValues(),e=D(this.formDefinition.fields,n);if(this.showErrors(e),Object.keys(e).length>0){let c=Object.keys(e).length;this.setStatus(`Please fix ${c} field${c>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let c=this.options.baseUrl||"",f=await fetch(`${c}/api/embed/${this.options.formId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),a=await f.json();if(!f.ok){a!=null&&a.fields&&this.showErrors(a.fields),this.setStatus((a==null?void 0:a.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}this.setStatus(this.formDefinition.successMessage||"Thanks for your submission!","success"),t.target.reset()}catch(c){console.error(c),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let c=((r=(i=this.formDefinition)==null?void 0:i.defaultTheme)==null?void 0:r.buttonText)||"Submit";this.submitButton.textContent=c,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderError(t){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=t,this.container.appendChild(n)}};var k=`
.canopy-root {
  font-family: var(--canopy-font, inherit);
  font-size: var(--canopy-font-size, 14px);
  color: var(--canopy-text, #18181b);
  background: var(--canopy-bg, #ffffff);
  padding: 4px;
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
`;var N="canopy-embed-styles";function P(){if(document.getElementById(N))return;let o=document.createElement("style");o.id=N,o.textContent=k,document.head.appendChild(o)}function q(o){var t;return o.dataset.baseUrl||((t=document.querySelector("script[data-base-url]"))==null?void 0:t.getAttribute("data-base-url"))||""}function _(o){let t=o.dataset.theme;if(t)try{return JSON.parse(t)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function C(){P(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(t=>{if(t.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=t.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}t.dataset.canopyInitialized="true";let e=_(t),i=q(t);new w(t,{formId:n,themeOverrides:e,baseUrl:i}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",C):C();window.CanopyForms={init:C};})();
