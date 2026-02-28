"use strict";(()=>{var x={fontSize:14,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:8,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:"md",titleWeight:"semibold",titleColor:void 0,labelWeight:"medium",labelTransform:"none",bodyFont:void 0,headingFont:void 0,fontUrl:void 0,fontFamily:void 0,buttonText:void 0},C=new Set;function v(r,t){if(!r)return t;let n=r.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:t:t}function L(r,t){return{...x,...r!=null?r:{},...t!=null?t:{}}}function z(r){let t=/^#?([0-9a-f]{6})$/i.exec(r.trim());if(!t)return null;let n=parseInt(t[1],16);return[n>>16&255,n>>8&255,n&255]}function H(r,t,n){let[e,i,o]=[r,t,n].map(u=>{let f=u/255;return f<=.03928?f/12.92:Math.pow((f+.055)/1.055,2.4)});return .2126*e+.7152*i+.0722*o}function P(r){try{let t=z(r);return t&&H(...t)>.179?"#18181b":"#ffffff"}catch(t){return"#ffffff"}}function $(r,t){var m,b,h,y,c;let n=k(t.bodyFont,t.fontFamily);r.style.setProperty("--canopy-font",n);let e=k(t.headingFont);r.style.setProperty("--canopy-heading-font",e==="inherit"?"var(--canopy-font)":e),r.style.setProperty("--canopy-font-size",`${(m=t.fontSize)!=null?m:x.fontSize}px`),r.style.setProperty("--canopy-text",v(t.text,x.text)),r.style.setProperty("--canopy-bg",v(t.background,x.background)),r.style.setProperty("--canopy-field-bg",v(t.fieldBackground,x.fieldBackground));let i=v(t.primary,x.primary);r.style.setProperty("--canopy-primary",i),r.style.setProperty("--canopy-button-text",P(i)),r.style.setProperty("--canopy-border",v(t.border,x.border)),r.style.setProperty("--canopy-radius",`${(b=t.radius)!=null?b:x.radius}px`),r.style.setProperty("--canopy-button-width",t.buttonWidth==="auto"?"auto":"100%"),r.style.setProperty("--canopy-button-align",t.buttonAlign||x.buttonAlign);let o={sm:"1em",md:"1.25em",lg:"1.5em",xl:"1.875em"};r.style.setProperty("--canopy-title-size",o[(h=t.titleSize)!=null?h:"md"]);let u={normal:"400",semibold:"600",bold:"700"};r.style.setProperty("--canopy-title-weight",u[(y=t.titleWeight)!=null?y:"semibold"]);let f=t.titleColor?v(t.titleColor,""):"";f?r.style.setProperty("--canopy-title-color",f):r.style.removeProperty("--canopy-title-color");let a={normal:"400",medium:"500",semibold:"600"};r.style.setProperty("--canopy-label-weight",a[(c=t.labelWeight)!=null?c:"medium"]),r.style.setProperty("--canopy-label-transform",t.labelTransform==="uppercase"?"uppercase":"none")}function A(r){switch(r.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function k(r,t){return r&&r!=="inherit"?`'${r}', sans-serif`:t&&t!=="inherit"?t:"inherit"}function S(r){let t=r.filter(o=>!!o&&o!=="inherit"&&!C.has(o));if(t.length===0)return;let e=`https://fonts.googleapis.com/css2?${t.map(o=>`family=${encodeURIComponent(o)}:wght@400;500;600;700`).join("&")}&display=swap`,i=document.createElement("link");i.rel="stylesheet",i.href=e,i.dataset.canopyFont="true",document.head.appendChild(i),t.forEach(o=>C.add(o))}function D(r){if(!r||C.has(r))return;let t=document.createElement("link");t.rel="stylesheet",t.href=r,t.dataset.canopyFont="true",document.head.appendChild(t),C.add(r)}var q={TEXT:200,EMAIL:254,TEXTAREA:2e3};function T(r){var t;return(t=r.validation)!=null&&t.maxLength?r.validation.maxLength:q[r.type]}function R(r){return r.label||r.name}function N(r,t){let n={};return r.forEach(e=>{var a,m,b,h,y,c;let i=t[e.name],o=R(e);if(e.required){if(e.type==="CHECKBOX"){if(!i){n[e.name]=`${o} is required.`;return}}else if(e.type==="CHECKBOXES"){if(!Array.isArray(i)||i.length===0){n[e.name]=`${o} is required.`;return}}else if(e.type!=="NAME"){if(i==null||String(i).trim()===""){n[e.name]=`${o} is required.`;return}}}if(e.type==="CHECKBOXES"){if(Array.isArray(i)&&i.length>0){let s=e.options,p=s&&typeof s=="object"&&"options"in s?s.options.map(d=>d.value):[];for(let d of i)if(!p.includes(String(d))){n[e.name]=`${o} contains an invalid option.`;return}}return}if(e.type!=="NAME"){if(i==null||String(i).trim()==="")return}if(e.type==="EMAIL"){let s=String(i);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(s)){n[e.name]="Enter a valid email address";return}let p=(a=e.validation)==null?void 0:a.domainRules;if(p){let d=(m=s.split("@")[1])==null?void 0:m.toLowerCase();if(p.allow&&p.allow.length>0&&!p.allow.map(E=>E.toLowerCase()).includes(d)){n[e.name]=`${o} must be from an allowed domain.`;return}if(p.block&&p.block.length>0&&p.block.map(E=>E.toLowerCase()).includes(d)){n[e.name]=`${o} domain is not allowed.`;return}}}if(e.type==="PHONE"){let s=String(i),l=((b=e.validation)==null?void 0:b.format)||"lenient";if(l==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(s)){n[e.name]=`${o} must be a valid phone number.`;return}}else if(l==="strict"){let p=s.replace(/[^\d+]/g,"");if(p.startsWith("+1"))p=p.substring(2);else if(p.startsWith("+")){n[e.name]=`${o} must be a valid US phone number (10 digits).`;return}else p.startsWith("1")&&p.length===11&&(p=p.substring(1));if(!/^\d{10}$/.test(p)){n[e.name]=`${o} must be a valid US phone number (10 digits).`;return}}return}if(e.type==="DATE"){let s=String(i),l=new Date(s);if(isNaN(l.getTime())){n[e.name]=`${o} must be a valid date.`;return}let p=new Date;p.setHours(0,0,0,0),l.setHours(0,0,0,0);let d=e.validation;if(d!=null&&d.noFuture&&l>p){n[e.name]=`${o} cannot be a future date.`;return}if(d!=null&&d.noPast&&l<p){n[e.name]=`${o} cannot be a past date.`;return}if(d!=null&&d.minDate){let g=new Date(d.minDate==="today"?p:d.minDate);if(g.setHours(0,0,0,0),l<g){n[e.name]=`${o} must be on or after ${g.toLocaleDateString()}.`;return}}if(d!=null&&d.maxDate){let g=new Date(d.maxDate==="today"?p:d.maxDate);if(g.setHours(0,0,0,0),l>g){n[e.name]=`${o} must be on or before ${g.toLocaleDateString()}.`;return}}}if(e.type==="NAME"){let s=i,l=e.options||{parts:["first","last"]},p=l.parts||["first","last"],d=l.partsRequired||{};for(let g of p){let E=s[g];if((e.required||d[g])&&(!E||E.trim()==="")){let I=((h=l.partLabels)==null?void 0:h[g])||g;n[e.name]=`${I} is required.`;return}}return}if(e.type==="DROPDOWN"&&Array.isArray(e.options)&&!e.options.map(l=>l.value).includes(String(i))){n[e.name]=`${o} must be a valid option.`;return}let u=String(i),f=T(e);if((y=e.validation)!=null&&y.minLength&&u.length<e.validation.minLength){n[e.name]=`${o} must be at least ${e.validation.minLength} characters.`;return}if(f&&u.length>f){n[e.name]=`${o} must be at most ${f} characters.`;return}if(e.type==="TEXT"||e.type==="TEXTAREA"){let s=(c=e.validation)==null?void 0:c.format;if(s&&s!=="alphanumeric"){let l=!0,p=`${o} is invalid.`;switch(s){case"numbers":l=/^\d+$/.test(u),p=`${o} must contain only numbers.`;break;case"letters":l=/^[A-Za-z]+$/.test(u),p=`${o} must contain only letters.`;break;case"url":{let d=u.startsWith("http")?u:`https://${u}`;try{l=new URL(d).hostname.includes(".")}catch(g){l=!1}p=`${o} must be a valid URL.`;break}case"postal-us":l=/^\d{5}(-\d{4})?$/.test(u),p=`${o} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":l=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(u),p=`${o} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}l||(n[e.name]=p)}}}),n}var V=0,w=class{constructor(t,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.submitButton=null;this.instanceId=`canopy-${V++}`;this.container=t,this.options=n}async init(){try{this.container.classList.add("canopy-root");let t=await this.fetchDefinition();this.formDefinition=t,this.render(t)}catch(t){console.error(t),this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){let t=this.options.baseUrl||"",n=await fetch(`${t}/api/embed/${this.options.formId}`,{method:"GET",credentials:"omit"});if(!n.ok)throw new Error("Failed to load form definition");return n.json()}render(t){this.container.innerHTML="",this.fieldElements.clear();let n=L(t.defaultTheme,this.options.themeOverrides);if($(this.container,n),S([n.bodyFont,n.headingFont]),!n.bodyFont&&!n.headingFont&&D(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(A(n)),!t.fields||t.fields.length===0){this.renderError("This form is not configured yet.");return}if(t.title||t.description){let y=document.createElement("div");if(y.className="canopy-header",t.title){let c=document.createElement("h2");c.className="canopy-title",c.textContent=t.title,y.appendChild(c)}if(t.description){let c=document.createElement("p");c.className="canopy-description",c.textContent=t.description,y.appendChild(c)}this.container.appendChild(y)}let e=document.createElement("div");e.className="canopy-status",e.setAttribute("role","status"),this.statusEl=e;let i=document.createElement("form");i.className="canopy-form",i.addEventListener("submit",y=>this.handleSubmit(y)),t.fields.forEach(y=>{let{wrapper:c,input:s,errorEl:l}=this.createField(y);c&&i.appendChild(c),this.fieldElements.set(y.name,{input:s,errorEl:l})});let o=document.createElement("button");o.type="submit",o.className="canopy-submit",o.textContent=n.buttonText||"Submit";let u=getComputedStyle(this.container),f=u.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",a=u.getPropertyValue("--canopy-button-text").trim()||"#ffffff",m=u.getPropertyValue("--canopy-radius").trim()||"8px",b=u.getPropertyValue("--canopy-button-width").trim()||"100%";o.style.cssText=`
      display: block !important;
      width: ${b} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${m} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${f} !important;
      background-color: ${f} !important;
      color: ${a} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=o;let h=document.createElement("div");h.className="canopy-form-actions",h.appendChild(o),i.appendChild(h),this.container.appendChild(e),this.container.appendChild(i)}createField(t){let n=`${this.instanceId}-${t.name}`,e=document.createElement("div");e.className="canopy-field";let i=document.createElement("label");if(i.className="canopy-label",i.htmlFor=n,i.textContent=t.label||t.name,t.required){let a=document.createElement("span");a.className="canopy-required",a.textContent=" *",i.appendChild(a)}let o;switch(t.type){case"TEXTAREA":{let a=document.createElement("textarea");a.className="canopy-textarea";let m=T(t);if(m){let b=Math.min(Math.max(Math.ceil(m/60),4),15);a.rows=b}else a.rows=4;o=a;break}case"DROPDOWN":{let a=t.options,m=a&&typeof a=="object"&&"options"in a,b=m?a.options:Array.isArray(t.options)?t.options:[],h=m?a.defaultValue:void 0,y=m?a.allowOther:!1,c=document.createElement("select");if(c.className="canopy-select",b.forEach(s=>{let l=document.createElement("option");l.value=s.value,l.textContent=s.label,h&&s.value===h&&(l.selected=!0),c.appendChild(l)}),y){let s=document.createElement("option");s.value="__other__",s.textContent="Other",c.appendChild(s)}if(o=c,y){let s=document.createElement("input");s.type="text",s.className="canopy-input canopy-select-other",s.name=`${t.name}_other`,s.placeholder="Please specify...",s.style.setProperty("display","none","important"),s.style.marginTop="0.5rem",s.addEventListener("input",()=>{s.setCustomValidity("")}),c.addEventListener("change",()=>{c.value==="__other__"?(s.style.setProperty("display","block","important"),t.required&&(s.required=!0)):(s.style.setProperty("display","none","important"),s.required=!1,s.value="")}),c.__otherInput=s}break}case"CHECKBOX":{let a=document.createElement("label");a.className="canopy-checkbox";let m=document.createElement("input");m.type="checkbox",m.id=n,m.name=t.name,a.appendChild(m);let b=document.createElement("span");if(b.textContent=t.label||t.name,a.appendChild(b),e.appendChild(a),t.helpText){let y=document.createElement("p");y.className="canopy-help-text",y.textContent=t.helpText,e.appendChild(y)}let h=document.createElement("span");return h.className="canopy-error",h.id=`${n}-error`,e.appendChild(h),m.setAttribute("aria-describedby",h.id),m.setAttribute("aria-invalid","false"),{wrapper:e,input:m,errorEl:h}}case"CHECKBOXES":{let a=t.options,b=a&&typeof a=="object"&&"options"in a?a.options:Array.isArray(t.options)?t.options:[],h=document.createElement("div");h.className="canopy-checkboxes",h.setAttribute("data-checkbox-group",t.name),b.forEach(s=>{let l=document.createElement("label");l.className="canopy-checkbox";let p=document.createElement("input");p.type="checkbox",p.name=t.name,p.value=s.value,p.addEventListener("input",()=>{y.setCustomValidity("")});let d=document.createElement("span");d.textContent=s.label,l.appendChild(p),l.appendChild(d),h.appendChild(l)});let y=document.createElement("input");if(y.type="hidden",y.id=n,y.name=t.name,e.appendChild(i),e.appendChild(h),t.helpText){let s=document.createElement("p");s.className="canopy-help-text",s.textContent=t.helpText,e.appendChild(s)}let c=document.createElement("span");return c.className="canopy-error",c.id=`${n}-error`,e.appendChild(c),y.setAttribute("aria-describedby",c.id),y.setAttribute("aria-invalid","false"),{wrapper:e,input:y,errorEl:c}}case"EMAIL":{let a=document.createElement("input");a.type="email",a.className="canopy-input",o=a;break}case"PHONE":{let a=document.createElement("input");a.type="tel",a.setAttribute("inputmode","tel"),a.setAttribute("autocomplete","tel"),a.className="canopy-input",o=a;break}case"DATE":{let a=document.createElement("input");a.type="date",a.className="canopy-input";let m=t.validation;m&&(m.minDate&&(a.min=this.resolveDate(m.minDate)),m.maxDate&&(a.max=this.resolveDate(m.maxDate)),m.noFuture&&(a.max=new Date().toISOString().split("T")[0]),m.noPast&&(a.min=new Date().toISOString().split("T")[0])),o=a;break}case"NAME":return this.createNameField(t);default:{let a=document.createElement("input");a.type="text",a.className="canopy-input",o=a}}o.id=n,o.name=t.name,o.setAttribute("aria-invalid","false"),t.placeholder&&o.setAttribute("placeholder",t.placeholder);let u=T(t);u&&(o instanceof HTMLInputElement||o instanceof HTMLTextAreaElement)&&(o.maxLength=u),o.addEventListener("input",()=>{o.setCustomValidity("")});let f=document.createElement("span");if(f.className="canopy-error",f.id=`${n}-error`,o.setAttribute("aria-describedby",f.id),e.appendChild(i),e.appendChild(o),o.__otherInput&&e.appendChild(o.__otherInput),t.helpText){let a=document.createElement("p");a.className="canopy-help-text",a.textContent=t.helpText,e.appendChild(a)}return e.appendChild(f),{wrapper:e,input:o,errorEl:f}}resolveDate(t){return t==="today"?new Date().toISOString().split("T")[0]:t}createNameField(t){let n=`${this.instanceId}-${t.name}`,e=document.createElement("div");e.className="canopy-field canopy-name-group";let i=document.createElement("label");if(i.className="canopy-label",i.textContent=t.label||t.name,t.required){let c=document.createElement("span");c.className="canopy-required",c.textContent=" *",i.appendChild(c)}e.appendChild(i);let o=t.options||{parts:["first","last"]},u=o.parts||["first","last"],f=o.partLabels||{},a=o.partsRequired||{},m={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},b=document.createElement("div");b.className="canopy-name-parts";let h=document.createElement("input");h.type="hidden",h.id=n,h.name=t.name;let y=document.createElement("span");if(y.className="canopy-error",y.id=`${n}-error`,u.forEach(c=>{let s=document.createElement("div");s.className="canopy-name-part";let l=document.createElement("label");l.className="canopy-name-part-label";let p=`${n}-${c}`;if(l.htmlFor=p,l.textContent=f[c]||m[c]||c,t.required||a[c]){let g=document.createElement("span");g.className="canopy-required",g.textContent=" *",l.appendChild(g)}let d=document.createElement("input");d.type="text",d.className="canopy-input",d.id=p,d.name=`${t.name}.${c}`,d.setAttribute("data-name-part",c),d.setAttribute("data-name-field",t.name),d.addEventListener("input",()=>{d.setCustomValidity("")}),s.appendChild(l),s.appendChild(d),b.appendChild(s)}),e.appendChild(b),t.helpText){let c=document.createElement("p");c.className="canopy-help-text",c.textContent=t.helpText,e.appendChild(c)}return e.appendChild(y),{wrapper:e,input:h,errorEl:y}}collectValues(){let t={};return this.fieldElements.forEach((n,e)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")t[e]=n.input.checked;else if(n.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${e}"]`);if(i){let o=[];i.querySelectorAll("input[type=checkbox]:checked").forEach(u=>{o.push(u.value)}),t[e]=o}else{let o=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(o.length>0){let u={};o.forEach(f=>{let a=f,m=a.getAttribute("data-name-part");m&&(u[m]=a.value)}),t[e]=u}else t[e]=n.input.value}}else t[e]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?t[e]=n.input.__otherInput.value:t[e]=n.input.value}),t}showErrors(t){this.fieldElements.forEach((e,i)=>{let o=t[i]||"";if(e.input.type==="hidden"){let u=this.container.querySelector(`[data-checkbox-group="${i}"]`);if(u){let f=u.querySelector("input[type=checkbox]");f&&f.setCustomValidity(o)}else{let f=this.container.querySelector(`input[data-name-field="${i}"]`);f&&f.setCustomValidity(o)}}else e.input.setCustomValidity(o);e.errorEl.textContent=o,e.input.setAttribute("aria-invalid",o?"true":"false")});let n=Object.keys(t);if(n.length>0){let e=this.fieldElements.get(n[0]);if(e)if(e.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(i){let o=i.querySelector("input[type=checkbox]");o&&(o.reportValidity(),o.focus())}else{let o=this.container.querySelector(`input[data-name-field="${n[0]}"]`);o&&(o.reportValidity(),o.focus())}}else e.input.reportValidity(),e.input.focus()}}setStatus(t,n){this.statusEl&&(this.statusEl.textContent=t,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(t){var i,o;if(t.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach(u=>{u.input.setCustomValidity("")});let n=this.collectValues(),e=N(this.formDefinition.fields,n);if(this.showErrors(e),Object.keys(e).length>0){let u=Object.keys(e).length;this.setStatus(`Please fix ${u} field${u>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let u=this.options.baseUrl||"",f=await fetch(`${u}/api/embed/${this.options.formId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),a=await f.json();if(!f.ok){a!=null&&a.fields&&this.showErrors(a.fields),this.setStatus((a==null?void 0:a.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}this.setStatus(this.formDefinition.successMessage||"Thanks for your submission!","success"),t.target.reset()}catch(u){console.error(u),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let u=((o=(i=this.formDefinition)==null?void 0:i.defaultTheme)==null?void 0:o.buttonText)||"Submit";this.submitButton.textContent=u,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderError(t){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=t,this.container.appendChild(n)}};var M=`
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
  font-weight: var(--canopy-label-weight, 500);
  text-transform: var(--canopy-label-transform, none);
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

.canopy-checkboxes {
  display: flex;
  flex-direction: column;
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
  font-size: var(--canopy-title-size, 1.25em);
  font-weight: var(--canopy-title-weight, 600);
  color: var(--canopy-title-color, var(--canopy-text, #18181b));
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
`;var O="canopy-embed-styles";function B(){if(document.getElementById(O))return;let r=document.createElement("style");r.id=O,r.textContent=M,document.head.appendChild(r)}function _(r){var t;return r.dataset.baseUrl||((t=document.querySelector("script[data-base-url]"))==null?void 0:t.getAttribute("data-base-url"))||""}function U(r){let t=r.dataset.theme;if(t)try{return JSON.parse(t)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function F(){B(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(t=>{if(t.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=t.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}t.dataset.canopyInitialized="true";let e=U(t),i=_(t);new w(t,{formId:n,themeOverrides:e,baseUrl:i}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",F):F();window.CanopyForms={init:F};})();
