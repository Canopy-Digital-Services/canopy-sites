"use strict";(()=>{var x={fontFamily:"inherit",fontSize:14,text:"#18181b",background:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:8,density:"normal",buttonWidth:"full",buttonAlign:"left",fontUrl:void 0,buttonText:void 0},L=new Set;function v(i,t){if(!i)return t;let n=i.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:t:t}function S(i,t){return{...x,...i!=null?i:{},...t!=null?t:{}}}function $(i,t){var n,e;i.style.setProperty("--canopy-font",t.fontFamily||"inherit"),i.style.setProperty("--canopy-font-size",`${(n=t.fontSize)!=null?n:x.fontSize}px`),i.style.setProperty("--canopy-text",v(t.text,x.text)),i.style.setProperty("--canopy-bg",v(t.background,x.background)),i.style.setProperty("--canopy-primary",v(t.primary,x.primary)),i.style.setProperty("--canopy-border",v(t.border,x.border)),i.style.setProperty("--canopy-radius",`${(e=t.radius)!=null?e:x.radius}px`),i.style.setProperty("--canopy-button-width",t.buttonWidth==="auto"?"auto":"100%"),i.style.setProperty("--canopy-button-align",t.buttonAlign||x.buttonAlign)}function A(i){switch(i.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function F(i){if(!i||L.has(i))return;let t=document.createElement("link");t.rel="stylesheet",t.href=i,t.dataset.canopyFont="true",document.head.appendChild(t),L.add(i)}var I={TEXT:200,EMAIL:254,TEXTAREA:2e3};function T(i){var t;return(t=i.validation)!=null&&t.maxLength?i.validation.maxLength:I[i.type]}function O(i){return i.label||i.name}function D(i,t){let n={};return i.forEach(e=>{var a,c,f,y,g,m;let r=t[e.name],o=O(e);if(e.required){if(e.type==="CHECKBOX"){if(!r){n[e.name]=`${o} is required.`;return}}else if(e.type!=="NAME"){if(r==null||String(r).trim()===""){n[e.name]=`${o} is required.`;return}}}if(e.type!=="NAME"){if(r==null||String(r).trim()==="")return}if(e.type==="EMAIL"){let s=String(r);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(s)){n[e.name]="Enter a valid email address";return}let p=(a=e.validation)==null?void 0:a.domainRules;if(p){let d=(c=s.split("@")[1])==null?void 0:c.toLowerCase();if(p.allow&&p.allow.length>0&&!p.allow.map(E=>E.toLowerCase()).includes(d)){n[e.name]=`${o} must be from an allowed domain.`;return}if(p.block&&p.block.length>0&&p.block.map(E=>E.toLowerCase()).includes(d)){n[e.name]=`${o} domain is not allowed.`;return}}}if(e.type==="PHONE"){let s=String(r),l=((f=e.validation)==null?void 0:f.format)||"lenient";if(l==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(s)){n[e.name]=`${o} must be a valid phone number.`;return}}else if(l==="strict"){let p=s.replace(/[^\d+]/g,"");if(p.startsWith("+1"))p=p.substring(2);else if(p.startsWith("+")){n[e.name]=`${o} must be a valid US phone number (10 digits).`;return}else p.startsWith("1")&&p.length===11&&(p=p.substring(1));if(!/^\d{10}$/.test(p)){n[e.name]=`${o} must be a valid US phone number (10 digits).`;return}}return}if(e.type==="DATE"){let s=String(r),l=new Date(s);if(isNaN(l.getTime())){n[e.name]=`${o} must be a valid date.`;return}let p=new Date;p.setHours(0,0,0,0),l.setHours(0,0,0,0);let d=e.validation;if(d!=null&&d.noFuture&&l>p){n[e.name]=`${o} cannot be a future date.`;return}if(d!=null&&d.noPast&&l<p){n[e.name]=`${o} cannot be a past date.`;return}if(d!=null&&d.minDate){let h=new Date(d.minDate==="today"?p:d.minDate);if(h.setHours(0,0,0,0),l<h){n[e.name]=`${o} must be on or after ${h.toLocaleDateString()}.`;return}}if(d!=null&&d.maxDate){let h=new Date(d.maxDate==="today"?p:d.maxDate);if(h.setHours(0,0,0,0),l>h){n[e.name]=`${o} must be on or before ${h.toLocaleDateString()}.`;return}}}if(e.type==="NAME"){let s=r,l=e.options||{parts:["first","last"]},p=l.parts||["first","last"],d=l.partsRequired||{};for(let h of p){let E=s[h];if((e.required||d[h])&&(!E||E.trim()==="")){let M=((y=l.partLabels)==null?void 0:y[h])||h;n[e.name]=`${M} is required.`;return}}return}if(e.type==="SELECT"&&Array.isArray(e.options)&&!e.options.map(l=>l.value).includes(String(r))){n[e.name]=`${o} must be a valid option.`;return}let u=String(r),b=T(e);if((g=e.validation)!=null&&g.minLength&&u.length<e.validation.minLength){n[e.name]=`${o} must be at least ${e.validation.minLength} characters.`;return}if(b&&u.length>b){n[e.name]=`${o} must be at most ${b} characters.`;return}if(e.type==="TEXT"||e.type==="TEXTAREA"){let s=(m=e.validation)==null?void 0:m.format;if(s&&s!=="alphanumeric"){let l=!0,p=`${o} is invalid.`;switch(s){case"numbers":l=/^\d+$/.test(u),p=`${o} must contain only numbers.`;break;case"letters":l=/^[A-Za-z]+$/.test(u),p=`${o} must contain only letters.`;break;case"url":{let d=u.startsWith("http")?u:`https://${u}`;try{l=new URL(d).hostname.includes(".")}catch(h){l=!1}p=`${o} must be a valid URL.`;break}case"postal-us":l=/^\d{5}(-\d{4})?$/.test(u),p=`${o} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":l=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(u),p=`${o} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}l||(n[e.name]=p)}}}),n}var H=0,C=class{constructor(t,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.submitButton=null;this.instanceId=`canopy-${H++}`;this.container=t,this.options=n}async init(){try{this.container.classList.add("canopy-root");let t=await this.fetchDefinition();this.formDefinition=t,this.render(t)}catch(t){console.error(t),this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){let t=this.options.baseUrl||"",n=await fetch(`${t}/api/embed/${this.options.formId}`,{method:"GET",credentials:"omit"});if(!n.ok)throw new Error("Failed to load form definition");return n.json()}render(t){this.container.innerHTML="",this.fieldElements.clear();let n=S(t.defaultTheme,this.options.themeOverrides);if($(this.container,n),F(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(A(n)),!t.fields||t.fields.length===0){this.renderError("This form is not configured yet.");return}let e=document.createElement("div");e.className="canopy-status",e.setAttribute("role","status"),this.statusEl=e;let r=document.createElement("form");r.className="canopy-form",r.addEventListener("submit",f=>this.handleSubmit(f)),t.fields.forEach(f=>{let{wrapper:y,input:g,errorEl:m}=this.createField(f);y&&r.appendChild(y),this.fieldElements.set(f.name,{input:g,errorEl:m})});let o=document.createElement("button");o.type="submit",o.className="canopy-submit",o.textContent=n.buttonText||"Submit";let u=getComputedStyle(this.container).getPropertyValue("--canopy-primary").trim()||"#0ea5e9",b=getComputedStyle(this.container).getPropertyValue("--canopy-radius").trim()||"8px",a=getComputedStyle(this.container).getPropertyValue("--canopy-button-width").trim()||"100%";o.style.cssText=`
      display: block !important;
      width: ${a} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${b} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${u} !important;
      background-color: ${u} !important;
      color: #ffffff !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=o;let c=document.createElement("div");c.className="canopy-form-actions",c.appendChild(o),r.appendChild(c),this.container.appendChild(e),this.container.appendChild(r)}createField(t){let n=`${this.instanceId}-${t.name}`;if(t.type==="HIDDEN"){let a=document.createElement("input");a.type="hidden",a.name=t.name,a.id=n;let c=t.options;if(c&&typeof c=="object"&&"valueSource"in c){let y=c.valueSource;if(y==="static")a.value=c.staticValue||"";else if(y==="urlParam"){let g=c.paramName;if(g){let m=new URLSearchParams(window.location.search);a.value=m.get(g)||""}}else y==="pageUrl"?a.value=window.location.href:y==="referrer"&&(a.value=document.referrer)}let f=document.createElement("span");return{wrapper:null,input:a,errorEl:f}}let e=document.createElement("div");e.className="canopy-field";let r=document.createElement("label");if(r.className="canopy-label",r.htmlFor=n,r.textContent=t.label||t.name,t.required){let a=document.createElement("span");a.className="canopy-required",a.textContent=" *",r.appendChild(a)}let o;switch(t.type){case"TEXTAREA":{let a=document.createElement("textarea");a.className="canopy-textarea";let c=T(t);if(c){let f=Math.min(Math.max(Math.ceil(c/60),4),15);a.rows=f}else a.rows=4;o=a;break}case"SELECT":{let a=t.options,c=a&&typeof a=="object"&&"options"in a,f=c?a.options:Array.isArray(t.options)?t.options:[],y=c?a.defaultValue:void 0,g=c?a.allowOther:!1,m=document.createElement("select");if(m.className="canopy-select",f.forEach(s=>{let l=document.createElement("option");l.value=s.value,l.textContent=s.label,y&&s.value===y&&(l.selected=!0),m.appendChild(l)}),g){let s=document.createElement("option");s.value="__other__",s.textContent="Other",m.appendChild(s)}if(o=m,g){let s=document.createElement("input");s.type="text",s.className="canopy-input canopy-select-other",s.name=`${t.name}_other`,s.placeholder="Please specify...",s.style.display="none",s.style.marginTop="0.5rem",s.addEventListener("input",()=>{s.setCustomValidity("")}),m.addEventListener("change",()=>{m.value==="__other__"?(s.style.display="block",t.required&&(s.required=!0)):(s.style.display="none",s.required=!1,s.value="")}),m.__otherInput=s}break}case"CHECKBOX":{let a=document.createElement("label");a.className="canopy-checkbox";let c=document.createElement("input");c.type="checkbox",c.id=n,c.name=t.name,a.appendChild(c);let f=document.createElement("span");if(f.textContent=t.label||t.name,a.appendChild(f),e.appendChild(a),t.helpText){let g=document.createElement("p");g.className="canopy-help-text",g.textContent=t.helpText,e.appendChild(g)}let y=document.createElement("span");return y.className="canopy-error",y.id=`${n}-error`,e.appendChild(y),c.setAttribute("aria-describedby",y.id),c.setAttribute("aria-invalid","false"),{wrapper:e,input:c,errorEl:y}}case"EMAIL":{let a=document.createElement("input");a.type="email",a.className="canopy-input",o=a;break}case"PHONE":{let a=document.createElement("input");a.type="tel",a.setAttribute("inputmode","tel"),a.setAttribute("autocomplete","tel"),a.className="canopy-input",o=a;break}case"DATE":{let a=document.createElement("input");a.type="date",a.className="canopy-input";let c=t.validation;c&&(c.minDate&&(a.min=this.resolveDate(c.minDate)),c.maxDate&&(a.max=this.resolveDate(c.maxDate)),c.noFuture&&(a.max=new Date().toISOString().split("T")[0]),c.noPast&&(a.min=new Date().toISOString().split("T")[0])),o=a;break}case"NAME":return this.createNameField(t);default:{let a=document.createElement("input");a.type="text",a.className="canopy-input",o=a}}o.id=n,o.name=t.name,o.setAttribute("aria-invalid","false"),t.placeholder&&o.setAttribute("placeholder",t.placeholder);let u=T(t);u&&(o instanceof HTMLInputElement||o instanceof HTMLTextAreaElement)&&(o.maxLength=u),o.addEventListener("input",()=>{o.setCustomValidity("")});let b=document.createElement("span");if(b.className="canopy-error",b.id=`${n}-error`,o.setAttribute("aria-describedby",b.id),e.appendChild(r),e.appendChild(o),o.__otherInput&&e.appendChild(o.__otherInput),t.helpText){let a=document.createElement("p");a.className="canopy-help-text",a.textContent=t.helpText,e.appendChild(a)}return e.appendChild(b),{wrapper:e,input:o,errorEl:b}}resolveDate(t){return t==="today"?new Date().toISOString().split("T")[0]:t}createNameField(t){let n=`${this.instanceId}-${t.name}`,e=document.createElement("div");e.className="canopy-field canopy-name-group";let r=document.createElement("label");if(r.className="canopy-label",r.textContent=t.label||t.name,t.required){let m=document.createElement("span");m.className="canopy-required",m.textContent=" *",r.appendChild(m)}e.appendChild(r);let o=t.options||{parts:["first","last"]},u=o.parts||["first","last"],b=o.partLabels||{},a=o.partsRequired||{},c={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},f=document.createElement("div");f.className="canopy-name-parts";let y=document.createElement("input");y.type="hidden",y.id=n,y.name=t.name;let g=document.createElement("span");if(g.className="canopy-error",g.id=`${n}-error`,u.forEach(m=>{let s=document.createElement("div");s.className="canopy-name-part";let l=document.createElement("label");l.className="canopy-name-part-label";let p=`${n}-${m}`;if(l.htmlFor=p,l.textContent=b[m]||c[m]||m,t.required||a[m]){let h=document.createElement("span");h.className="canopy-required",h.textContent=" *",l.appendChild(h)}let d=document.createElement("input");d.type="text",d.className="canopy-input",d.id=p,d.name=`${t.name}.${m}`,d.setAttribute("data-name-part",m),d.setAttribute("data-name-field",t.name),d.addEventListener("input",()=>{d.setCustomValidity("")}),s.appendChild(l),s.appendChild(d),f.appendChild(s)}),e.appendChild(f),t.helpText){let m=document.createElement("p");m.className="canopy-help-text",m.textContent=t.helpText,e.appendChild(m)}return e.appendChild(g),{wrapper:e,input:y,errorEl:g}}collectValues(){let t={};return this.fieldElements.forEach((n,e)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")t[e]=n.input.checked;else if(n.input.type==="hidden"){let r=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(r.length>0){let o={};r.forEach(u=>{let b=u,a=b.getAttribute("data-name-part");a&&(o[a]=b.value)}),t[e]=o}else t[e]=n.input.value}else t[e]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?t[e]=n.input.__otherInput.value:t[e]=n.input.value}),t}showErrors(t){this.fieldElements.forEach((e,r)=>{let o=t[r]||"";if(e.input.type==="hidden"){let u=this.container.querySelector(`input[data-name-field="${r}"]`);u&&u.setCustomValidity(o)}else e.input.setCustomValidity(o);e.errorEl.textContent=o,e.input.setAttribute("aria-invalid",o?"true":"false")});let n=Object.keys(t);if(n.length>0){let e=this.fieldElements.get(n[0]);if(e)if(e.input.type==="hidden"){let r=this.container.querySelector(`input[data-name-field="${n[0]}"]`);r&&(r.reportValidity(),r.focus())}else e.input.reportValidity(),e.input.focus()}}setStatus(t,n){this.statusEl&&(this.statusEl.textContent=t,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(t){var r,o;if(t.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach(u=>{u.input.setCustomValidity("")});let n=this.collectValues(),e=D(this.formDefinition.fields,n);if(this.showErrors(e),Object.keys(e).length>0){let u=Object.keys(e).length;this.setStatus(`Please fix ${u} field${u>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let u=this.options.baseUrl||"",b=await fetch(`${u}/api/embed/${this.options.formId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),a=await b.json();if(!b.ok){a!=null&&a.fields&&this.showErrors(a.fields),this.setStatus((a==null?void 0:a.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}this.setStatus(this.formDefinition.successMessage||"Thanks for your submission!","success"),t.target.reset()}catch(u){console.error(u),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let u=((o=(r=this.formDefinition)==null?void 0:r.defaultTheme)==null?void 0:o.buttonText)||"Submit";this.submitButton.textContent=u,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderError(t){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=t,this.container.appendChild(n)}};var N=`
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
  background: #ffffff !important;
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
  color: #ffffff;
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
`;var k="canopy-embed-styles";function z(){if(document.getElementById(k))return;let i=document.createElement("style");i.id=k,i.textContent=N,document.head.appendChild(i)}function R(i){var t;return i.dataset.baseUrl||((t=document.querySelector("script[data-base-url]"))==null?void 0:t.getAttribute("data-base-url"))||""}function V(i){let t=i.dataset.theme;if(t)try{return JSON.parse(t)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function w(){z(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(t=>{if(t.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=t.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}t.dataset.canopyInitialized="true";let e=V(t),r=R(t);new C(t,{formId:n,themeOverrides:e,baseUrl:r}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",w):w();window.CanopyForms={init:w};})();
