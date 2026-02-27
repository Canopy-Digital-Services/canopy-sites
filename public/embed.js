"use strict";(()=>{var x={fontSize:14,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:8,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:"md",titleWeight:"semibold",titleColor:void 0,labelWeight:"medium",labelTransform:"none",bodyFont:void 0,headingFont:void 0,fontUrl:void 0,fontFamily:void 0,buttonText:void 0},C=new Set;function v(r,t){if(!r)return t;let n=r.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:t:t}function k(r,t){return{...x,...r!=null?r:{},...t!=null?t:{}}}function z(r){let t=/^#?([0-9a-f]{6})$/i.exec(r.trim());if(!t)return null;let n=parseInt(t[1],16);return[n>>16&255,n>>8&255,n&255]}function H(r,t,n){let[e,i,a]=[r,t,n].map(d=>{let h=d/255;return h<=.03928?h/12.92:Math.pow((h+.055)/1.055,2.4)});return .2126*e+.7152*i+.0722*a}function P(r){try{let t=z(r);return t&&H(...t)>.179?"#18181b":"#ffffff"}catch(t){return"#ffffff"}}function $(r,t){var l,b,f,y,c;let n=L(t.bodyFont,t.fontFamily);r.style.setProperty("--canopy-font",n);let e=L(t.headingFont);r.style.setProperty("--canopy-heading-font",e==="inherit"?"var(--canopy-font)":e),r.style.setProperty("--canopy-font-size",`${(l=t.fontSize)!=null?l:x.fontSize}px`),r.style.setProperty("--canopy-text",v(t.text,x.text)),r.style.setProperty("--canopy-bg",v(t.background,x.background)),r.style.setProperty("--canopy-field-bg",v(t.fieldBackground,x.fieldBackground));let i=v(t.primary,x.primary);r.style.setProperty("--canopy-primary",i),r.style.setProperty("--canopy-button-text",P(i)),r.style.setProperty("--canopy-border",v(t.border,x.border)),r.style.setProperty("--canopy-radius",`${(b=t.radius)!=null?b:x.radius}px`),r.style.setProperty("--canopy-button-width",t.buttonWidth==="auto"?"auto":"100%"),r.style.setProperty("--canopy-button-align",t.buttonAlign||x.buttonAlign);let a={sm:"1em",md:"1.25em",lg:"1.5em",xl:"1.875em"};r.style.setProperty("--canopy-title-size",a[(f=t.titleSize)!=null?f:"md"]);let d={normal:"400",semibold:"600",bold:"700"};r.style.setProperty("--canopy-title-weight",d[(y=t.titleWeight)!=null?y:"semibold"]);let h=t.titleColor?v(t.titleColor,""):"";h?r.style.setProperty("--canopy-title-color",h):r.style.removeProperty("--canopy-title-color");let o={normal:"400",medium:"500",semibold:"600"};r.style.setProperty("--canopy-label-weight",o[(c=t.labelWeight)!=null?c:"medium"]),r.style.setProperty("--canopy-label-transform",t.labelTransform==="uppercase"?"uppercase":"none")}function S(r){switch(r.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function L(r,t){return r&&r!=="inherit"?`'${r}', sans-serif`:t&&t!=="inherit"?t:"inherit"}function A(r){let t=r.filter(a=>!!a&&a!=="inherit"&&!C.has(a));if(t.length===0)return;let e=`https://fonts.googleapis.com/css2?${t.map(a=>`family=${encodeURIComponent(a)}:wght@400;500;600;700`).join("&")}&display=swap`,i=document.createElement("link");i.rel="stylesheet",i.href=e,i.dataset.canopyFont="true",document.head.appendChild(i),t.forEach(a=>C.add(a))}function N(r){if(!r||C.has(r))return;let t=document.createElement("link");t.rel="stylesheet",t.href=r,t.dataset.canopyFont="true",document.head.appendChild(t),C.add(r)}var R={TEXT:200,EMAIL:254,TEXTAREA:2e3};function T(r){var t;return(t=r.validation)!=null&&t.maxLength?r.validation.maxLength:R[r.type]}function q(r){return r.label||r.name}function D(r,t){let n={};return r.forEach(e=>{var o,l,b,f,y,c;let i=t[e.name],a=q(e);if(e.required){if(e.type==="CHECKBOX"){if(!i){n[e.name]=`${a} is required.`;return}}else if(e.type==="CHECKBOXES"){if(!Array.isArray(i)||i.length===0){n[e.name]=`${a} is required.`;return}}else if(e.type!=="NAME"){if(i==null||String(i).trim()===""){n[e.name]=`${a} is required.`;return}}}if(e.type==="CHECKBOXES"){if(Array.isArray(i)&&i.length>0){let s=e.options,u=s&&typeof s=="object"&&"options"in s?s.options.map(m=>m.value):[];for(let m of i)if(!u.includes(String(m))){n[e.name]=`${a} contains an invalid option.`;return}}return}if(e.type!=="NAME"){if(i==null||String(i).trim()==="")return}if(e.type==="EMAIL"){let s=String(i);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(s)){n[e.name]="Enter a valid email address";return}let u=(o=e.validation)==null?void 0:o.domainRules;if(u){let m=(l=s.split("@")[1])==null?void 0:l.toLowerCase();if(u.allow&&u.allow.length>0&&!u.allow.map(E=>E.toLowerCase()).includes(m)){n[e.name]=`${a} must be from an allowed domain.`;return}if(u.block&&u.block.length>0&&u.block.map(E=>E.toLowerCase()).includes(m)){n[e.name]=`${a} domain is not allowed.`;return}}}if(e.type==="PHONE"){let s=String(i),p=((b=e.validation)==null?void 0:b.format)||"lenient";if(p==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(s)){n[e.name]=`${a} must be a valid phone number.`;return}}else if(p==="strict"){let u=s.replace(/[^\d+]/g,"");if(u.startsWith("+1"))u=u.substring(2);else if(u.startsWith("+")){n[e.name]=`${a} must be a valid US phone number (10 digits).`;return}else u.startsWith("1")&&u.length===11&&(u=u.substring(1));if(!/^\d{10}$/.test(u)){n[e.name]=`${a} must be a valid US phone number (10 digits).`;return}}return}if(e.type==="DATE"){let s=String(i),p=new Date(s);if(isNaN(p.getTime())){n[e.name]=`${a} must be a valid date.`;return}let u=new Date;u.setHours(0,0,0,0),p.setHours(0,0,0,0);let m=e.validation;if(m!=null&&m.noFuture&&p>u){n[e.name]=`${a} cannot be a future date.`;return}if(m!=null&&m.noPast&&p<u){n[e.name]=`${a} cannot be a past date.`;return}if(m!=null&&m.minDate){let g=new Date(m.minDate==="today"?u:m.minDate);if(g.setHours(0,0,0,0),p<g){n[e.name]=`${a} must be on or after ${g.toLocaleDateString()}.`;return}}if(m!=null&&m.maxDate){let g=new Date(m.maxDate==="today"?u:m.maxDate);if(g.setHours(0,0,0,0),p>g){n[e.name]=`${a} must be on or before ${g.toLocaleDateString()}.`;return}}}if(e.type==="NAME"){let s=i,p=e.options||{parts:["first","last"]},u=p.parts||["first","last"],m=p.partsRequired||{};for(let g of u){let E=s[g];if((e.required||m[g])&&(!E||E.trim()==="")){let I=((f=p.partLabels)==null?void 0:f[g])||g;n[e.name]=`${I} is required.`;return}}return}if(e.type==="DROPDOWN"&&Array.isArray(e.options)&&!e.options.map(p=>p.value).includes(String(i))){n[e.name]=`${a} must be a valid option.`;return}let d=String(i),h=T(e);if((y=e.validation)!=null&&y.minLength&&d.length<e.validation.minLength){n[e.name]=`${a} must be at least ${e.validation.minLength} characters.`;return}if(h&&d.length>h){n[e.name]=`${a} must be at most ${h} characters.`;return}if(e.type==="TEXT"||e.type==="TEXTAREA"){let s=(c=e.validation)==null?void 0:c.format;if(s&&s!=="alphanumeric"){let p=!0,u=`${a} is invalid.`;switch(s){case"numbers":p=/^\d+$/.test(d),u=`${a} must contain only numbers.`;break;case"letters":p=/^[A-Za-z]+$/.test(d),u=`${a} must contain only letters.`;break;case"url":{let m=d.startsWith("http")?d:`https://${d}`;try{p=new URL(m).hostname.includes(".")}catch(g){p=!1}u=`${a} must be a valid URL.`;break}case"postal-us":p=/^\d{5}(-\d{4})?$/.test(d),u=`${a} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":p=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(d),u=`${a} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}p||(n[e.name]=u)}}}),n}var V=0,w=class{constructor(t,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.submitButton=null;this.instanceId=`canopy-${V++}`;this.container=t,this.options=n}async init(){try{this.container.classList.add("canopy-root");let t=await this.fetchDefinition();this.formDefinition=t,this.render(t)}catch(t){console.error(t),this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){let t=this.options.baseUrl||"",n=await fetch(`${t}/api/embed/${this.options.formId}`,{method:"GET",credentials:"omit"});if(!n.ok)throw new Error("Failed to load form definition");return n.json()}render(t){this.container.innerHTML="",this.fieldElements.clear();let n=k(t.defaultTheme,this.options.themeOverrides);if($(this.container,n),A([n.bodyFont,n.headingFont]),!n.bodyFont&&!n.headingFont&&N(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(S(n)),!t.fields||t.fields.length===0){this.renderError("This form is not configured yet.");return}if(t.title||t.description){let y=document.createElement("div");if(y.className="canopy-header",t.title){let c=document.createElement("h2");c.className="canopy-title",c.textContent=t.title,y.appendChild(c)}if(t.description){let c=document.createElement("p");c.className="canopy-description",c.textContent=t.description,y.appendChild(c)}this.container.appendChild(y)}let e=document.createElement("div");e.className="canopy-status",e.setAttribute("role","status"),this.statusEl=e;let i=document.createElement("form");i.className="canopy-form",i.addEventListener("submit",y=>this.handleSubmit(y)),t.fields.forEach(y=>{let{wrapper:c,input:s,errorEl:p}=this.createField(y);c&&i.appendChild(c),this.fieldElements.set(y.name,{input:s,errorEl:p})});let a=document.createElement("button");a.type="submit",a.className="canopy-submit",a.textContent=n.buttonText||"Submit";let d=getComputedStyle(this.container),h=d.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",o=d.getPropertyValue("--canopy-button-text").trim()||"#ffffff",l=d.getPropertyValue("--canopy-radius").trim()||"8px",b=d.getPropertyValue("--canopy-button-width").trim()||"100%";a.style.cssText=`
      display: block !important;
      width: ${b} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${l} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${h} !important;
      background-color: ${h} !important;
      color: ${o} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=a;let f=document.createElement("div");f.className="canopy-form-actions",f.appendChild(a),i.appendChild(f),this.container.appendChild(e),this.container.appendChild(i)}createField(t){let n=`${this.instanceId}-${t.name}`;if(t.type==="HIDDEN"){let o=document.createElement("input");o.type="hidden",o.name=t.name,o.id=n;let l=t.options;if(l&&typeof l=="object"&&"valueSource"in l){let f=l.valueSource;if(f==="static")o.value=l.staticValue||"";else if(f==="urlParam"){let y=l.paramName;if(y){let c=new URLSearchParams(window.location.search);o.value=c.get(y)||""}}else f==="pageUrl"?o.value=window.location.href:f==="referrer"&&(o.value=document.referrer)}let b=document.createElement("span");return{wrapper:null,input:o,errorEl:b}}let e=document.createElement("div");e.className="canopy-field";let i=document.createElement("label");if(i.className="canopy-label",i.htmlFor=n,i.textContent=t.label||t.name,t.required){let o=document.createElement("span");o.className="canopy-required",o.textContent=" *",i.appendChild(o)}let a;switch(t.type){case"TEXTAREA":{let o=document.createElement("textarea");o.className="canopy-textarea";let l=T(t);if(l){let b=Math.min(Math.max(Math.ceil(l/60),4),15);o.rows=b}else o.rows=4;a=o;break}case"DROPDOWN":{let o=t.options,l=o&&typeof o=="object"&&"options"in o,b=l?o.options:Array.isArray(t.options)?t.options:[],f=l?o.defaultValue:void 0,y=l?o.allowOther:!1,c=document.createElement("select");if(c.className="canopy-select",b.forEach(s=>{let p=document.createElement("option");p.value=s.value,p.textContent=s.label,f&&s.value===f&&(p.selected=!0),c.appendChild(p)}),y){let s=document.createElement("option");s.value="__other__",s.textContent="Other",c.appendChild(s)}if(a=c,y){let s=document.createElement("input");s.type="text",s.className="canopy-input canopy-select-other",s.name=`${t.name}_other`,s.placeholder="Please specify...",s.style.setProperty("display","none","important"),s.style.marginTop="0.5rem",s.addEventListener("input",()=>{s.setCustomValidity("")}),c.addEventListener("change",()=>{c.value==="__other__"?(s.style.setProperty("display","block","important"),t.required&&(s.required=!0)):(s.style.setProperty("display","none","important"),s.required=!1,s.value="")}),c.__otherInput=s}break}case"CHECKBOX":{let o=document.createElement("label");o.className="canopy-checkbox";let l=document.createElement("input");l.type="checkbox",l.id=n,l.name=t.name,o.appendChild(l);let b=document.createElement("span");if(b.textContent=t.label||t.name,o.appendChild(b),e.appendChild(o),t.helpText){let y=document.createElement("p");y.className="canopy-help-text",y.textContent=t.helpText,e.appendChild(y)}let f=document.createElement("span");return f.className="canopy-error",f.id=`${n}-error`,e.appendChild(f),l.setAttribute("aria-describedby",f.id),l.setAttribute("aria-invalid","false"),{wrapper:e,input:l,errorEl:f}}case"CHECKBOXES":{let o=t.options,b=o&&typeof o=="object"&&"options"in o?o.options:Array.isArray(t.options)?t.options:[],f=document.createElement("div");f.className="canopy-checkboxes",f.setAttribute("data-checkbox-group",t.name),b.forEach(s=>{let p=document.createElement("label");p.className="canopy-checkbox";let u=document.createElement("input");u.type="checkbox",u.name=t.name,u.value=s.value,u.addEventListener("input",()=>{y.setCustomValidity("")});let m=document.createElement("span");m.textContent=s.label,p.appendChild(u),p.appendChild(m),f.appendChild(p)});let y=document.createElement("input");if(y.type="hidden",y.id=n,y.name=t.name,e.appendChild(i),e.appendChild(f),t.helpText){let s=document.createElement("p");s.className="canopy-help-text",s.textContent=t.helpText,e.appendChild(s)}let c=document.createElement("span");return c.className="canopy-error",c.id=`${n}-error`,e.appendChild(c),y.setAttribute("aria-describedby",c.id),y.setAttribute("aria-invalid","false"),{wrapper:e,input:y,errorEl:c}}case"EMAIL":{let o=document.createElement("input");o.type="email",o.className="canopy-input",a=o;break}case"PHONE":{let o=document.createElement("input");o.type="tel",o.setAttribute("inputmode","tel"),o.setAttribute("autocomplete","tel"),o.className="canopy-input",a=o;break}case"DATE":{let o=document.createElement("input");o.type="date",o.className="canopy-input";let l=t.validation;l&&(l.minDate&&(o.min=this.resolveDate(l.minDate)),l.maxDate&&(o.max=this.resolveDate(l.maxDate)),l.noFuture&&(o.max=new Date().toISOString().split("T")[0]),l.noPast&&(o.min=new Date().toISOString().split("T")[0])),a=o;break}case"NAME":return this.createNameField(t);default:{let o=document.createElement("input");o.type="text",o.className="canopy-input",a=o}}a.id=n,a.name=t.name,a.setAttribute("aria-invalid","false"),t.placeholder&&a.setAttribute("placeholder",t.placeholder);let d=T(t);d&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=d),a.addEventListener("input",()=>{a.setCustomValidity("")});let h=document.createElement("span");if(h.className="canopy-error",h.id=`${n}-error`,a.setAttribute("aria-describedby",h.id),e.appendChild(i),e.appendChild(a),a.__otherInput&&e.appendChild(a.__otherInput),t.helpText){let o=document.createElement("p");o.className="canopy-help-text",o.textContent=t.helpText,e.appendChild(o)}return e.appendChild(h),{wrapper:e,input:a,errorEl:h}}resolveDate(t){return t==="today"?new Date().toISOString().split("T")[0]:t}createNameField(t){let n=`${this.instanceId}-${t.name}`,e=document.createElement("div");e.className="canopy-field canopy-name-group";let i=document.createElement("label");if(i.className="canopy-label",i.textContent=t.label||t.name,t.required){let c=document.createElement("span");c.className="canopy-required",c.textContent=" *",i.appendChild(c)}e.appendChild(i);let a=t.options||{parts:["first","last"]},d=a.parts||["first","last"],h=a.partLabels||{},o=a.partsRequired||{},l={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},b=document.createElement("div");b.className="canopy-name-parts";let f=document.createElement("input");f.type="hidden",f.id=n,f.name=t.name;let y=document.createElement("span");if(y.className="canopy-error",y.id=`${n}-error`,d.forEach(c=>{let s=document.createElement("div");s.className="canopy-name-part";let p=document.createElement("label");p.className="canopy-name-part-label";let u=`${n}-${c}`;if(p.htmlFor=u,p.textContent=h[c]||l[c]||c,t.required||o[c]){let g=document.createElement("span");g.className="canopy-required",g.textContent=" *",p.appendChild(g)}let m=document.createElement("input");m.type="text",m.className="canopy-input",m.id=u,m.name=`${t.name}.${c}`,m.setAttribute("data-name-part",c),m.setAttribute("data-name-field",t.name),m.addEventListener("input",()=>{m.setCustomValidity("")}),s.appendChild(p),s.appendChild(m),b.appendChild(s)}),e.appendChild(b),t.helpText){let c=document.createElement("p");c.className="canopy-help-text",c.textContent=t.helpText,e.appendChild(c)}return e.appendChild(y),{wrapper:e,input:f,errorEl:y}}collectValues(){let t={};return this.fieldElements.forEach((n,e)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")t[e]=n.input.checked;else if(n.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${e}"]`);if(i){let a=[];i.querySelectorAll("input[type=checkbox]:checked").forEach(d=>{a.push(d.value)}),t[e]=a}else{let a=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(a.length>0){let d={};a.forEach(h=>{let o=h,l=o.getAttribute("data-name-part");l&&(d[l]=o.value)}),t[e]=d}else t[e]=n.input.value}}else t[e]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?t[e]=n.input.__otherInput.value:t[e]=n.input.value}),t}showErrors(t){this.fieldElements.forEach((e,i)=>{let a=t[i]||"";if(e.input.type==="hidden"){let d=this.container.querySelector(`[data-checkbox-group="${i}"]`);if(d){let h=d.querySelector("input[type=checkbox]");h&&h.setCustomValidity(a)}else{let h=this.container.querySelector(`input[data-name-field="${i}"]`);h&&h.setCustomValidity(a)}}else e.input.setCustomValidity(a);e.errorEl.textContent=a,e.input.setAttribute("aria-invalid",a?"true":"false")});let n=Object.keys(t);if(n.length>0){let e=this.fieldElements.get(n[0]);if(e)if(e.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(i){let a=i.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.container.querySelector(`input[data-name-field="${n[0]}"]`);a&&(a.reportValidity(),a.focus())}}else e.input.reportValidity(),e.input.focus()}}setStatus(t,n){this.statusEl&&(this.statusEl.textContent=t,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(t){var i,a;if(t.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach(d=>{d.input.setCustomValidity("")});let n=this.collectValues(),e=D(this.formDefinition.fields,n);if(this.showErrors(e),Object.keys(e).length>0){let d=Object.keys(e).length;this.setStatus(`Please fix ${d} field${d>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let d=this.options.baseUrl||"",h=await fetch(`${d}/api/embed/${this.options.formId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),o=await h.json();if(!h.ok){o!=null&&o.fields&&this.showErrors(o.fields),this.setStatus((o==null?void 0:o.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}this.setStatus(this.formDefinition.successMessage||"Thanks for your submission!","success"),t.target.reset()}catch(d){console.error(d),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let d=((a=(i=this.formDefinition)==null?void 0:i.defaultTheme)==null?void 0:a.buttonText)||"Submit";this.submitButton.textContent=d,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderError(t){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=t,this.container.appendChild(n)}};var M=`
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
