"use strict";(()=>{var x={fontSize:16,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:28,titleWeight:"normal",titleAlign:"left",labelSize:18,labelWeight:"normal"},L=new Set;function E(r,e){if(!r)return e;let n=r.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:e:e}function _(r){if(!r)return{};let{headingFont:e,...n}=r;return e?{titleFont:e,labelFont:e,...n}:n}function U(r,e){return{...x,..._(r),..._(e)}}function re(r){let e=/^#?([0-9a-f]{6})$/i.exec(r.trim());if(!e)return null;let n=parseInt(e[1],16);return[n>>16&255,n>>8&255,n&255]}function oe(r,e,n){let[t,o,a]=[r,e,n].map(c=>{let d=c/255;return d<=.03928?d/12.92:Math.pow((d+.055)/1.055,2.4)});return .2126*t+.7152*o+.0722*a}function W(r){let e=re(r);return e?oe(...e):null}function ie(r,e){let n=W(r);if(n===null||n<=.179)return"#ffffff";let t=W(e);return t!==null&&(n+.05)/(t+.05)>=4.5?e:x.text}function V(r,e){var y,i,p,b,h,u;let n=B(e.bodyFont,e.fontFamily);r.style.setProperty("--canopy-font",n);for(let[s,l]of[["--canopy-title-font",e.titleFont],["--canopy-label-font",e.labelFont]]){let f=B(l);r.style.setProperty(s,f==="inherit"?"var(--canopy-font)":f)}r.style.setProperty("--canopy-font-size",`${(y=e.fontSize)!=null?y:x.fontSize}px`);let t=E(e.text,x.text);r.style.setProperty("--canopy-text",t),r.style.setProperty("--canopy-bg",E(e.background,x.background)),r.style.setProperty("--canopy-field-bg",E(e.fieldBackground,x.fieldBackground));let o=E(e.primary,x.primary);r.style.setProperty("--canopy-primary",o),r.style.setProperty("--canopy-button-text",E(e.buttonTextColor,"")||ie(o,t)),r.style.setProperty("--canopy-border",E(e.border,x.border)),r.style.setProperty("--canopy-radius",`${(i=e.radius)!=null?i:x.radius}px`),r.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),r.style.setProperty("--canopy-button-align",e.buttonAlign||x.buttonAlign);let a={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"},c=(s,l)=>{var m;let f=Number(s);return f>0?`${f}px`:(m=a[String(s)])!=null?m:`${Number(l)}px`};r.style.setProperty("--canopy-title-size",c(e.titleSize,x.titleSize)),r.style.setProperty("--canopy-label-size",c(e.labelSize,x.labelSize));let d={light:"300",normal:"400",medium:"500",bold:"700",semibold:"700"};r.style.setProperty("--canopy-title-weight",(b=d[(p=e.titleWeight)!=null?p:"normal"])!=null?b:"400"),r.style.setProperty("--canopy-label-weight",(u=d[(h=e.labelWeight)!=null?h:"normal"])!=null?u:"400");for(let[s,l]of[["--canopy-title-color",e.titleColor],["--canopy-label-color",e.labelColor]]){let f=l?E(l,""):"";f?r.style.setProperty(s,f):r.style.removeProperty(s)}r.style.setProperty("--canopy-title-align",e.titleAlign==="center"?"center":"left")}function X(r){switch(r.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function B(r,e){return r&&r!=="inherit"?`'${r}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function j(r,e){let n=r.filter(c=>!!c&&c!=="inherit"&&!L.has(c));if(n.length===0)return;let t=n.map(c=>`family=${encodeURIComponent(c)}`).join("&"),o=`${e}/api/fonts?${t}`,a=document.createElement("link");a.rel="stylesheet",a.href=o,a.dataset.canopyFont="true",document.head.appendChild(a),n.forEach(c=>L.add(c))}function K(r){if(!r||L.has(r))return;let e=document.createElement("link");e.rel="stylesheet",e.href=r,e.dataset.canopyFont="true",document.head.appendChild(e),L.add(r)}var H="Name",se={first:"First",middle:"Middle",middleInitial:"M.I.",last:"Last",single:H},A=["first","last"],Z=["first","middle","middleInitial","last","single"];function G(r){return[...r].sort((e,n)=>Z.indexOf(e)-Z.indexOf(n))}function S(r,e){var t;if(r!=null&&r.requiredParts)return r.requiredParts;let n=(t=r==null?void 0:r.parts)!=null?t:A;return e?n.filter(o=>o!=="middle"&&o!=="middleInitial"):[]}function N(r,e){return(e==null?void 0:e[r])||se[r]||r}var le={line1:"Street",line2:"Apt, suite",city:"City",region:"State",postalCode:"ZIP"},Y=["line1","line2","city","region","postalCode"];function M(r){var n;let e=(n=r==null?void 0:r.parts)!=null?n:Y;return Y.filter(t=>e.includes(t))}function $(r,e){return(e==null?void 0:e[r])||le[r]||r}function R(r,e){return r!=null&&r.requiredParts?r.requiredParts:e?M(r).filter(n=>n!=="line2"):[]}var ce=/^\d{5}(-\d{4})?$/;function J(r,e,n){let t=M(e),o=R(e,n),a=c=>{var d;return String((d=r==null?void 0:r[c])!=null?d:"").trim()};for(let c of t)if(o.includes(c)&&!a(c))return`${$(c,e==null?void 0:e.partLabels)} is required.`;return t.includes("postalCode")&&a("postalCode")&&!ce.test(a("postalCode"))?`${$("postalCode",e==null?void 0:e.partLabels)} must be a US ZIP code, like 12345 or 12345-6789.`:null}var Q="Choose one...",D="Other",C="__other__";function I(r){let e=Array.isArray(r)?r:r==null?void 0:r.options;return Array.isArray(e)?e.filter(n=>typeof n=="object"&&n!==null&&typeof n.value=="string"):[]}function O(r){return!Array.isArray(r)&&(r==null?void 0:r.allowOther)===!0}function z(r,e,n,t){let o=r==="CHECKBOXES"?e:typeof e=="string"?[e]:null;if(!Array.isArray(o))return`${t} must be one of its options.`;let a=I(n).map(d=>d.value),c=o.map(String).filter(d=>!a.includes(d));return c.length===0?null:!O(n)||c.length>1?`${t} must be one of its options.`:c[0].length>200?`${t} must be 200 characters or fewer.`:null}var pe={TEXT:200,EMAIL:254,TEXTAREA:2e3};function F(r){var e;return(e=r.validation)!=null&&e.maxLength?r.validation.maxLength:pe[r.type]}function de(r){return r.label||r.name}function ee(r,e){let n={};return r.forEach(t=>{var y,i,p,b,h;let o=e[t.name],a=de(t);if(t.required){if(t.type==="CHECKBOX"){if(!o){n[t.name]=`${a} is required.`;return}}else if(t.type==="CHECKBOXES"){if(!Array.isArray(o)||o.length===0){n[t.name]=`${a} is required.`;return}}else if(t.type!=="NAME"){if(t.type!=="ADDRESS"){if(o==null||String(o).trim()===""){n[t.name]=`${a} is required.`;return}}}}if(t.type==="CHECKBOXES"){if(Array.isArray(o)&&o.length>0){let u=z("CHECKBOXES",o,t.options,a);u&&(n[t.name]=u)}return}if(!(t.type==="NAME"||t.type==="ADDRESS")){if(o==null||String(o).trim()==="")return}if(t.type==="EMAIL"){let u=String(o);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(u)){n[t.name]="Enter a valid email address";return}let l=(y=t.validation)==null?void 0:y.domainRules;if(l){let f=(i=u.split("@")[1])==null?void 0:i.toLowerCase();if(l.allow&&l.allow.length>0&&!l.allow.map(g=>g.toLowerCase()).includes(f)){n[t.name]=`${a} must be from an allowed domain.`;return}if(l.block&&l.block.length>0&&l.block.map(g=>g.toLowerCase()).includes(f)){n[t.name]=`${a} domain is not allowed.`;return}}}if(t.type==="PHONE"){let u=String(o),s=((p=t.validation)==null?void 0:p.format)||"lenient";if(s==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(u)){n[t.name]=`${a} must be a valid phone number.`;return}}else if(s==="strict"){let l=u.replace(/[^\d+]/g,"");if(l.startsWith("+1"))l=l.substring(2);else if(l.startsWith("+")){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}else l.startsWith("1")&&l.length===11&&(l=l.substring(1));if(!/^\d{10}$/.test(l)){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}}return}if(t.type==="DATE"){let u=String(o),s=new Date(u);if(isNaN(s.getTime())){n[t.name]=`${a} must be a valid date.`;return}let l=new Date;l.setHours(0,0,0,0),s.setHours(0,0,0,0);let f=t.validation;if(f!=null&&f.minDate){let m=new Date(f.minDate==="today"?l:f.minDate);if(m.setHours(0,0,0,0),s<m){n[t.name]=`${a} must be on or after ${m.toLocaleDateString()}.`;return}}if(f!=null&&f.maxDate){let m=new Date(f.maxDate==="today"?l:f.maxDate);if(m.setHours(0,0,0,0),s>m){n[t.name]=`${a} must be on or before ${m.toLocaleDateString()}.`;return}}}if(t.type==="NUMBER"){let u=Number(o);if(isNaN(u)){n[t.name]=`${a} must be a number.`;return}let s=t.validation;if(s!=null&&s.integer&&!Number.isInteger(u)){n[t.name]=`${a} must be a whole number.`;return}if((s==null?void 0:s.min)!==void 0&&u<s.min){n[t.name]=`${a} must be at least ${s.min}.`;return}if((s==null?void 0:s.max)!==void 0&&u>s.max){n[t.name]=`${a} must be at most ${s.max}.`;return}return}if(t.type==="NAME"){let u=o,s=t.options||{},l=s.parts||A,f=S(s,t.required);for(let m of l){let g=u==null?void 0:u[m];if(f.includes(m)&&(!g||g.trim()==="")){let v=m==="single"?a:N(m,s.partLabels);n[t.name]=`${v} is required.`;return}}return}if(t.type==="ADDRESS"){let u=J(o,t.options,t.required);u&&(n[t.name]=u);return}if(t.type==="DROPDOWN"){let u=z("DROPDOWN",o,t.options,a);u&&(n[t.name]=u);return}let c=String(o),d=F(t);if((b=t.validation)!=null&&b.minLength&&c.length<t.validation.minLength){n[t.name]=`${a} must be at least ${t.validation.minLength} characters.`;return}if(d&&c.length>d){n[t.name]=`${a} must be at most ${d} characters.`;return}if(t.type==="TEXT"||t.type==="TEXTAREA"){let u=(h=t.validation)==null?void 0:h.format;if(u&&u!=="alphanumeric"){let s=!0,l=`${a} is invalid.`;switch(u){case"numbers":s=/^\d+$/.test(c),l=`${a} must contain only numbers.`;break;case"letters":s=/^[A-Za-z]+$/.test(c),l=`${a} must contain only letters.`;break;case"url":{let f=c.startsWith("http")?c:`https://${c}`;try{s=new URL(f).hostname.includes(".")}catch(m){s=!1}l=`${a} must be a valid URL.`;break}case"postal-us":s=/^\d{5}(-\d{4})?$/.test(c),l=`${a} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":s=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(c),l=`${a} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}s||(n[t.name]=l)}}}),n}var te=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var me="feedback@canopyds.com",ye=0,T=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},w=class extends Error{constructor(e){super(e),this.name="HostedOnlyFormError"}},k=class{constructor(e,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${ye++}`;this.container=e,this.options=n}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof T){this.renderInactive();return}if(e instanceof w){this.renderHostedOnly();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var o;let e=this.options.baseUrl||"",n=this.options.formId||((o=this.formDefinition)==null?void 0:o.formId);if(!n)throw new Error("Form configuration error: no formId");let t=await fetch(`${e}/api/embed/${n}`,{method:"GET",credentials:"omit"});if(!t.ok){if(t.status===403)try{let a=await t.json();if((a==null?void 0:a.code)==="FORM_INACTIVE")throw new T(a.error||"Form is inactive");if((a==null?void 0:a.code)==="FORM_HOSTED_ONLY")throw new w(a.error||"Form is only available at its hosted URL")}catch(a){if(a instanceof T||a instanceof w)throw a}throw new Error("Failed to load form definition")}return t.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let n=U(e.defaultTheme,this.options.themeOverrides);V(this.container,n),j([n.bodyFont,n.titleFont,n.labelFont],this.options.baseUrl||""),!n.bodyFont&&!n.titleFont&&!n.labelFont&&K(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(X(n));let t=e.fields&&e.fields.length>0,o=e.title||e.description;if(!t&&!o){this.renderSkeleton();return}if(e.title||e.description){let s=document.createElement("div");if(s.className="canopy-header",e.title){let l=document.createElement("h2");l.className="canopy-title",l.textContent=e.title,s.appendChild(l)}if(e.description){let l=document.createElement("p");l.className="canopy-description",l.textContent=e.description,s.appendChild(l)}this.container.appendChild(s)}let a=document.createElement("div");a.className="canopy-status",a.setAttribute("role","alert"),a.setAttribute("aria-live","assertive"),this.statusEl=a;let c=document.createElement("form");c.className="canopy-form",c.addEventListener("submit",s=>this.handleSubmit(s)),this.formEl=c,e.fields.forEach(s=>{let{wrapper:l,input:f,errorEl:m}=this.createField(s);l&&(l.dataset.fieldName=s.name,c.appendChild(l)),this.fieldElements.set(s.name,{input:f,errorEl:m})});let d=document.createElement("button");d.type="submit",d.className="canopy-submit",d.textContent=n.buttonText||"Submit",this.options.preview&&(d.classList.add("canopy-submit-preview"),d.setAttribute("data-preview-tooltip","For preview only. No submission will be created"));let y=getComputedStyle(this.container),i=y.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",p=y.getPropertyValue("--canopy-button-text").trim()||"#ffffff",b=y.getPropertyValue("--canopy-radius").trim()||"8px",h=y.getPropertyValue("--canopy-button-width").trim()||"100%";d.style.cssText=`
      display: block !important;
      width: ${h} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${b} !important;
      padding: 10px 16px !important;
      font-family: var(--canopy-font, inherit) !important;
      font-size: var(--canopy-font-size, 16px) !important;
      font-weight: 600 !important;
      background: ${i} !important;
      background-color: ${i} !important;
      color: ${p} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=d;let u=document.createElement("div");u.className="canopy-form-actions",u.appendChild(d),c.appendChild(u),this.container.appendChild(a),this.container.appendChild(c),this.container.appendChild(this.renderWatermark(e))}renderWatermark(e){let n=document.createElement("div");n.className="canopy-watermark";let t=document.createElement("span");t.className="canopy-watermark-brand",t.textContent="Powered by Canopy Forms (Beta)",n.appendChild(t);let o=document.createElement("span");o.className="canopy-watermark-sep",o.setAttribute("aria-hidden","true"),o.textContent="\xB7",n.appendChild(o);let a=(e==null?void 0:e.title)||(e==null?void 0:e.name)||(e==null?void 0:e.formId)||"unknown form",c=(e==null?void 0:e.formId)||"unknown",d=`Canopy Forms issue \u2014 ${a}`,y=[`Form: ${a}`,`Form ID: ${c}`,"","Describe the issue:",""].join(`
`),i=`mailto:${me}?subject=${encodeURIComponent(d)}&body=${encodeURIComponent(y)}`,p=document.createElement("a");return p.className="canopy-watermark-link",p.href=i,p.textContent="Report an issue",p.rel="noopener",n.appendChild(p),n}createField(e){var y;let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let o=document.createElement("label");if(o.className="canopy-label",o.dataset.fieldPart="label",o.htmlFor=n,o.textContent=e.label||e.name,e.required){let i=document.createElement("span");i.className="canopy-required",i.textContent=" *",i.setAttribute("aria-hidden","true"),o.appendChild(i)}let a;switch(e.type){case"TEXTAREA":{let i=document.createElement("textarea");i.className="canopy-textarea";let p=F(e);if(p){let b=Math.min(Math.max(Math.ceil(p/60),4),15);i.rows=b}else i.rows=4;a=i;break}case"DROPDOWN":{let i=I(e.options),p=Array.isArray(e.options)||(y=e.options)==null?void 0:y.defaultValue,b=i.some(l=>l.value===p),h=O(e.options),u=document.createElement("select");u.className="canopy-select";let s=document.createElement("option");if(s.value="",s.textContent=e.placeholder||Q,s.disabled=!0,s.selected=!b,u.appendChild(s),i.forEach(l=>{let f=document.createElement("option");f.value=l.value,f.textContent=l.label,b&&l.value===p&&(f.selected=!0),u.appendChild(f)}),h){let l=document.createElement("option");l.value=C,l.textContent=D,u.appendChild(l)}if(a=u,h){let l=this.createOtherInput(e);u.addEventListener("change",()=>{u.value===C?(l.style.setProperty("display","block","important"),e.required&&(l.required=!0)):(l.style.setProperty("display","none","important"),l.required=!1,l.value="")}),u.__otherInput=l}break}case"CHECKBOX":{let i=document.createElement("label");i.className="canopy-checkbox";let p=document.createElement("input");p.type="checkbox",p.id=n,p.name=e.name,e.required&&p.setAttribute("aria-required","true"),p.addEventListener("change",()=>{p.setCustomValidity("")}),i.appendChild(p);let b=document.createElement("span");if(b.dataset.fieldPart="label",b.textContent=e.label||e.name,i.appendChild(b),t.appendChild(i),e.helpText){let u=document.createElement("p");u.className="canopy-help-text",u.textContent=e.helpText,t.appendChild(u)}let h=document.createElement("span");return h.className="canopy-error",h.id=`${n}-error`,t.appendChild(h),p.setAttribute("aria-describedby",h.id),p.setAttribute("aria-invalid","false"),{wrapper:t,input:p,errorEl:h}}case"CHECKBOXES":{let i=document.createElement("div");i.className="canopy-checkboxes",i.setAttribute("data-checkbox-group",e.name);let p=()=>{let s=i.querySelector("input[type=checkbox]");s&&s.setCustomValidity("")},b=(s,l,f)=>{let m=document.createElement("label");m.className="canopy-checkbox",m.dataset.fieldPart=f;let g=document.createElement("input");g.type="checkbox",g.name=e.name,g.value=s,g.addEventListener("change",p);let v=document.createElement("span");return v.textContent=l,m.appendChild(g),m.appendChild(v),i.appendChild(m),g};if(I(e.options).forEach((s,l)=>{b(s.value,s.label,`option-${l}`)}),O(e.options)){let s=b(C,D,"option-other"),l=this.createOtherInput(e);l.dataset.choiceOther=e.name,l.addEventListener("input",p),s.addEventListener("change",()=>{s.checked?(l.style.setProperty("display","block","important"),l.focus()):(l.style.setProperty("display","none","important"),l.value="")}),i.appendChild(l)}let h=document.createElement("input");if(h.type="hidden",h.id=n,h.name=e.name,t.appendChild(o),t.appendChild(i),e.helpText){let s=document.createElement("p");s.className="canopy-help-text",s.textContent=e.helpText,t.appendChild(s)}let u=document.createElement("span");return u.className="canopy-error",u.id=`${n}-error`,t.appendChild(u),h.setAttribute("aria-describedby",u.id),h.setAttribute("aria-invalid","false"),{wrapper:t,input:h,errorEl:u}}case"EMAIL":{let i=document.createElement("input");i.type="email",i.className="canopy-input",a=i;break}case"PHONE":{let i=document.createElement("input");i.type="tel",i.setAttribute("inputmode","tel"),i.setAttribute("autocomplete","tel"),i.className="canopy-input",a=i;break}case"DATE":{let i=document.createElement("input");i.type="date",i.className="canopy-input";let p=e.validation;p&&(p.minDate&&(i.min=this.resolveDate(p.minDate)),p.maxDate&&(i.max=this.resolveDate(p.maxDate))),a=i;break}case"NUMBER":{let i=document.createElement("input");i.type="number",i.className="canopy-input";let p=e.validation;p!=null&&p.integer?(i.setAttribute("inputmode","numeric"),i.setAttribute("step","1")):(i.setAttribute("inputmode","decimal"),i.setAttribute("step","any")),(p==null?void 0:p.min)!==void 0&&i.setAttribute("min",String(p.min)),(p==null?void 0:p.max)!==void 0&&i.setAttribute("max",String(p.max)),a=i;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);default:{let i=document.createElement("input");i.type="text",i.className="canopy-input",a=i}}a.id=n,a.name=e.name,a.dataset.fieldPart="input",a.setAttribute("aria-invalid","false"),e.required&&a.setAttribute("aria-required","true"),e.placeholder&&!(a instanceof HTMLSelectElement)&&a.setAttribute("placeholder",e.placeholder);let c=F(e);c&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=c),a.addEventListener("input",()=>{a.setCustomValidity("")});let d=document.createElement("span");if(d.className="canopy-error",d.id=`${n}-error`,a.setAttribute("aria-describedby",d.id),t.appendChild(o),t.appendChild(a),a.__otherInput&&t.appendChild(a.__otherInput),e.helpText){let i=document.createElement("p");i.className="canopy-help-text",i.textContent=e.helpText,t.appendChild(i)}return t.appendChild(d),{wrapper:t,input:a,errorEl:d}}createOtherInput(e){let n=document.createElement("input");return n.type="text",n.className="canopy-input canopy-choice-other",n.name=`${e.name}_other`,n.placeholder="Please specify...",n.maxLength=200,n.setAttribute("aria-label",`${e.label||e.name}: ${D}`),n.style.setProperty("display","none","important"),n.addEventListener("input",()=>{n.setCustomValidity("")}),n}resolveDate(e){return e==="today"?new Date().toISOString().split("T")[0]:e}createNameField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-name-group",t.setAttribute("role","group");let o=e.options||{},a=G(o.parts||A),c=S(o,e.required),d=e.label||H,y=a.includes("single");if(y)t.setAttribute("aria-label",d);else{let h=document.createElement("span");h.id=`${n}-group-label`,h.className="canopy-label",h.dataset.fieldPart="label",h.textContent=d,t.appendChild(h),t.setAttribute("aria-labelledby",h.id)}let i=document.createElement("div");i.className="canopy-name-parts";let p=document.createElement("input");p.type="hidden",p.id=n,p.name=e.name;let b=document.createElement("span");if(b.className="canopy-error",b.id=`${n}-error`,a.forEach(h=>{let u=document.createElement("div");u.className=h==="middleInitial"?"canopy-name-part canopy-name-part-initial":"canopy-name-part";let s=document.createElement("label");s.className=y?"canopy-label":"canopy-name-part-label";let l=`${n}-${h}`;s.htmlFor=l,s.textContent=y?d:N(h,o.partLabels),s.dataset.fieldPart=y?"label":`label-${h}`;let f=c.includes(h);if(f){let g=document.createElement("span");g.className="canopy-required",g.textContent=" *",g.setAttribute("aria-hidden","true"),s.appendChild(g)}let m=document.createElement("input");m.type="text",m.className="canopy-input",m.id=l,m.name=`${e.name}.${h}`,m.setAttribute("data-name-part",h),m.setAttribute("data-name-field",e.name),h==="middleInitial"&&(m.maxLength=2),f&&m.setAttribute("aria-required","true"),m.addEventListener("input",()=>{i.querySelectorAll("input[data-name-part]").forEach(g=>g.setCustomValidity(""))}),u.appendChild(s),u.appendChild(m),i.appendChild(u)}),t.appendChild(i),e.helpText){let h=document.createElement("p");h.className="canopy-help-text",h.textContent=e.helpText,t.appendChild(h)}return t.appendChild(b),{wrapper:t,input:p,errorEl:b}}createAddressField(e){let n=`${this.instanceId}-${e.name}`,t=e.options||{},o=document.createElement("div");o.className="canopy-field canopy-address-group",o.setAttribute("role","group"),o.setAttribute("aria-labelledby",`${n}-group-label`);let a=document.createElement("span");a.id=`${n}-group-label`,a.className="canopy-label",a.dataset.fieldPart="label",a.textContent=e.label||"Address",o.appendChild(a);let c=document.createElement("div");c.className="canopy-address-parts";let d=document.createElement("input");d.type="hidden",d.id=n,d.name=e.name;let y=document.createElement("span");y.className="canopy-error",y.id=`${n}-error`;let i={postalCode:{maxlength:"10",inputmode:"numeric"}},p=R(t,e.required);if(M(t).forEach(b=>{let h=p.includes(b),u=document.createElement("div");u.className=`canopy-address-part canopy-address-part-${b}`;let s=document.createElement("label");s.className="canopy-address-part-label";let l=`${n}-${b}`;if(s.htmlFor=l,s.textContent=$(b,t.partLabels),s.dataset.fieldPart=`label-${b}`,h){let m=document.createElement("span");m.className="canopy-required",m.textContent=" *",m.setAttribute("aria-hidden","true"),s.appendChild(m)}let f;if(b==="region"){let m=document.createElement("select");m.className="canopy-select";let g=document.createElement("option");g.value="",g.textContent="Select...",m.appendChild(g),te.forEach(v=>{let P=document.createElement("option");P.value=v.value,P.textContent=v.label,m.appendChild(P)}),m.addEventListener("change",()=>{c.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(v=>v.setCustomValidity(""))}),f=m}else{let m=document.createElement("input");m.type="text",m.className="canopy-input",i[b]&&Object.entries(i[b]).forEach(([g,v])=>m.setAttribute(g,v)),m.addEventListener("input",()=>{c.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(g=>g.setCustomValidity(""))}),f=m}f.id=l,f.setAttribute("data-address-part",b),f.setAttribute("data-address-field",e.name),h&&f.setAttribute("aria-required","true"),u.appendChild(s),u.appendChild(f),c.appendChild(u)}),o.appendChild(c),e.helpText){let b=document.createElement("p");b.className="canopy-help-text",b.textContent=e.helpText,o.appendChild(b)}return o.appendChild(y),{wrapper:o,input:d,errorEl:y}}collectValues(){let e={};return this.fieldElements.forEach((n,t)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")e[t]=n.input.checked;else if(n.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${t}"]`);if(o){let a=[];o.querySelectorAll("input[type=checkbox]:checked").forEach(c=>{var y;if(c.value!==C){a.push(c.value);return}let d=(y=o.querySelector("[data-choice-other]"))==null?void 0:y.value.trim();d&&a.push(d)}),e[t]=a}else{let a=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(a.length>0){let c={};a.forEach(d=>{let y=d,i=y.getAttribute("data-name-part");i&&(c[i]=y.value)}),e[t]=c}else{let c=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(c.length>0){let d={};c.forEach(y=>{let i=y.getAttribute("data-address-part");i&&(d[i]=y.value)}),e[t]=d}else e[t]=n.input.value}}}else e[t]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value===C&&n.input.__otherInput?e[t]=n.input.__otherInput.value:e[t]=n.input.value}),e}findFailingInput(e){let n=this.container.querySelectorAll(`input[data-name-field="${e}"]`),t=a=>a.getAttribute("aria-required")==="true"&&!a.value.trim();if(n.length>0){for(let a of n)if(t(a))return a;return n[0]}let o=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(o.length>0){for(let a of o)if(t(a))return a;for(let a of o)if(a.getAttribute("data-address-part")==="postalCode")return a;return o[0]}return null}showErrors(e){this.fieldElements.forEach((t,o)=>{let a=e[o]||"";if(t.input.type==="hidden"){let c=this.container.querySelector(`[data-checkbox-group="${o}"]`);if(c){let d=c.querySelector("input[type=checkbox]");d&&d.setCustomValidity(a)}else{let d=a?this.findFailingInput(o):null;d?d.setCustomValidity(a):this.container.querySelectorAll(`input[data-name-field="${o}"], input[data-address-field="${o}"], select[data-address-field="${o}"]`).forEach(i=>i.setCustomValidity(""))}}else t.input.setCustomValidity(a);t.errorEl.textContent=a,t.input.setAttribute("aria-invalid",a?"true":"false")});let n=Object.keys(e);if(n.length>0){let t=this.fieldElements.get(n[0]);if(t)if(t.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(o){let a=o.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.findFailingInput(n[0]);a&&(a.reportValidity(),a.focus())}}else t.input.reportValidity(),t.input.focus()}}setStatus(e,n){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(e){var o,a,c;if(e.preventDefault(),!this.formDefinition||this.options.preview)return;this.setStatus("","info"),this.fieldElements.forEach((d,y)=>{if(d.input.setCustomValidity(""),d.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${y}"]`);if(i){let p=i.querySelector("input[type=checkbox]");p&&p.setCustomValidity("")}else this.container.querySelectorAll(`input[data-name-field="${y}"], input[data-address-field="${y}"], select[data-address-field="${y}"]`).forEach(b=>b.setCustomValidity(""))}});let n=this.collectValues(),t=ee(this.formDefinition.fields,n);if(this.showErrors(t),Object.keys(t).length>0){let d=Object.keys(t).length;this.setStatus(`Please fix ${d} field${d>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let d=this.options.baseUrl||"",y=this.options.formId||((o=this.formDefinition)==null?void 0:o.formId);if(!y){this.setStatus("Form configuration error.","error");return}let i=await fetch(`${d}/api/embed/${y}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),p=await i.json();if(!i.ok){p!=null&&p.fields&&this.showErrors(p.fields),this.setStatus((p==null?void 0:p.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(d){console.error(d),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let d=((c=(a=this.formDefinition)==null?void 0:a.defaultTheme)==null?void 0:c.buttonText)||"Submit";this.submitButton.textContent=d,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let n=this.container.querySelector(".canopy-success");n&&n.remove();let t=document.createElement("div");t.className="canopy-success",t.setAttribute("role","status"),t.setAttribute("aria-live","polite");let o=document.createElement("div");o.className="canopy-success-icon",o.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',t.appendChild(o);let a=document.createElement("p");a.className="canopy-success-message",a.textContent=e,t.appendChild(a);let c=document.createElement("button");c.type="button",c.className="canopy-success-reset",c.textContent="Submit another response",c.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),t.appendChild(c),this.container.appendChild(t)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let n=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],t=0,o=document.createElement("div");o.className="canopy-skeleton-bar canopy-skeleton-title",o.style.animationDelay=`${t}s`,e.appendChild(o),t+=.15;let a=document.createElement("div");a.className="canopy-skeleton-bar canopy-skeleton-desc",a.style.animationDelay=`${t}s`,e.appendChild(a),t+=.15;for(let d of n){let y=document.createElement("div");y.className="canopy-skeleton-field";let i=document.createElement("div");i.className="canopy-skeleton-bar canopy-skeleton-label",i.style.width=d.labelW,i.style.animationDelay=`${t}s`,y.appendChild(i),t+=.1;let p=document.createElement("div");p.className=`canopy-skeleton-bar canopy-skeleton-${d.type}`,p.style.animationDelay=`${t}s`,y.appendChild(p),t+=.15,e.appendChild(y)}let c=document.createElement("div");c.className="canopy-skeleton-bar canopy-skeleton-button",c.style.animationDelay=`${t}s`,e.appendChild(c),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=e,this.container.appendChild(n),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderHostedOnly(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is only available at its hosted URL and cannot be embedded. Please contact the form owner.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}};var ne=`
.canopy-root {
  font-family: var(--canopy-font, inherit);
  font-size: var(--canopy-font-size, 16px);
  color: var(--canopy-text, #18181b);
  background: var(--canopy-bg, #ffffff);
  padding: 4px;
  --canopy-title-font: var(--canopy-font, inherit);
  --canopy-label-font: var(--canopy-font, inherit);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.canopy-form {
  display: grid;
  gap: 16px;
}

.canopy-form-actions {
  display: flex;
  justify-content: var(--canopy-button-align, left);
}

/* Admin preview only: instant tooltip pinned above the Submit button.
   Class + data-attribute are added by the embed when options.preview is true,
   so this never reaches production embeds. */
.canopy-root .canopy-submit-preview {
  position: relative;
}

.canopy-root .canopy-submit-preview::after {
  content: attr(data-preview-tooltip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 10px;
  background: #18181b;
  color: #fafafa;
  font-family: var(--canopy-font, inherit);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 120ms ease-out;
  z-index: 1;
}

.canopy-root .canopy-submit-preview::before {
  content: "";
  position: absolute;
  bottom: calc(100% + 2px);
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #18181b;
  pointer-events: none;
  opacity: 0;
  transition: opacity 120ms ease-out;
  z-index: 1;
}

.canopy-root .canopy-submit-preview:hover::after,
.canopy-root .canopy-submit-preview:focus-visible::after,
.canopy-root .canopy-submit-preview:hover::before,
.canopy-root .canopy-submit-preview:focus-visible::before {
  opacity: 1;
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
  font-family: var(--canopy-label-font, var(--canopy-font, inherit));
  font-size: var(--canopy-label-size, 18px);
  font-weight: var(--canopy-label-weight, 400);
  color: var(--canopy-label-color, var(--canopy-text, #18181b));
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
  font-family: var(--canopy-font, inherit);
  font-size: var(--canopy-font-size, 16px);
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
  font-size: calc(var(--canopy-font-size, 16px) - 1px);
  color: var(--canopy-text, #18181b);
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
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.canopy-name-part {
  display: grid;
  gap: 4px;
  flex: 1 1 150px;
}

/* One or two characters: a full-width box would look like a mistake. */
.canopy-name-part-initial {
  flex: 0 0 4.5em;
}

.canopy-name-part-label {
  font-size: calc(var(--canopy-font-size, 16px) - 1px);
  font-weight: 500;
  color: var(--canopy-text, #18181b);
}

.canopy-address-parts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.canopy-address-part {
  display: grid;
  gap: 4px;
  flex: 1 1 100%;
}

/* City, State, and ZIP share a row, wrapping on a narrow form. */
.canopy-address-part-city {
  flex: 2 1 10em;
}

.canopy-address-part-region {
  flex: 1 1 8em;
}

.canopy-address-part-postalCode {
  flex: 0 1 7em;
}

.canopy-address-part-label {
  font-size: calc(var(--canopy-font-size, 16px) - 1px);
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
  /* Buttons don't inherit the page's font on their own. */
  font-family: var(--canopy-font, inherit);
  font-size: var(--canopy-font-size, 16px);
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
  font-size: var(--canopy-font-size, 16px);
}

.canopy-status.canopy-status-error {
  color: #FF6B5A;
}

.canopy-inactive {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--canopy-text, #18181b);
}

.canopy-inactive-heading {
  margin: 0;
  font-family: var(--canopy-title-font, var(--canopy-font, inherit));
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--canopy-title-color, var(--canopy-text, #18181b));
}

.canopy-inactive-body {
  margin: 0;
  max-width: 360px;
  color: var(--canopy-muted-text, #71717a);
  font-size: var(--canopy-font-size, 16px);
  line-height: 1.5;
}

.canopy-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  padding: 32px 24px;
  border-radius: var(--canopy-radius, 8px);
  animation: canopy-success-in 300ms ease-out;
}

@keyframes canopy-success-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.canopy-success-icon {
  width: 56px;
  height: 56px;
  border-radius: 9999px;
  background: var(--canopy-primary, #005F6A);
  color: var(--canopy-button-text, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.canopy-success-icon svg {
  width: 28px;
  height: 28px;
}

.canopy-success-message {
  font-family: var(--canopy-font, inherit);
  font-size: var(--canopy-font-size, 16px);
  color: var(--canopy-text, #18181b);
  line-height: 1.5;
  margin: 0;
  max-width: 420px;
  white-space: pre-wrap;
}

.canopy-success-reset {
  background: none;
  border: none;
  color: var(--canopy-primary, #005F6A);
  font-family: var(--canopy-font, inherit);
  font-size: calc(var(--canopy-font-size, 16px) - 1px);
  font-weight: 500;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: var(--canopy-radius, 8px);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.canopy-success-reset:hover {
  opacity: 0.75;
}

.canopy-success-reset:focus-visible {
  outline: 2px solid var(--canopy-primary, #005F6A);
  outline-offset: 2px;
}

.canopy-header {
  margin-bottom: 16px;
}

/* Skeleton empty state */
@keyframes canopy-shimmer {
  0% { opacity: 0.4; }
  50% { opacity: 0.7; }
  100% { opacity: 0.4; }
}

.canopy-skeleton {
  display: grid;
  gap: 16px;
  pointer-events: none;
  user-select: none;
}

.canopy-skeleton-bar {
  border-radius: var(--canopy-radius, 8px);
  background: var(--canopy-border, #e4e4e7);
  animation: canopy-shimmer 2s ease-in-out infinite;
}

.canopy-skeleton-title {
  height: 1.4em;
  width: 55%;
  border-radius: 4px;
}

.canopy-skeleton-desc {
  height: 0.85em;
  width: 80%;
  border-radius: 4px;
  margin-top: -8px;
}

.canopy-skeleton-field {
  display: grid;
  gap: 6px;
}

.canopy-skeleton-label {
  height: 0.85em;
  border-radius: 4px;
}

.canopy-skeleton-input {
  height: 40px;
  border: 1px solid var(--canopy-border, #e4e4e7);
  background: var(--canopy-field-bg, #ffffff);
}

.canopy-skeleton-textarea {
  height: 80px;
  border: 1px solid var(--canopy-border, #e4e4e7);
  background: var(--canopy-field-bg, #ffffff);
}

.canopy-skeleton-button {
  height: 40px;
  width: var(--canopy-button-width, 100%);
  background: var(--canopy-primary, #005F6A);
  opacity: 0.25;
}

.canopy-title {
  font-family: var(--canopy-title-font, var(--canopy-font, inherit));
  font-size: var(--canopy-title-size, 28px);
  font-weight: var(--canopy-title-weight, 400);
  color: var(--canopy-title-color, var(--canopy-text, #18181b));
  text-align: var(--canopy-title-align, left);
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.canopy-description {
  font-size: var(--canopy-font-size, 16px);
  color: var(--canopy-text, #18181b);
  margin: 0;
  line-height: 1.5;
}

.canopy-watermark {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--canopy-border, #e4e4e7);
  font-family: var(--canopy-font, inherit);
  font-size: 11px;
  line-height: 1.4;
  color: var(--canopy-text, #18181b);
  opacity: 0.55;
}

.canopy-watermark-sep {
  opacity: 0.6;
}

.canopy-root .canopy-watermark-link {
  color: var(--canopy-primary, #005F6A);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.canopy-root .canopy-watermark-link:hover {
  opacity: 0.8;
}

.canopy-root .canopy-watermark-link:focus-visible {
  outline: 2px solid var(--canopy-primary, #005F6A);
  outline-offset: 2px;
  border-radius: 2px;
}
`;var ae="canopy-embed-styles";function he(){if(document.getElementById(ae))return;let r=document.createElement("style");r.id=ae,r.textContent=ne,document.head.appendChild(r)}function fe(r){var e;return r.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function be(r){let e=r.dataset.theme;if(e)try{return JSON.parse(e)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function q(){he(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=e.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let t=be(e),o=fe(e);new k(e,{formId:n,themeOverrides:t,baseUrl:o}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",q):q();window.CanopyForms={init:q,CanopyForm:k};})();
