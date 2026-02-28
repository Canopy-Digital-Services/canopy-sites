"use strict";(()=>{var x={fontSize:14,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:8,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:"md",titleWeight:"semibold",titleColor:void 0,labelWeight:"medium",labelTransform:"none",bodyFont:void 0,headingFont:void 0,fontUrl:void 0,fontFamily:void 0,buttonText:void 0},C=new Set;function v(r,t){if(!r)return t;let n=r.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:t:t}function k(r,t){return{...x,...r!=null?r:{},...t!=null?t:{}}}function z(r){let t=/^#?([0-9a-f]{6})$/i.exec(r.trim());if(!t)return null;let n=parseInt(t[1],16);return[n>>16&255,n>>8&255,n&255]}function H(r,t,n){let[e,i,o]=[r,t,n].map(d=>{let f=d/255;return f<=.03928?f/12.92:Math.pow((f+.055)/1.055,2.4)});return .2126*e+.7152*i+.0722*o}function P(r){try{let t=z(r);return t&&H(...t)>.179?"#18181b":"#ffffff"}catch(t){return"#ffffff"}}function L(r,t){var p,b,h,y,l;let n=$(t.bodyFont,t.fontFamily);r.style.setProperty("--canopy-font",n);let e=$(t.headingFont);r.style.setProperty("--canopy-heading-font",e==="inherit"?"var(--canopy-font)":e),r.style.setProperty("--canopy-font-size",`${(p=t.fontSize)!=null?p:x.fontSize}px`),r.style.setProperty("--canopy-text",v(t.text,x.text)),r.style.setProperty("--canopy-bg",v(t.background,x.background)),r.style.setProperty("--canopy-field-bg",v(t.fieldBackground,x.fieldBackground));let i=v(t.primary,x.primary);r.style.setProperty("--canopy-primary",i),r.style.setProperty("--canopy-button-text",P(i)),r.style.setProperty("--canopy-border",v(t.border,x.border)),r.style.setProperty("--canopy-radius",`${(b=t.radius)!=null?b:x.radius}px`),r.style.setProperty("--canopy-button-width",t.buttonWidth==="auto"?"auto":"100%"),r.style.setProperty("--canopy-button-align",t.buttonAlign||x.buttonAlign);let o={sm:"1em",md:"1.25em",lg:"1.5em",xl:"1.875em"};r.style.setProperty("--canopy-title-size",o[(h=t.titleSize)!=null?h:"md"]);let d={normal:"400",semibold:"600",bold:"700"};r.style.setProperty("--canopy-title-weight",d[(y=t.titleWeight)!=null?y:"semibold"]);let f=t.titleColor?v(t.titleColor,""):"";f?r.style.setProperty("--canopy-title-color",f):r.style.removeProperty("--canopy-title-color");let a={normal:"400",medium:"500",semibold:"600"};r.style.setProperty("--canopy-label-weight",a[(l=t.labelWeight)!=null?l:"medium"]),r.style.setProperty("--canopy-label-transform",t.labelTransform==="uppercase"?"uppercase":"none")}function A(r){switch(r.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function $(r,t){return r&&r!=="inherit"?`'${r}', sans-serif`:t&&t!=="inherit"?t:"inherit"}function S(r){let t=r.filter(o=>!!o&&o!=="inherit"&&!C.has(o));if(t.length===0)return;let e=`https://fonts.googleapis.com/css2?${t.map(o=>`family=${encodeURIComponent(o)}:wght@400;500;600;700`).join("&")}&display=swap`,i=document.createElement("link");i.rel="stylesheet",i.href=e,i.dataset.canopyFont="true",document.head.appendChild(i),t.forEach(o=>C.add(o))}function N(r){if(!r||C.has(r))return;let t=document.createElement("link");t.rel="stylesheet",t.href=r,t.dataset.canopyFont="true",document.head.appendChild(t),C.add(r)}var R={TEXT:200,EMAIL:254,TEXTAREA:2e3};function T(r){var t;return(t=r.validation)!=null&&t.maxLength?r.validation.maxLength:R[r.type]}function q(r){return r.label||r.name}function D(r,t){let n={};return r.forEach(e=>{var a,p,b,h,y,l;let i=t[e.name],o=q(e);if(e.required){if(e.type==="CHECKBOX"){if(!i){n[e.name]=`${o} is required.`;return}}else if(e.type==="CHECKBOXES"){if(!Array.isArray(i)||i.length===0){n[e.name]=`${o} is required.`;return}}else if(e.type!=="NAME"){if(i==null||String(i).trim()===""){n[e.name]=`${o} is required.`;return}}}if(e.type==="CHECKBOXES"){if(Array.isArray(i)&&i.length>0){let s=e.options,u=s&&typeof s=="object"&&"options"in s?s.options.map(m=>m.value):[];for(let m of i)if(!u.includes(String(m))){n[e.name]=`${o} contains an invalid option.`;return}}return}if(e.type!=="NAME"){if(i==null||String(i).trim()==="")return}if(e.type==="EMAIL"){let s=String(i);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(s)){n[e.name]="Enter a valid email address";return}let u=(a=e.validation)==null?void 0:a.domainRules;if(u){let m=(p=s.split("@")[1])==null?void 0:p.toLowerCase();if(u.allow&&u.allow.length>0&&!u.allow.map(E=>E.toLowerCase()).includes(m)){n[e.name]=`${o} must be from an allowed domain.`;return}if(u.block&&u.block.length>0&&u.block.map(E=>E.toLowerCase()).includes(m)){n[e.name]=`${o} domain is not allowed.`;return}}}if(e.type==="PHONE"){let s=String(i),c=((b=e.validation)==null?void 0:b.format)||"lenient";if(c==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(s)){n[e.name]=`${o} must be a valid phone number.`;return}}else if(c==="strict"){let u=s.replace(/[^\d+]/g,"");if(u.startsWith("+1"))u=u.substring(2);else if(u.startsWith("+")){n[e.name]=`${o} must be a valid US phone number (10 digits).`;return}else u.startsWith("1")&&u.length===11&&(u=u.substring(1));if(!/^\d{10}$/.test(u)){n[e.name]=`${o} must be a valid US phone number (10 digits).`;return}}return}if(e.type==="DATE"){let s=String(i),c=new Date(s);if(isNaN(c.getTime())){n[e.name]=`${o} must be a valid date.`;return}let u=new Date;u.setHours(0,0,0,0),c.setHours(0,0,0,0);let m=e.validation;if(m!=null&&m.noFuture&&c>u){n[e.name]=`${o} cannot be a future date.`;return}if(m!=null&&m.noPast&&c<u){n[e.name]=`${o} cannot be a past date.`;return}if(m!=null&&m.minDate){let g=new Date(m.minDate==="today"?u:m.minDate);if(g.setHours(0,0,0,0),c<g){n[e.name]=`${o} must be on or after ${g.toLocaleDateString()}.`;return}}if(m!=null&&m.maxDate){let g=new Date(m.maxDate==="today"?u:m.maxDate);if(g.setHours(0,0,0,0),c>g){n[e.name]=`${o} must be on or before ${g.toLocaleDateString()}.`;return}}}if(e.type==="NUMBER"){let s=Number(i);if(isNaN(s)){n[e.name]=`${o} must be a number.`;return}let c=e.validation;if(c!=null&&c.integer&&!Number.isInteger(s)){n[e.name]=`${o} must be a whole number.`;return}if((c==null?void 0:c.min)!==void 0&&s<c.min){n[e.name]=`${o} must be at least ${c.min}.`;return}if((c==null?void 0:c.max)!==void 0&&s>c.max){n[e.name]=`${o} must be at most ${c.max}.`;return}return}if(e.type==="NAME"){let s=i,c=e.options||{parts:["first","last"]},u=c.parts||["first","last"],m=c.partsRequired||{};for(let g of u){let E=s[g];if((e.required||m[g])&&(!E||E.trim()==="")){let I=((h=c.partLabels)==null?void 0:h[g])||g;n[e.name]=`${I} is required.`;return}}return}if(e.type==="DROPDOWN"&&Array.isArray(e.options)&&!e.options.map(c=>c.value).includes(String(i))){n[e.name]=`${o} must be a valid option.`;return}let d=String(i),f=T(e);if((y=e.validation)!=null&&y.minLength&&d.length<e.validation.minLength){n[e.name]=`${o} must be at least ${e.validation.minLength} characters.`;return}if(f&&d.length>f){n[e.name]=`${o} must be at most ${f} characters.`;return}if(e.type==="TEXT"||e.type==="TEXTAREA"){let s=(l=e.validation)==null?void 0:l.format;if(s&&s!=="alphanumeric"){let c=!0,u=`${o} is invalid.`;switch(s){case"numbers":c=/^\d+$/.test(d),u=`${o} must contain only numbers.`;break;case"letters":c=/^[A-Za-z]+$/.test(d),u=`${o} must contain only letters.`;break;case"url":{let m=d.startsWith("http")?d:`https://${d}`;try{c=new URL(m).hostname.includes(".")}catch(g){c=!1}u=`${o} must be a valid URL.`;break}case"postal-us":c=/^\d{5}(-\d{4})?$/.test(d),u=`${o} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":c=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(d),u=`${o} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}c||(n[e.name]=u)}}}),n}var B=0,w=class{constructor(t,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.submitButton=null;this.instanceId=`canopy-${B++}`;this.container=t,this.options=n}async init(){try{this.container.classList.add("canopy-root");let t=await this.fetchDefinition();this.formDefinition=t,this.render(t)}catch(t){console.error(t),this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){let t=this.options.baseUrl||"",n=await fetch(`${t}/api/embed/${this.options.formId}`,{method:"GET",credentials:"omit"});if(!n.ok)throw new Error("Failed to load form definition");return n.json()}render(t){this.container.innerHTML="",this.fieldElements.clear();let n=k(t.defaultTheme,this.options.themeOverrides);if(L(this.container,n),S([n.bodyFont,n.headingFont]),!n.bodyFont&&!n.headingFont&&N(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(A(n)),!t.fields||t.fields.length===0){this.renderError("This form is not configured yet.");return}if(t.title||t.description){let y=document.createElement("div");if(y.className="canopy-header",t.title){let l=document.createElement("h2");l.className="canopy-title",l.textContent=t.title,y.appendChild(l)}if(t.description){let l=document.createElement("p");l.className="canopy-description",l.textContent=t.description,y.appendChild(l)}this.container.appendChild(y)}let e=document.createElement("div");e.className="canopy-status",e.setAttribute("role","status"),this.statusEl=e;let i=document.createElement("form");i.className="canopy-form",i.addEventListener("submit",y=>this.handleSubmit(y)),t.fields.forEach(y=>{let{wrapper:l,input:s,errorEl:c}=this.createField(y);l&&i.appendChild(l),this.fieldElements.set(y.name,{input:s,errorEl:c})});let o=document.createElement("button");o.type="submit",o.className="canopy-submit",o.textContent=n.buttonText||"Submit";let d=getComputedStyle(this.container),f=d.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",a=d.getPropertyValue("--canopy-button-text").trim()||"#ffffff",p=d.getPropertyValue("--canopy-radius").trim()||"8px",b=d.getPropertyValue("--canopy-button-width").trim()||"100%";o.style.cssText=`
      display: block !important;
      width: ${b} !important;
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
    `,this.submitButton=o;let h=document.createElement("div");h.className="canopy-form-actions",h.appendChild(o),i.appendChild(h),this.container.appendChild(e),this.container.appendChild(i)}createField(t){let n=`${this.instanceId}-${t.name}`,e=document.createElement("div");e.className="canopy-field";let i=document.createElement("label");if(i.className="canopy-label",i.htmlFor=n,i.textContent=t.label||t.name,t.required){let a=document.createElement("span");a.className="canopy-required",a.textContent=" *",i.appendChild(a)}let o;switch(t.type){case"TEXTAREA":{let a=document.createElement("textarea");a.className="canopy-textarea";let p=T(t);if(p){let b=Math.min(Math.max(Math.ceil(p/60),4),15);a.rows=b}else a.rows=4;o=a;break}case"DROPDOWN":{let a=t.options,p=a&&typeof a=="object"&&"options"in a,b=p?a.options:Array.isArray(t.options)?t.options:[],h=p?a.defaultValue:void 0,y=p?a.allowOther:!1,l=document.createElement("select");if(l.className="canopy-select",b.forEach(s=>{let c=document.createElement("option");c.value=s.value,c.textContent=s.label,h&&s.value===h&&(c.selected=!0),l.appendChild(c)}),y){let s=document.createElement("option");s.value="__other__",s.textContent="Other",l.appendChild(s)}if(o=l,y){let s=document.createElement("input");s.type="text",s.className="canopy-input canopy-select-other",s.name=`${t.name}_other`,s.placeholder="Please specify...",s.style.setProperty("display","none","important"),s.style.marginTop="0.5rem",s.addEventListener("input",()=>{s.setCustomValidity("")}),l.addEventListener("change",()=>{l.value==="__other__"?(s.style.setProperty("display","block","important"),t.required&&(s.required=!0)):(s.style.setProperty("display","none","important"),s.required=!1,s.value="")}),l.__otherInput=s}break}case"CHECKBOX":{let a=document.createElement("label");a.className="canopy-checkbox";let p=document.createElement("input");p.type="checkbox",p.id=n,p.name=t.name,a.appendChild(p);let b=document.createElement("span");if(b.textContent=t.label||t.name,a.appendChild(b),e.appendChild(a),t.helpText){let y=document.createElement("p");y.className="canopy-help-text",y.textContent=t.helpText,e.appendChild(y)}let h=document.createElement("span");return h.className="canopy-error",h.id=`${n}-error`,e.appendChild(h),p.setAttribute("aria-describedby",h.id),p.setAttribute("aria-invalid","false"),{wrapper:e,input:p,errorEl:h}}case"CHECKBOXES":{let a=t.options,b=a&&typeof a=="object"&&"options"in a?a.options:Array.isArray(t.options)?t.options:[],h=document.createElement("div");h.className="canopy-checkboxes",h.setAttribute("data-checkbox-group",t.name),b.forEach(s=>{let c=document.createElement("label");c.className="canopy-checkbox";let u=document.createElement("input");u.type="checkbox",u.name=t.name,u.value=s.value,u.addEventListener("input",()=>{y.setCustomValidity("")});let m=document.createElement("span");m.textContent=s.label,c.appendChild(u),c.appendChild(m),h.appendChild(c)});let y=document.createElement("input");if(y.type="hidden",y.id=n,y.name=t.name,e.appendChild(i),e.appendChild(h),t.helpText){let s=document.createElement("p");s.className="canopy-help-text",s.textContent=t.helpText,e.appendChild(s)}let l=document.createElement("span");return l.className="canopy-error",l.id=`${n}-error`,e.appendChild(l),y.setAttribute("aria-describedby",l.id),y.setAttribute("aria-invalid","false"),{wrapper:e,input:y,errorEl:l}}case"EMAIL":{let a=document.createElement("input");a.type="email",a.className="canopy-input",o=a;break}case"PHONE":{let a=document.createElement("input");a.type="tel",a.setAttribute("inputmode","tel"),a.setAttribute("autocomplete","tel"),a.className="canopy-input",o=a;break}case"DATE":{let a=document.createElement("input");a.type="date",a.className="canopy-input";let p=t.validation;p&&(p.minDate&&(a.min=this.resolveDate(p.minDate)),p.maxDate&&(a.max=this.resolveDate(p.maxDate)),p.noFuture&&(a.max=new Date().toISOString().split("T")[0]),p.noPast&&(a.min=new Date().toISOString().split("T")[0])),o=a;break}case"NUMBER":{let a=document.createElement("input");a.type="number",a.className="canopy-input";let p=t.validation;p!=null&&p.integer?(a.setAttribute("inputmode","numeric"),a.setAttribute("step","1")):(a.setAttribute("inputmode","decimal"),a.setAttribute("step","any")),(p==null?void 0:p.min)!==void 0&&a.setAttribute("min",String(p.min)),(p==null?void 0:p.max)!==void 0&&a.setAttribute("max",String(p.max)),o=a;break}case"NAME":return this.createNameField(t);default:{let a=document.createElement("input");a.type="text",a.className="canopy-input",o=a}}o.id=n,o.name=t.name,o.setAttribute("aria-invalid","false"),t.placeholder&&o.setAttribute("placeholder",t.placeholder);let d=T(t);d&&(o instanceof HTMLInputElement||o instanceof HTMLTextAreaElement)&&(o.maxLength=d),o.addEventListener("input",()=>{o.setCustomValidity("")});let f=document.createElement("span");if(f.className="canopy-error",f.id=`${n}-error`,o.setAttribute("aria-describedby",f.id),e.appendChild(i),e.appendChild(o),o.__otherInput&&e.appendChild(o.__otherInput),t.helpText){let a=document.createElement("p");a.className="canopy-help-text",a.textContent=t.helpText,e.appendChild(a)}return e.appendChild(f),{wrapper:e,input:o,errorEl:f}}resolveDate(t){return t==="today"?new Date().toISOString().split("T")[0]:t}createNameField(t){let n=`${this.instanceId}-${t.name}`,e=document.createElement("div");e.className="canopy-field canopy-name-group";let i=document.createElement("label");if(i.className="canopy-label",i.textContent=t.label||t.name,t.required){let l=document.createElement("span");l.className="canopy-required",l.textContent=" *",i.appendChild(l)}e.appendChild(i);let o=t.options||{parts:["first","last"]},d=o.parts||["first","last"],f=o.partLabels||{},a=o.partsRequired||{},p={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},b=document.createElement("div");b.className="canopy-name-parts";let h=document.createElement("input");h.type="hidden",h.id=n,h.name=t.name;let y=document.createElement("span");if(y.className="canopy-error",y.id=`${n}-error`,d.forEach(l=>{let s=document.createElement("div");s.className="canopy-name-part";let c=document.createElement("label");c.className="canopy-name-part-label";let u=`${n}-${l}`;if(c.htmlFor=u,c.textContent=f[l]||p[l]||l,t.required||a[l]){let g=document.createElement("span");g.className="canopy-required",g.textContent=" *",c.appendChild(g)}let m=document.createElement("input");m.type="text",m.className="canopy-input",m.id=u,m.name=`${t.name}.${l}`,m.setAttribute("data-name-part",l),m.setAttribute("data-name-field",t.name),m.addEventListener("input",()=>{m.setCustomValidity("")}),s.appendChild(c),s.appendChild(m),b.appendChild(s)}),e.appendChild(b),t.helpText){let l=document.createElement("p");l.className="canopy-help-text",l.textContent=t.helpText,e.appendChild(l)}return e.appendChild(y),{wrapper:e,input:h,errorEl:y}}collectValues(){let t={};return this.fieldElements.forEach((n,e)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")t[e]=n.input.checked;else if(n.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${e}"]`);if(i){let o=[];i.querySelectorAll("input[type=checkbox]:checked").forEach(d=>{o.push(d.value)}),t[e]=o}else{let o=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(o.length>0){let d={};o.forEach(f=>{let a=f,p=a.getAttribute("data-name-part");p&&(d[p]=a.value)}),t[e]=d}else t[e]=n.input.value}}else t[e]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?t[e]=n.input.__otherInput.value:t[e]=n.input.value}),t}showErrors(t){this.fieldElements.forEach((e,i)=>{let o=t[i]||"";if(e.input.type==="hidden"){let d=this.container.querySelector(`[data-checkbox-group="${i}"]`);if(d){let f=d.querySelector("input[type=checkbox]");f&&f.setCustomValidity(o)}else{let f=this.container.querySelector(`input[data-name-field="${i}"]`);f&&f.setCustomValidity(o)}}else e.input.setCustomValidity(o);e.errorEl.textContent=o,e.input.setAttribute("aria-invalid",o?"true":"false")});let n=Object.keys(t);if(n.length>0){let e=this.fieldElements.get(n[0]);if(e)if(e.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(i){let o=i.querySelector("input[type=checkbox]");o&&(o.reportValidity(),o.focus())}else{let o=this.container.querySelector(`input[data-name-field="${n[0]}"]`);o&&(o.reportValidity(),o.focus())}}else e.input.reportValidity(),e.input.focus()}}setStatus(t,n){this.statusEl&&(this.statusEl.textContent=t,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(t){var i,o;if(t.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach(d=>{d.input.setCustomValidity("")});let n=this.collectValues(),e=D(this.formDefinition.fields,n);if(this.showErrors(e),Object.keys(e).length>0){let d=Object.keys(e).length;this.setStatus(`Please fix ${d} field${d>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let d=this.options.baseUrl||"",f=await fetch(`${d}/api/embed/${this.options.formId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),a=await f.json();if(!f.ok){a!=null&&a.fields&&this.showErrors(a.fields),this.setStatus((a==null?void 0:a.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}this.setStatus(this.formDefinition.successMessage||"Thanks for your submission!","success"),t.target.reset()}catch(d){console.error(d),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let d=((o=(i=this.formDefinition)==null?void 0:i.defaultTheme)==null?void 0:o.buttonText)||"Submit";this.submitButton.textContent=d,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderError(t){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=t,this.container.appendChild(n)}};var M=`
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
`;var O="canopy-embed-styles";function V(){if(document.getElementById(O))return;let r=document.createElement("style");r.id=O,r.textContent=M,document.head.appendChild(r)}function _(r){var t;return r.dataset.baseUrl||((t=document.querySelector("script[data-base-url]"))==null?void 0:t.getAttribute("data-base-url"))||""}function U(r){let t=r.dataset.theme;if(t)try{return JSON.parse(t)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function F(){V(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(t=>{if(t.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=t.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}t.dataset.canopyInitialized="true";let e=U(t),i=_(t);new w(t,{formId:n,themeOverrides:e,baseUrl:i}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",F):F();window.CanopyForms={init:F};})();
