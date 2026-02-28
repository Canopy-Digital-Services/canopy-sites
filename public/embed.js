"use strict";(()=>{var x={fontSize:14,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:8,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:"md",titleWeight:"semibold",titleColor:void 0,labelWeight:"medium",labelTransform:"none",bodyFont:void 0,headingFont:void 0,fontUrl:void 0,fontFamily:void 0,buttonText:void 0},C=new Set;function v(r,t){if(!r)return t;let n=r.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:t:t}function $(r,t){return{...x,...r!=null?r:{},...t!=null?t:{}}}function z(r){let t=/^#?([0-9a-f]{6})$/i.exec(r.trim());if(!t)return null;let n=parseInt(t[1],16);return[n>>16&255,n>>8&255,n&255]}function H(r,t,n){let[e,i,o]=[r,t,n].map(u=>{let y=u/255;return y<=.03928?y/12.92:Math.pow((y+.055)/1.055,2.4)});return .2126*e+.7152*i+.0722*o}function q(r){try{let t=z(r);return t&&H(...t)>.179?"#18181b":"#ffffff"}catch(t){return"#ffffff"}}function L(r,t){var p,g,h,f,l;let n=k(t.bodyFont,t.fontFamily);r.style.setProperty("--canopy-font",n);let e=k(t.headingFont);r.style.setProperty("--canopy-heading-font",e==="inherit"?"var(--canopy-font)":e),r.style.setProperty("--canopy-font-size",`${(p=t.fontSize)!=null?p:x.fontSize}px`),r.style.setProperty("--canopy-text",v(t.text,x.text)),r.style.setProperty("--canopy-bg",v(t.background,x.background)),r.style.setProperty("--canopy-field-bg",v(t.fieldBackground,x.fieldBackground));let i=v(t.primary,x.primary);r.style.setProperty("--canopy-primary",i),r.style.setProperty("--canopy-button-text",q(i)),r.style.setProperty("--canopy-border",v(t.border,x.border)),r.style.setProperty("--canopy-radius",`${(g=t.radius)!=null?g:x.radius}px`),r.style.setProperty("--canopy-button-width",t.buttonWidth==="auto"?"auto":"100%"),r.style.setProperty("--canopy-button-align",t.buttonAlign||x.buttonAlign);let o={sm:"1em",md:"1.25em",lg:"1.5em",xl:"1.875em"};r.style.setProperty("--canopy-title-size",o[(h=t.titleSize)!=null?h:"md"]);let u={normal:"400",semibold:"600",bold:"700"};r.style.setProperty("--canopy-title-weight",u[(f=t.titleWeight)!=null?f:"semibold"]);let y=t.titleColor?v(t.titleColor,""):"";y?r.style.setProperty("--canopy-title-color",y):r.style.removeProperty("--canopy-title-color");let a={normal:"400",medium:"500",semibold:"600"};r.style.setProperty("--canopy-label-weight",a[(l=t.labelWeight)!=null?l:"medium"]),r.style.setProperty("--canopy-label-transform",t.labelTransform==="uppercase"?"uppercase":"none")}function A(r){switch(r.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function k(r,t){return r&&r!=="inherit"?`'${r}', sans-serif`:t&&t!=="inherit"?t:"inherit"}function S(r){let t=r.filter(o=>!!o&&o!=="inherit"&&!C.has(o));if(t.length===0)return;let e=`https://fonts.googleapis.com/css2?${t.map(o=>`family=${encodeURIComponent(o)}:wght@400;500;600;700`).join("&")}&display=swap`,i=document.createElement("link");i.rel="stylesheet",i.href=e,i.dataset.canopyFont="true",document.head.appendChild(i),t.forEach(o=>C.add(o))}function N(r){if(!r||C.has(r))return;let t=document.createElement("link");t.rel="stylesheet",t.href=r,t.dataset.canopyFont="true",document.head.appendChild(t),C.add(r)}var P={TEXT:200,EMAIL:254,TEXTAREA:2e3};function T(r){var t;return(t=r.validation)!=null&&t.maxLength?r.validation.maxLength:P[r.type]}function R(r){return r.label||r.name}function D(r,t){let n={};return r.forEach(e=>{var a,p,g,h,f,l;let i=t[e.name],o=R(e);if(e.required){if(e.type==="CHECKBOX"){if(!i){n[e.name]=`${o} is required.`;return}}else if(e.type==="CHECKBOXES"){if(!Array.isArray(i)||i.length===0){n[e.name]=`${o} is required.`;return}}else if(e.type!=="NAME"){if(i==null||String(i).trim()===""){n[e.name]=`${o} is required.`;return}}}if(e.type==="CHECKBOXES"){if(Array.isArray(i)&&i.length>0){let s=e.options,d=s&&typeof s=="object"&&"options"in s?s.options.map(m=>m.value):[];for(let m of i)if(!d.includes(String(m))){n[e.name]=`${o} contains an invalid option.`;return}}return}if(e.type!=="NAME"){if(i==null||String(i).trim()==="")return}if(e.type==="EMAIL"){let s=String(i);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(s)){n[e.name]="Enter a valid email address";return}let d=(a=e.validation)==null?void 0:a.domainRules;if(d){let m=(p=s.split("@")[1])==null?void 0:p.toLowerCase();if(d.allow&&d.allow.length>0&&!d.allow.map(E=>E.toLowerCase()).includes(m)){n[e.name]=`${o} must be from an allowed domain.`;return}if(d.block&&d.block.length>0&&d.block.map(E=>E.toLowerCase()).includes(m)){n[e.name]=`${o} domain is not allowed.`;return}}}if(e.type==="PHONE"){let s=String(i),c=((g=e.validation)==null?void 0:g.format)||"lenient";if(c==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(s)){n[e.name]=`${o} must be a valid phone number.`;return}}else if(c==="strict"){let d=s.replace(/[^\d+]/g,"");if(d.startsWith("+1"))d=d.substring(2);else if(d.startsWith("+")){n[e.name]=`${o} must be a valid US phone number (10 digits).`;return}else d.startsWith("1")&&d.length===11&&(d=d.substring(1));if(!/^\d{10}$/.test(d)){n[e.name]=`${o} must be a valid US phone number (10 digits).`;return}}return}if(e.type==="DATE"){let s=String(i),c=new Date(s);if(isNaN(c.getTime())){n[e.name]=`${o} must be a valid date.`;return}let d=new Date;d.setHours(0,0,0,0),c.setHours(0,0,0,0);let m=e.validation;if(m!=null&&m.noFuture&&c>d){n[e.name]=`${o} cannot be a future date.`;return}if(m!=null&&m.noPast&&c<d){n[e.name]=`${o} cannot be a past date.`;return}if(m!=null&&m.minDate){let b=new Date(m.minDate==="today"?d:m.minDate);if(b.setHours(0,0,0,0),c<b){n[e.name]=`${o} must be on or after ${b.toLocaleDateString()}.`;return}}if(m!=null&&m.maxDate){let b=new Date(m.maxDate==="today"?d:m.maxDate);if(b.setHours(0,0,0,0),c>b){n[e.name]=`${o} must be on or before ${b.toLocaleDateString()}.`;return}}}if(e.type==="NUMBER"){let s=Number(i);if(isNaN(s)){n[e.name]=`${o} must be a number.`;return}let c=e.validation;if(c!=null&&c.integer&&!Number.isInteger(s)){n[e.name]=`${o} must be a whole number.`;return}if((c==null?void 0:c.min)!==void 0&&s<c.min){n[e.name]=`${o} must be at least ${c.min}.`;return}if((c==null?void 0:c.max)!==void 0&&s>c.max){n[e.name]=`${o} must be at most ${c.max}.`;return}return}if(e.type==="NAME"){let s=i,c=e.options||{parts:["first","last"]},d=c.parts||["first","last"],m=c.partsRequired||{};for(let b of d){let E=s[b];if((e.required||m[b])&&(!E||E.trim()==="")){let O=((h=c.partLabels)==null?void 0:h[b])||b;n[e.name]=`${O} is required.`;return}}return}if(e.type==="DROPDOWN"&&Array.isArray(e.options)&&!e.options.map(c=>c.value).includes(String(i))){n[e.name]=`${o} must be a valid option.`;return}let u=String(i),y=T(e);if((f=e.validation)!=null&&f.minLength&&u.length<e.validation.minLength){n[e.name]=`${o} must be at least ${e.validation.minLength} characters.`;return}if(y&&u.length>y){n[e.name]=`${o} must be at most ${y} characters.`;return}if(e.type==="TEXT"||e.type==="TEXTAREA"){let s=(l=e.validation)==null?void 0:l.format;if(s&&s!=="alphanumeric"){let c=!0,d=`${o} is invalid.`;switch(s){case"numbers":c=/^\d+$/.test(u),d=`${o} must contain only numbers.`;break;case"letters":c=/^[A-Za-z]+$/.test(u),d=`${o} must contain only letters.`;break;case"url":{let m=u.startsWith("http")?u:`https://${u}`;try{c=new URL(m).hostname.includes(".")}catch(b){c=!1}d=`${o} must be a valid URL.`;break}case"postal-us":c=/^\d{5}(-\d{4})?$/.test(u),d=`${o} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":c=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(u),d=`${o} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}c||(n[e.name]=d)}}}),n}var V=0,w=class{constructor(t,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.submitButton=null;this.instanceId=`canopy-${V++}`;this.container=t,this.options=n}async init(){try{this.container.classList.add("canopy-root");let t=await this.fetchDefinition();this.formDefinition=t,this.render(t)}catch(t){console.error(t),this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){let t=this.options.baseUrl||"",n=await fetch(`${t}/api/embed/${this.options.formId}`,{method:"GET",credentials:"omit"});if(!n.ok)throw new Error("Failed to load form definition");return n.json()}render(t){this.container.innerHTML="",this.fieldElements.clear();let n=$(t.defaultTheme,this.options.themeOverrides);if(L(this.container,n),S([n.bodyFont,n.headingFont]),!n.bodyFont&&!n.headingFont&&N(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(A(n)),!t.fields||t.fields.length===0){this.renderError("This form is not configured yet.");return}if(t.title||t.description){let f=document.createElement("div");if(f.className="canopy-header",t.title){let l=document.createElement("h2");l.className="canopy-title",l.textContent=t.title,f.appendChild(l)}if(t.description){let l=document.createElement("p");l.className="canopy-description",l.textContent=t.description,f.appendChild(l)}this.container.appendChild(f)}let e=document.createElement("div");e.className="canopy-status",e.setAttribute("role","status"),this.statusEl=e;let i=document.createElement("form");i.className="canopy-form",i.addEventListener("submit",f=>this.handleSubmit(f)),t.fields.forEach(f=>{let{wrapper:l,input:s,errorEl:c}=this.createField(f);l&&i.appendChild(l),this.fieldElements.set(f.name,{input:s,errorEl:c})});let o=document.createElement("button");o.type="submit",o.className="canopy-submit",o.textContent=n.buttonText||"Submit";let u=getComputedStyle(this.container),y=u.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",a=u.getPropertyValue("--canopy-button-text").trim()||"#ffffff",p=u.getPropertyValue("--canopy-radius").trim()||"8px",g=u.getPropertyValue("--canopy-button-width").trim()||"100%";o.style.cssText=`
      display: block !important;
      width: ${g} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${p} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${y} !important;
      background-color: ${y} !important;
      color: ${a} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=o;let h=document.createElement("div");h.className="canopy-form-actions",h.appendChild(o),i.appendChild(h),this.container.appendChild(e),this.container.appendChild(i)}createField(t){let n=`${this.instanceId}-${t.name}`,e=document.createElement("div");e.className="canopy-field";let i=document.createElement("label");if(i.className="canopy-label",i.htmlFor=n,i.textContent=t.label||t.name,t.required){let a=document.createElement("span");a.className="canopy-required",a.textContent=" *",i.appendChild(a)}let o;switch(t.type){case"TEXTAREA":{let a=document.createElement("textarea");a.className="canopy-textarea";let p=T(t);if(p){let g=Math.min(Math.max(Math.ceil(p/60),4),15);a.rows=g}else a.rows=4;o=a;break}case"DROPDOWN":{let a=t.options,p=a&&typeof a=="object"&&"options"in a,g=p?a.options:Array.isArray(t.options)?t.options:[],h=p?a.defaultValue:void 0,f=p?a.allowOther:!1,l=document.createElement("select");if(l.className="canopy-select",g.forEach(s=>{let c=document.createElement("option");c.value=s.value,c.textContent=s.label,h&&s.value===h&&(c.selected=!0),l.appendChild(c)}),f){let s=document.createElement("option");s.value="__other__",s.textContent="Other",l.appendChild(s)}if(o=l,f){let s=document.createElement("input");s.type="text",s.className="canopy-input canopy-select-other",s.name=`${t.name}_other`,s.placeholder="Please specify...",s.style.setProperty("display","none","important"),s.style.marginTop="0.5rem",s.addEventListener("input",()=>{s.setCustomValidity("")}),l.addEventListener("change",()=>{l.value==="__other__"?(s.style.setProperty("display","block","important"),t.required&&(s.required=!0)):(s.style.setProperty("display","none","important"),s.required=!1,s.value="")}),l.__otherInput=s}break}case"CHECKBOX":{let a=document.createElement("label");a.className="canopy-checkbox";let p=document.createElement("input");p.type="checkbox",p.id=n,p.name=t.name,p.addEventListener("change",()=>{p.setCustomValidity("")}),a.appendChild(p);let g=document.createElement("span");if(g.textContent=t.label||t.name,a.appendChild(g),e.appendChild(a),t.helpText){let f=document.createElement("p");f.className="canopy-help-text",f.textContent=t.helpText,e.appendChild(f)}let h=document.createElement("span");return h.className="canopy-error",h.id=`${n}-error`,e.appendChild(h),p.setAttribute("aria-describedby",h.id),p.setAttribute("aria-invalid","false"),{wrapper:e,input:p,errorEl:h}}case"CHECKBOXES":{let a=t.options,g=a&&typeof a=="object"&&"options"in a?a.options:Array.isArray(t.options)?t.options:[],h=document.createElement("div");h.className="canopy-checkboxes",h.setAttribute("data-checkbox-group",t.name),g.forEach(s=>{let c=document.createElement("label");c.className="canopy-checkbox";let d=document.createElement("input");d.type="checkbox",d.name=t.name,d.value=s.value,d.addEventListener("change",()=>{let b=h.querySelector("input[type=checkbox]");b&&b.setCustomValidity("")});let m=document.createElement("span");m.textContent=s.label,c.appendChild(d),c.appendChild(m),h.appendChild(c)});let f=document.createElement("input");if(f.type="hidden",f.id=n,f.name=t.name,e.appendChild(i),e.appendChild(h),t.helpText){let s=document.createElement("p");s.className="canopy-help-text",s.textContent=t.helpText,e.appendChild(s)}let l=document.createElement("span");return l.className="canopy-error",l.id=`${n}-error`,e.appendChild(l),f.setAttribute("aria-describedby",l.id),f.setAttribute("aria-invalid","false"),{wrapper:e,input:f,errorEl:l}}case"EMAIL":{let a=document.createElement("input");a.type="email",a.className="canopy-input",o=a;break}case"PHONE":{let a=document.createElement("input");a.type="tel",a.setAttribute("inputmode","tel"),a.setAttribute("autocomplete","tel"),a.className="canopy-input",o=a;break}case"DATE":{let a=document.createElement("input");a.type="date",a.className="canopy-input";let p=t.validation;p&&(p.minDate&&(a.min=this.resolveDate(p.minDate)),p.maxDate&&(a.max=this.resolveDate(p.maxDate)),p.noFuture&&(a.max=new Date().toISOString().split("T")[0]),p.noPast&&(a.min=new Date().toISOString().split("T")[0])),o=a;break}case"NUMBER":{let a=document.createElement("input");a.type="number",a.className="canopy-input";let p=t.validation;p!=null&&p.integer?(a.setAttribute("inputmode","numeric"),a.setAttribute("step","1")):(a.setAttribute("inputmode","decimal"),a.setAttribute("step","any")),(p==null?void 0:p.min)!==void 0&&a.setAttribute("min",String(p.min)),(p==null?void 0:p.max)!==void 0&&a.setAttribute("max",String(p.max)),o=a;break}case"NAME":return this.createNameField(t);default:{let a=document.createElement("input");a.type="text",a.className="canopy-input",o=a}}o.id=n,o.name=t.name,o.setAttribute("aria-invalid","false"),t.placeholder&&o.setAttribute("placeholder",t.placeholder);let u=T(t);u&&(o instanceof HTMLInputElement||o instanceof HTMLTextAreaElement)&&(o.maxLength=u),o.addEventListener("input",()=>{o.setCustomValidity("")});let y=document.createElement("span");if(y.className="canopy-error",y.id=`${n}-error`,o.setAttribute("aria-describedby",y.id),e.appendChild(i),e.appendChild(o),o.__otherInput&&e.appendChild(o.__otherInput),t.helpText){let a=document.createElement("p");a.className="canopy-help-text",a.textContent=t.helpText,e.appendChild(a)}return e.appendChild(y),{wrapper:e,input:o,errorEl:y}}resolveDate(t){return t==="today"?new Date().toISOString().split("T")[0]:t}createNameField(t){let n=`${this.instanceId}-${t.name}`,e=document.createElement("div");e.className="canopy-field canopy-name-group";let i=document.createElement("label");if(i.className="canopy-label",i.textContent=t.label||t.name,t.required){let l=document.createElement("span");l.className="canopy-required",l.textContent=" *",i.appendChild(l)}e.appendChild(i);let o=t.options||{parts:["first","last"]},u=o.parts||["first","last"],y=o.partLabels||{},a=o.partsRequired||{},p={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},g=document.createElement("div");g.className="canopy-name-parts";let h=document.createElement("input");h.type="hidden",h.id=n,h.name=t.name;let f=document.createElement("span");if(f.className="canopy-error",f.id=`${n}-error`,u.forEach(l=>{let s=document.createElement("div");s.className="canopy-name-part";let c=document.createElement("label");c.className="canopy-name-part-label";let d=`${n}-${l}`;if(c.htmlFor=d,c.textContent=y[l]||p[l]||l,t.required||a[l]){let b=document.createElement("span");b.className="canopy-required",b.textContent=" *",c.appendChild(b)}let m=document.createElement("input");m.type="text",m.className="canopy-input",m.id=d,m.name=`${t.name}.${l}`,m.setAttribute("data-name-part",l),m.setAttribute("data-name-field",t.name),m.addEventListener("input",()=>{m.setCustomValidity("")}),s.appendChild(c),s.appendChild(m),g.appendChild(s)}),e.appendChild(g),t.helpText){let l=document.createElement("p");l.className="canopy-help-text",l.textContent=t.helpText,e.appendChild(l)}return e.appendChild(f),{wrapper:e,input:h,errorEl:f}}collectValues(){let t={};return this.fieldElements.forEach((n,e)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")t[e]=n.input.checked;else if(n.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${e}"]`);if(i){let o=[];i.querySelectorAll("input[type=checkbox]:checked").forEach(u=>{o.push(u.value)}),t[e]=o}else{let o=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(o.length>0){let u={};o.forEach(y=>{let a=y,p=a.getAttribute("data-name-part");p&&(u[p]=a.value)}),t[e]=u}else t[e]=n.input.value}}else t[e]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?t[e]=n.input.__otherInput.value:t[e]=n.input.value}),t}showErrors(t){this.fieldElements.forEach((e,i)=>{let o=t[i]||"";if(e.input.type==="hidden"){let u=this.container.querySelector(`[data-checkbox-group="${i}"]`);if(u){let y=u.querySelector("input[type=checkbox]");y&&y.setCustomValidity(o)}else{let y=this.container.querySelector(`input[data-name-field="${i}"]`);y&&y.setCustomValidity(o)}}else e.input.setCustomValidity(o);e.errorEl.textContent=o,e.input.setAttribute("aria-invalid",o?"true":"false")});let n=Object.keys(t);if(n.length>0){let e=this.fieldElements.get(n[0]);if(e)if(e.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(i){let o=i.querySelector("input[type=checkbox]");o&&(o.reportValidity(),o.focus())}else{let o=this.container.querySelector(`input[data-name-field="${n[0]}"]`);o&&(o.reportValidity(),o.focus())}}else e.input.reportValidity(),e.input.focus()}}setStatus(t,n){this.statusEl&&(this.statusEl.textContent=t,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(t){var i,o;if(t.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach((u,y)=>{if(u.input.setCustomValidity(""),u.input.type==="hidden"){let a=this.container.querySelector(`[data-checkbox-group="${y}"]`);if(a){let p=a.querySelector("input[type=checkbox]");p&&p.setCustomValidity("")}else{let p=this.container.querySelector(`input[data-name-field="${y}"]`);p&&p.setCustomValidity("")}}});let n=this.collectValues(),e=D(this.formDefinition.fields,n);if(this.showErrors(e),Object.keys(e).length>0){let u=Object.keys(e).length;this.setStatus(`Please fix ${u} field${u>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let u=this.options.baseUrl||"",y=await fetch(`${u}/api/embed/${this.options.formId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),a=await y.json();if(!y.ok){a!=null&&a.fields&&this.showErrors(a.fields),this.setStatus((a==null?void 0:a.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}this.setStatus(this.formDefinition.successMessage||"Thanks for your submission!","success"),t.target.reset()}catch(u){console.error(u),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let u=((o=(i=this.formDefinition)==null?void 0:i.defaultTheme)==null?void 0:o.buttonText)||"Submit";this.submitButton.textContent=u,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderError(t){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=t,this.container.appendChild(n)}};var M=`
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
`;var I="canopy-embed-styles";function B(){if(document.getElementById(I))return;let r=document.createElement("style");r.id=I,r.textContent=M,document.head.appendChild(r)}function _(r){var t;return r.dataset.baseUrl||((t=document.querySelector("script[data-base-url]"))==null?void 0:t.getAttribute("data-base-url"))||""}function U(r){let t=r.dataset.theme;if(t)try{return JSON.parse(t)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function F(){B(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(t=>{if(t.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=t.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}t.dataset.canopyInitialized="true";let e=U(t),i=_(t);new w(t,{formId:n,themeOverrides:e,baseUrl:i}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",F):F();window.CanopyForms={init:F};})();
