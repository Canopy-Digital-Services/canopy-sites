"use strict";(()=>{var x={fontSize:16,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:28,titleWeight:"normal",titleAlign:"left",labelSize:18,labelWeight:"normal"},k=new Set;function v(a,e){if(!a)return e;let t=a.trim();return t?/^var\(/i.test(t)||/^rgb/i.test(t)||/^hsl/i.test(t)||/^color\(/i.test(t)||/^(transparent|currentcolor|inherit)$/i.test(t)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t)?t:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t)?`#${t}`:e:e}function W(a){if(!a)return{};let{headingFont:e,...t}=a;return e?{titleFont:e,labelFont:e,...t}:t}function U(a,e){return{...x,...W(a),...W(e)}}function ie(a){let e=/^#?([0-9a-f]{6})$/i.exec(a.trim());if(!e)return null;let t=parseInt(e[1],16);return[t>>16&255,t>>8&255,t&255]}function se(a,e,t){let[n,i,r]=[a,e,t].map(c=>{let s=c/255;return s<=.03928?s/12.92:Math.pow((s+.055)/1.055,2.4)});return .2126*n+.7152*i+.0722*r}function V(a){let e=ie(a);return e?se(...e):null}function le(a,e){let t=V(a);if(t===null||t<=.179)return"#ffffff";let n=V(e);return n!==null&&(t+.05)/(n+.05)>=4.5?e:x.text}function X(a,e){var p,o,l,m,y,h;let t=B(e.bodyFont,e.fontFamily);a.style.setProperty("--canopy-font",t);for(let[d,u]of[["--canopy-title-font",e.titleFont],["--canopy-label-font",e.labelFont]]){let b=B(u);a.style.setProperty(d,b==="inherit"?"var(--canopy-font)":b)}a.style.setProperty("--canopy-font-size",`${(p=e.fontSize)!=null?p:x.fontSize}px`);let n=v(e.text,x.text);a.style.setProperty("--canopy-text",n),a.style.setProperty("--canopy-bg",v(e.background,x.background)),a.style.setProperty("--canopy-field-bg",v(e.fieldBackground,x.fieldBackground));let i=v(e.primary,x.primary);a.style.setProperty("--canopy-primary",i),a.style.setProperty("--canopy-button-text",v(e.buttonTextColor,"")||le(i,n)),a.style.setProperty("--canopy-border",v(e.border,x.border)),a.style.setProperty("--canopy-radius",`${(o=e.radius)!=null?o:x.radius}px`),a.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),a.style.setProperty("--canopy-button-align",e.buttonAlign||x.buttonAlign);let r={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"},c=(d,u)=>{var f;let b=Number(d);return b>0?`${b}px`:(f=r[String(d)])!=null?f:`${Number(u)}px`};a.style.setProperty("--canopy-title-size",c(e.titleSize,x.titleSize)),a.style.setProperty("--canopy-label-size",c(e.labelSize,x.labelSize));let s={light:"300",normal:"400",medium:"500",bold:"700",semibold:"700"};a.style.setProperty("--canopy-title-weight",(m=s[(l=e.titleWeight)!=null?l:"normal"])!=null?m:"400"),a.style.setProperty("--canopy-label-weight",(h=s[(y=e.labelWeight)!=null?y:"normal"])!=null?h:"400");for(let[d,u]of[["--canopy-title-color",e.titleColor],["--canopy-label-color",e.labelColor]]){let b=u?v(u,""):"";b?a.style.setProperty(d,b):a.style.removeProperty(d)}a.style.setProperty("--canopy-title-align",e.titleAlign==="center"?"center":"left")}function j(a){switch(a.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function B(a,e){return a&&a!=="inherit"?`'${a}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function K(a,e){let t=a.filter(c=>!!c&&c!=="inherit"&&!k.has(c));if(t.length===0)return;let n=t.map(c=>`family=${encodeURIComponent(c)}`).join("&"),i=`${e}/api/fonts?${n}`,r=document.createElement("link");r.rel="stylesheet",r.href=i,r.dataset.canopyFont="true",document.head.appendChild(r),t.forEach(c=>k.add(c))}function G(a){if(!a||k.has(a))return;let e=document.createElement("link");e.rel="stylesheet",e.href=a,e.dataset.canopyFont="true",document.head.appendChild(e),k.add(a)}var H="Name",ce={first:"First",middle:"Middle",middleInitial:"M.I.",last:"Last",single:H},A=["first","last"],Z=["first","middle","middleInitial","last","single"];function Y(a){return[...a].sort((e,t)=>Z.indexOf(e)-Z.indexOf(t))}function S(a,e){var n;if(a!=null&&a.requiredParts)return a.requiredParts;let t=(n=a==null?void 0:a.parts)!=null?n:A;return e?t.filter(i=>i!=="middle"&&i!=="middleInitial"):[]}function N(a,e){return(e==null?void 0:e[a])||ce[a]||a}var pe={line1:"Street",line2:"Apt, suite",city:"City",region:"State",postalCode:"ZIP"},J=["line1","line2","city","region","postalCode"];function I(a){var t;let e=(t=a==null?void 0:a.parts)!=null?t:J;return J.filter(n=>e.includes(n))}function $(a,e){return(e==null?void 0:e[a])||pe[a]||a}function R(a,e){return a!=null&&a.requiredParts?a.requiredParts:e?I(a).filter(t=>t!=="line2"):[]}var de=/^\d{5}(-\d{4})?$/;function Q(a,e,t){let n=I(e),i=R(e,t),r=c=>{var s;return String((s=a==null?void 0:a[c])!=null?s:"").trim()};for(let c of n)if(i.includes(c)&&!r(c))return`${$(c,e==null?void 0:e.partLabels)} is required.`;return n.includes("postalCode")&&r("postalCode")&&!de.test(r("postalCode"))?`${$("postalCode",e==null?void 0:e.partLabels)} must be a US ZIP code, like 12345 or 12345-6789.`:null}var ee="Choose one...",M="Other",C="__other__";function O(a){let e=Array.isArray(a)?a:a==null?void 0:a.options;return Array.isArray(e)?e.filter(t=>typeof t=="object"&&t!==null&&typeof t.value=="string"):[]}function F(a){return!Array.isArray(a)&&(a==null?void 0:a.allowOther)===!0}function q(a,e,t,n){let i=a==="CHECKBOXES"?e:typeof e=="string"?[e]:null;if(!Array.isArray(i))return`${n} must be one of its options.`;let r=O(t).map(s=>s.value),c=i.map(String).filter(s=>!r.includes(s));return c.length===0?null:!F(t)||c.length>1?`${n} must be one of its options.`:c[0].length>200?`${n} must be 200 characters or fewer.`:null}var ue={TEXT:200,EMAIL:254,TEXTAREA:2e3},me={TEXT:500,EMAIL:320,TEXTAREA:1e4};function z(a){return typeof a.validation=="object"&&a.validation!==null?a.validation:{}}function D(a){let e=z(a).maxLength,t=Number.isInteger(e)&&e>0?e:ue[a.type],n=me[a.type];return t!==void 0&&n!==void 0?Math.min(t,n):t}var ye=/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;function fe(a){return a.length>320||/[\r\n]/.test(a)?!1:ye.test(a)}function he(a){let e=a.replace(/[^\d+]/g,"");if(e.startsWith("+1"))e=e.substring(2);else{if(e.startsWith("+"))return null;e.startsWith("1")&&e.length===11&&(e=e.substring(1))}return/^\d{10}$/.test(e)?e:null}function te(a,e,t){let{minLength:n}=z(a);if(n&&e.length<n)return`${t} must be at least ${n} characters.`;let i=D(a);return i!==void 0&&e.length>i?`${t} must be at most ${i} characters.`:null}function be(a,e,t){switch(a){case"numbers":return/^\d+$/.test(e)?null:`${t} must contain only numbers.`;case"letters":return/^[A-Za-z]+$/.test(e)?null:`${t} must contain only letters.`;case"url":{try{if(new URL(e.startsWith("http")?e:`https://${e}`).hostname.includes("."))return null}catch(n){}return`${t} must be a valid URL.`}case"postal-us":return/^\d{5}(-\d{4})?$/.test(e)?null:`${t} must be a valid US postal code (e.g., 12345 or 12345-6789).`;case"postal-ca":return/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(e)?null:`${t} must be a valid Canadian postal code (e.g., K1A 0B1).`;default:return null}}function ge(a,e){var r,c;let t=a.label||a.name,n=z(a);switch(a.type){case"CHECKBOX":return a.required&&!e?`${t} is required.`:null;case"CHECKBOXES":if(!Array.isArray(e)||e.length===0){if(a.required)return`${t} is required.`;if(e==null||Array.isArray(e))return null}return q("CHECKBOXES",e,a.options,t);case"NAME":{let s=e,p=typeof a.options=="object"&&a.options!==null?a.options:{},o=S(p,a.required);for(let l of p.parts||A){let m=s==null?void 0:s[l];if(o.includes(l)&&(!m||String(m).trim()===""))return`${l==="single"?t:N(l,p.partLabels)} is required.`}return null}case"ADDRESS":return Q(e,a.options,a.required)}if(e==null||String(e).trim()==="")return a.required?`${t} is required.`:null;let i=String(e);switch(a.type){case"DROPDOWN":return q("DROPDOWN",e,a.options,t);case"PHONE":{let s=n.format||"lenient";return s==="lenient"&&!/^[\d\s\-\(\)\+\.]{7,}$/.test(i)?`${t} must be a valid phone number.`:s==="strict"&&!he(i)?`${t} must be a valid US phone number (10 digits).`:null}case"DATE":{let s=new Date(i);if(isNaN(s.getTime()))return`${t} must be a valid date.`;let p=new Date;if(p.setHours(0,0,0,0),s.setHours(0,0,0,0),n.minDate){let o=new Date(n.minDate==="today"?p:n.minDate);if(o.setHours(0,0,0,0),s<o)return`${t} must be on or after ${o.toLocaleDateString()}.`}if(n.maxDate){let o=new Date(n.maxDate==="today"?p:n.maxDate);if(o.setHours(0,0,0,0),s>o)return`${t} must be on or before ${o.toLocaleDateString()}.`}return null}case"NUMBER":{let s=Number(e);return isNaN(s)?`${t} must be a number.`:n.integer&&!Number.isInteger(s)?`${t} must be a whole number.`:n.min!==void 0&&s<n.min?`${t} must be at least ${n.min}.`:n.max!==void 0&&s>n.max?`${t} must be at most ${n.max}.`:null}case"EMAIL":{let s=i.trim();if(!fe(s))return"Enter a valid email address";let p=s.split("@")[1].toLowerCase(),{allow:o,block:l}=(r=n.domainRules)!=null?r:{};return Array.isArray(o)&&o.length>0&&!o.some(m=>String(m).toLowerCase()===p)?`${t} must be from an allowed domain.`:Array.isArray(l)&&l.some(m=>String(m).toLowerCase()===p)?`${t} domain is not allowed.`:te(a,s,t)}default:return(c=te(a,i,t))!=null?c:be(n.format,i,t)}}function ne(a,e){let t={};for(let n of a){let i=ge(n,e[n.name]);i&&(t[n.name]=i)}return t}var ae=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var Ee="feedback@canopyds.com",ve=0,T=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},w=class extends Error{constructor(e){super(e),this.name="HostedOnlyFormError"}},L=class{constructor(e,t){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${ve++}`;this.container=e,this.options=t}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof T){this.renderInactive();return}if(e instanceof w){this.renderHostedOnly();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var i;let e=this.options.baseUrl||"",t=this.options.formId||((i=this.formDefinition)==null?void 0:i.formId);if(!t)throw new Error("Form configuration error: no formId");let n=await fetch(`${e}/api/embed/${t}`,{method:"GET",credentials:"omit"});if(!n.ok){if(n.status===403)try{let r=await n.json();if((r==null?void 0:r.code)==="FORM_INACTIVE")throw new T(r.error||"Form is inactive");if((r==null?void 0:r.code)==="FORM_HOSTED_ONLY")throw new w(r.error||"Form is only available at its hosted URL")}catch(r){if(r instanceof T||r instanceof w)throw r}throw new Error("Failed to load form definition")}return n.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let t=U(e.defaultTheme,this.options.themeOverrides);X(this.container,t),K([t.bodyFont,t.titleFont,t.labelFont],this.options.baseUrl||""),!t.bodyFont&&!t.titleFont&&!t.labelFont&&G(t.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(j(t));let n=e.fields&&e.fields.length>0,i=e.title||e.description;if(!n&&!i){this.renderSkeleton();return}if(e.title||e.description){let d=document.createElement("div");if(d.className="canopy-header",e.title){let u=document.createElement("h2");u.className="canopy-title",u.textContent=e.title,d.appendChild(u)}if(e.description){let u=document.createElement("p");u.className="canopy-description",u.textContent=e.description,d.appendChild(u)}this.container.appendChild(d)}let r=document.createElement("div");r.className="canopy-status",r.setAttribute("role","alert"),r.setAttribute("aria-live","assertive"),this.statusEl=r;let c=document.createElement("form");c.className="canopy-form",c.addEventListener("submit",d=>this.handleSubmit(d)),this.formEl=c,e.fields.forEach(d=>{let{wrapper:u,input:b,errorEl:f}=this.createField(d);u&&(u.dataset.fieldName=d.name,c.appendChild(u)),this.fieldElements.set(d.name,{input:b,errorEl:f})});let s=document.createElement("button");s.type="submit",s.className="canopy-submit",s.textContent=t.buttonText||"Submit",this.options.preview&&(s.classList.add("canopy-submit-preview"),s.setAttribute("data-preview-tooltip","For preview only. No submission will be created"));let p=getComputedStyle(this.container),o=p.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",l=p.getPropertyValue("--canopy-button-text").trim()||"#ffffff",m=p.getPropertyValue("--canopy-radius").trim()||"8px",y=p.getPropertyValue("--canopy-button-width").trim()||"100%";s.style.cssText=`
      display: block !important;
      width: ${y} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${m} !important;
      padding: 10px 16px !important;
      font-family: var(--canopy-font, inherit) !important;
      font-size: var(--canopy-font-size, 16px) !important;
      font-weight: 600 !important;
      background: ${o} !important;
      background-color: ${o} !important;
      color: ${l} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=s;let h=document.createElement("div");h.className="canopy-form-actions",h.appendChild(s),c.appendChild(h),this.container.appendChild(r),this.container.appendChild(c),this.container.appendChild(this.renderWatermark(e))}renderWatermark(e){let t=document.createElement("div");t.className="canopy-watermark";let n=document.createElement("span");n.className="canopy-watermark-brand",n.textContent="Powered by Canopy Forms (Beta)",t.appendChild(n);let i=document.createElement("span");i.className="canopy-watermark-sep",i.setAttribute("aria-hidden","true"),i.textContent="\xB7",t.appendChild(i);let r=(e==null?void 0:e.title)||(e==null?void 0:e.name)||(e==null?void 0:e.formId)||"unknown form",c=(e==null?void 0:e.formId)||"unknown",s=`Canopy Forms issue \u2014 ${r}`,p=[`Form: ${r}`,`Form ID: ${c}`,"","Describe the issue:",""].join(`
`),o=`mailto:${Ee}?subject=${encodeURIComponent(s)}&body=${encodeURIComponent(p)}`,l=document.createElement("a");return l.className="canopy-watermark-link",l.href=o,l.textContent="Report an issue",l.rel="noopener",t.appendChild(l),t}createField(e){var p;let t=`${this.instanceId}-${e.name}`,n=document.createElement("div");n.className="canopy-field";let i=document.createElement("label");if(i.className="canopy-label",i.dataset.fieldPart="label",i.htmlFor=t,i.textContent=e.label||e.name,e.required){let o=document.createElement("span");o.className="canopy-required",o.textContent=" *",o.setAttribute("aria-hidden","true"),i.appendChild(o)}let r;switch(e.type){case"TEXTAREA":{let o=document.createElement("textarea");o.className="canopy-textarea";let l=D(e);if(l){let m=Math.min(Math.max(Math.ceil(l/60),4),15);o.rows=m}else o.rows=4;r=o;break}case"DROPDOWN":{let o=O(e.options),l=Array.isArray(e.options)||(p=e.options)==null?void 0:p.defaultValue,m=o.some(u=>u.value===l),y=F(e.options),h=document.createElement("select");h.className="canopy-select";let d=document.createElement("option");if(d.value="",d.textContent=e.placeholder||ee,d.disabled=!0,d.selected=!m,h.appendChild(d),o.forEach(u=>{let b=document.createElement("option");b.value=u.value,b.textContent=u.label,m&&u.value===l&&(b.selected=!0),h.appendChild(b)}),y){let u=document.createElement("option");u.value=C,u.textContent=M,h.appendChild(u)}if(r=h,y){let u=this.createOtherInput(e);h.addEventListener("change",()=>{h.value===C?(u.style.setProperty("display","block","important"),e.required&&(u.required=!0)):(u.style.setProperty("display","none","important"),u.required=!1,u.value="")}),h.__otherInput=u}break}case"CHECKBOX":{let o=document.createElement("label");o.className="canopy-checkbox";let l=document.createElement("input");l.type="checkbox",l.id=t,l.name=e.name,e.required&&l.setAttribute("aria-required","true"),l.addEventListener("change",()=>{l.setCustomValidity("")}),o.appendChild(l);let m=document.createElement("span");if(m.dataset.fieldPart="label",m.textContent=e.label||e.name,o.appendChild(m),n.appendChild(o),e.helpText){let h=document.createElement("p");h.className="canopy-help-text",h.textContent=e.helpText,n.appendChild(h)}let y=document.createElement("span");return y.className="canopy-error",y.id=`${t}-error`,n.appendChild(y),l.setAttribute("aria-describedby",y.id),l.setAttribute("aria-invalid","false"),{wrapper:n,input:l,errorEl:y}}case"CHECKBOXES":{let o=document.createElement("div");o.className="canopy-checkboxes",o.setAttribute("data-checkbox-group",e.name);let l=()=>{let d=o.querySelector("input[type=checkbox]");d&&d.setCustomValidity("")},m=(d,u,b)=>{let f=document.createElement("label");f.className="canopy-checkbox",f.dataset.fieldPart=b;let g=document.createElement("input");g.type="checkbox",g.name=e.name,g.value=d,g.addEventListener("change",l);let E=document.createElement("span");return E.textContent=u,f.appendChild(g),f.appendChild(E),o.appendChild(f),g};if(O(e.options).forEach((d,u)=>{m(d.value,d.label,`option-${u}`)}),F(e.options)){let d=m(C,M,"option-other"),u=this.createOtherInput(e);u.dataset.choiceOther=e.name,u.addEventListener("input",l),d.addEventListener("change",()=>{d.checked?(u.style.setProperty("display","block","important"),u.focus()):(u.style.setProperty("display","none","important"),u.value="")}),o.appendChild(u)}let y=document.createElement("input");if(y.type="hidden",y.id=t,y.name=e.name,n.appendChild(i),n.appendChild(o),e.helpText){let d=document.createElement("p");d.className="canopy-help-text",d.textContent=e.helpText,n.appendChild(d)}let h=document.createElement("span");return h.className="canopy-error",h.id=`${t}-error`,n.appendChild(h),y.setAttribute("aria-describedby",h.id),y.setAttribute("aria-invalid","false"),{wrapper:n,input:y,errorEl:h}}case"EMAIL":{let o=document.createElement("input");o.type="email",o.className="canopy-input",r=o;break}case"PHONE":{let o=document.createElement("input");o.type="tel",o.setAttribute("inputmode","tel"),o.setAttribute("autocomplete","tel"),o.className="canopy-input",r=o;break}case"DATE":{let o=document.createElement("input");o.type="date",o.className="canopy-input";let l=e.validation;l&&(l.minDate&&(o.min=this.resolveDate(l.minDate)),l.maxDate&&(o.max=this.resolveDate(l.maxDate))),r=o;break}case"NUMBER":{let o=document.createElement("input");o.type="number",o.className="canopy-input";let l=e.validation;l!=null&&l.integer?(o.setAttribute("inputmode","numeric"),o.setAttribute("step","1")):(o.setAttribute("inputmode","decimal"),o.setAttribute("step","any")),(l==null?void 0:l.min)!==void 0&&o.setAttribute("min",String(l.min)),(l==null?void 0:l.max)!==void 0&&o.setAttribute("max",String(l.max)),r=o;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);default:{let o=document.createElement("input");o.type="text",o.className="canopy-input",r=o}}r.id=t,r.name=e.name,r.dataset.fieldPart="input",r.setAttribute("aria-invalid","false"),e.required&&r.setAttribute("aria-required","true"),e.placeholder&&!(r instanceof HTMLSelectElement)&&r.setAttribute("placeholder",e.placeholder);let c=D(e);c&&(r instanceof HTMLInputElement||r instanceof HTMLTextAreaElement)&&(r.maxLength=c),r.addEventListener("input",()=>{r.setCustomValidity("")});let s=document.createElement("span");if(s.className="canopy-error",s.id=`${t}-error`,r.setAttribute("aria-describedby",s.id),n.appendChild(i),n.appendChild(r),r.__otherInput&&n.appendChild(r.__otherInput),e.helpText){let o=document.createElement("p");o.className="canopy-help-text",o.textContent=e.helpText,n.appendChild(o)}return n.appendChild(s),{wrapper:n,input:r,errorEl:s}}createOtherInput(e){let t=document.createElement("input");return t.type="text",t.className="canopy-input canopy-choice-other",t.name=`${e.name}_other`,t.placeholder="Please specify...",t.maxLength=200,t.setAttribute("aria-label",`${e.label||e.name}: ${M}`),t.style.setProperty("display","none","important"),t.addEventListener("input",()=>{t.setCustomValidity("")}),t}resolveDate(e){return e==="today"?new Date().toISOString().split("T")[0]:e}createNameField(e){let t=`${this.instanceId}-${e.name}`,n=document.createElement("div");n.className="canopy-field canopy-name-group",n.setAttribute("role","group");let i=e.options||{},r=Y(i.parts||A),c=S(i,e.required),s=e.label||H,p=r.includes("single");if(p)n.setAttribute("aria-label",s);else{let y=document.createElement("span");y.id=`${t}-group-label`,y.className="canopy-label",y.dataset.fieldPart="label",y.textContent=s,n.appendChild(y),n.setAttribute("aria-labelledby",y.id)}let o=document.createElement("div");o.className="canopy-name-parts";let l=document.createElement("input");l.type="hidden",l.id=t,l.name=e.name;let m=document.createElement("span");if(m.className="canopy-error",m.id=`${t}-error`,r.forEach(y=>{let h=document.createElement("div");h.className=y==="middleInitial"?"canopy-name-part canopy-name-part-initial":"canopy-name-part";let d=document.createElement("label");d.className=p?"canopy-label":"canopy-name-part-label";let u=`${t}-${y}`;d.htmlFor=u,d.textContent=p?s:N(y,i.partLabels),d.dataset.fieldPart=p?"label":`label-${y}`;let b=c.includes(y);if(b){let g=document.createElement("span");g.className="canopy-required",g.textContent=" *",g.setAttribute("aria-hidden","true"),d.appendChild(g)}let f=document.createElement("input");f.type="text",f.className="canopy-input",f.id=u,f.name=`${e.name}.${y}`,f.setAttribute("data-name-part",y),f.setAttribute("data-name-field",e.name),y==="middleInitial"&&(f.maxLength=2),b&&f.setAttribute("aria-required","true"),f.addEventListener("input",()=>{o.querySelectorAll("input[data-name-part]").forEach(g=>g.setCustomValidity(""))}),h.appendChild(d),h.appendChild(f),o.appendChild(h)}),n.appendChild(o),e.helpText){let y=document.createElement("p");y.className="canopy-help-text",y.textContent=e.helpText,n.appendChild(y)}return n.appendChild(m),{wrapper:n,input:l,errorEl:m}}createAddressField(e){let t=`${this.instanceId}-${e.name}`,n=e.options||{},i=document.createElement("div");i.className="canopy-field canopy-address-group",i.setAttribute("role","group"),i.setAttribute("aria-labelledby",`${t}-group-label`);let r=document.createElement("span");r.id=`${t}-group-label`,r.className="canopy-label",r.dataset.fieldPart="label",r.textContent=e.label||"Address",i.appendChild(r);let c=document.createElement("div");c.className="canopy-address-parts";let s=document.createElement("input");s.type="hidden",s.id=t,s.name=e.name;let p=document.createElement("span");p.className="canopy-error",p.id=`${t}-error`;let o={postalCode:{maxlength:"10",inputmode:"numeric"}},l=R(n,e.required);if(I(n).forEach(m=>{let y=l.includes(m),h=document.createElement("div");h.className=`canopy-address-part canopy-address-part-${m}`;let d=document.createElement("label");d.className="canopy-address-part-label";let u=`${t}-${m}`;if(d.htmlFor=u,d.textContent=$(m,n.partLabels),d.dataset.fieldPart=`label-${m}`,y){let f=document.createElement("span");f.className="canopy-required",f.textContent=" *",f.setAttribute("aria-hidden","true"),d.appendChild(f)}let b;if(m==="region"){let f=document.createElement("select");f.className="canopy-select";let g=document.createElement("option");g.value="",g.textContent="Select...",f.appendChild(g),ae.forEach(E=>{let P=document.createElement("option");P.value=E.value,P.textContent=E.label,f.appendChild(P)}),f.addEventListener("change",()=>{c.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(E=>E.setCustomValidity(""))}),b=f}else{let f=document.createElement("input");f.type="text",f.className="canopy-input",o[m]&&Object.entries(o[m]).forEach(([g,E])=>f.setAttribute(g,E)),f.addEventListener("input",()=>{c.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(g=>g.setCustomValidity(""))}),b=f}b.id=u,b.setAttribute("data-address-part",m),b.setAttribute("data-address-field",e.name),y&&b.setAttribute("aria-required","true"),h.appendChild(d),h.appendChild(b),c.appendChild(h)}),i.appendChild(c),e.helpText){let m=document.createElement("p");m.className="canopy-help-text",m.textContent=e.helpText,i.appendChild(m)}return i.appendChild(p),{wrapper:i,input:s,errorEl:p}}collectValues(){let e={};return this.fieldElements.forEach((t,n)=>{if(t.input instanceof HTMLInputElement)if(t.input.type==="checkbox")e[n]=t.input.checked;else if(t.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${n}"]`);if(i){let r=[];i.querySelectorAll("input[type=checkbox]:checked").forEach(c=>{var p;if(c.value!==C){r.push(c.value);return}let s=(p=i.querySelector("[data-choice-other]"))==null?void 0:p.value.trim();s&&r.push(s)}),e[n]=r}else{let r=this.container.querySelectorAll(`input[data-name-field="${n}"]`);if(r.length>0){let c={};r.forEach(s=>{let p=s,o=p.getAttribute("data-name-part");o&&(c[o]=p.value)}),e[n]=c}else{let c=this.container.querySelectorAll(`input[data-address-field="${n}"], select[data-address-field="${n}"]`);if(c.length>0){let s={};c.forEach(p=>{let o=p.getAttribute("data-address-part");o&&(s[o]=p.value)}),e[n]=s}else e[n]=t.input.value}}}else e[n]=t.input.value;else t.input instanceof HTMLSelectElement&&t.input.value===C&&t.input.__otherInput?e[n]=t.input.__otherInput.value:e[n]=t.input.value}),e}findFailingInput(e){let t=this.container.querySelectorAll(`input[data-name-field="${e}"]`),n=r=>r.getAttribute("aria-required")==="true"&&!r.value.trim();if(t.length>0){for(let r of t)if(n(r))return r;return t[0]}let i=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(i.length>0){for(let r of i)if(n(r))return r;for(let r of i)if(r.getAttribute("data-address-part")==="postalCode")return r;return i[0]}return null}showErrors(e){this.fieldElements.forEach((n,i)=>{let r=e[i]||"";if(n.input.type==="hidden"){let c=this.container.querySelector(`[data-checkbox-group="${i}"]`);if(c){let s=c.querySelector("input[type=checkbox]");s&&s.setCustomValidity(r)}else{let s=r?this.findFailingInput(i):null;s?s.setCustomValidity(r):this.container.querySelectorAll(`input[data-name-field="${i}"], input[data-address-field="${i}"], select[data-address-field="${i}"]`).forEach(o=>o.setCustomValidity(""))}}else n.input.setCustomValidity(r);n.errorEl.textContent=r,n.input.setAttribute("aria-invalid",r?"true":"false")});let t=Object.keys(e);if(t.length>0){let n=this.fieldElements.get(t[0]);if(n)if(n.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${t[0]}"]`);if(i){let r=i.querySelector("input[type=checkbox]");r&&(r.reportValidity(),r.focus())}else{let r=this.findFailingInput(t[0]);r&&(r.reportValidity(),r.focus())}}else n.input.reportValidity(),n.input.focus()}}setStatus(e,t){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${t}`)}async handleSubmit(e){var i,r,c;if(e.preventDefault(),!this.formDefinition||this.options.preview)return;this.setStatus("","info"),this.fieldElements.forEach((s,p)=>{if(s.input.setCustomValidity(""),s.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${p}"]`);if(o){let l=o.querySelector("input[type=checkbox]");l&&l.setCustomValidity("")}else this.container.querySelectorAll(`input[data-name-field="${p}"], input[data-address-field="${p}"], select[data-address-field="${p}"]`).forEach(m=>m.setCustomValidity(""))}});let t=this.collectValues(),n=ne(this.formDefinition.fields,t);if(this.showErrors(n),Object.keys(n).length>0){let s=Object.keys(n).length;this.setStatus(`Please fix ${s} field${s>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let s=this.options.baseUrl||"",p=this.options.formId||((i=this.formDefinition)==null?void 0:i.formId);if(!p){this.setStatus("Form configuration error.","error");return}let o=await fetch(`${s}/api/embed/${p}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),l=await o.json();if(!o.ok){l!=null&&l.fields&&this.showErrors(l.fields),this.setStatus((l==null?void 0:l.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(s){console.error(s),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let s=((c=(r=this.formDefinition)==null?void 0:r.defaultTheme)==null?void 0:c.buttonText)||"Submit";this.submitButton.textContent=s,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let t=this.container.querySelector(".canopy-success");t&&t.remove();let n=document.createElement("div");n.className="canopy-success",n.setAttribute("role","status"),n.setAttribute("aria-live","polite");let i=document.createElement("div");i.className="canopy-success-icon",i.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',n.appendChild(i);let r=document.createElement("p");r.className="canopy-success-message",r.textContent=e,n.appendChild(r);let c=document.createElement("button");c.type="button",c.className="canopy-success-reset",c.textContent="Submit another response",c.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),n.appendChild(c),this.container.appendChild(n)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let t=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],n=0,i=document.createElement("div");i.className="canopy-skeleton-bar canopy-skeleton-title",i.style.animationDelay=`${n}s`,e.appendChild(i),n+=.15;let r=document.createElement("div");r.className="canopy-skeleton-bar canopy-skeleton-desc",r.style.animationDelay=`${n}s`,e.appendChild(r),n+=.15;for(let s of t){let p=document.createElement("div");p.className="canopy-skeleton-field";let o=document.createElement("div");o.className="canopy-skeleton-bar canopy-skeleton-label",o.style.width=s.labelW,o.style.animationDelay=`${n}s`,p.appendChild(o),n+=.1;let l=document.createElement("div");l.className=`canopy-skeleton-bar canopy-skeleton-${s.type}`,l.style.animationDelay=`${n}s`,p.appendChild(l),n+=.15,e.appendChild(p)}let c=document.createElement("div");c.className="canopy-skeleton-bar canopy-skeleton-button",c.style.animationDelay=`${n}s`,e.appendChild(c),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let t=document.createElement("div");t.className="canopy-status canopy-status-error",t.textContent=e,this.container.appendChild(t),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let t=document.createElement("h2");t.className="canopy-inactive-heading",t.textContent="Form Not Available",e.appendChild(t);let n=document.createElement("p");n.className="canopy-inactive-body",n.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(n),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderHostedOnly(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let t=document.createElement("h2");t.className="canopy-inactive-heading",t.textContent="Form Not Available",e.appendChild(t);let n=document.createElement("p");n.className="canopy-inactive-body",n.textContent="This form is only available at its hosted URL and cannot be embedded. Please contact the form owner.",e.appendChild(n),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}};var re=`
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
`;var oe="canopy-embed-styles";function Ce(){if(document.getElementById(oe))return;let a=document.createElement("style");a.id=oe,a.textContent=re,document.head.appendChild(a)}function Ae(a){var e;return a.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function Te(a){let e=a.dataset.theme;if(e)try{return JSON.parse(e)}catch(t){console.warn("Canopy Forms: invalid data-theme JSON");return}}function _(){Ce(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let t=e.dataset.canopyForm;if(!t){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let n=Te(e),i=Ae(e);new L(e,{formId:t,themeOverrides:n,baseUrl:i}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",_):_();window.CanopyForms={init:_,CanopyForm:L};})();
