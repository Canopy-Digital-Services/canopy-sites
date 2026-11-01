"use strict";(()=>{var x={fontSize:16,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:28,titleWeight:"normal",titleAlign:"left",labelSize:18,labelWeight:"normal"},k=new Set;function E(i,e){if(!i)return e;let n=i.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:e:e}function P(i){if(!i)return{};let{headingFont:e,...n}=i;return e?{titleFont:e,labelFont:e,...n}:n}function z(i,e){return{...x,...P(i),...P(e)}}function J(i){let e=/^#?([0-9a-f]{6})$/i.exec(i.trim());if(!e)return null;let n=parseInt(e[1],16);return[n>>16&255,n>>8&255,n&255]}function Q(i,e,n){let[t,s,a]=[i,e,n].map(c=>{let u=c/255;return u<=.03928?u/12.92:Math.pow((u+.055)/1.055,2.4)});return .2126*t+.7152*s+.0722*a}function H(i){let e=J(i);return e?Q(...e):null}function ee(i,e){let n=H(i);if(n===null||n<=.179)return"#ffffff";let t=H(e);return t!==null&&(n+.05)/(t+.05)>=4.5?e:x.text}function q(i,e){var r,l,f,h,b,p;let n=R(e.bodyFont,e.fontFamily);i.style.setProperty("--canopy-font",n);for(let[o,d]of[["--canopy-title-font",e.titleFont],["--canopy-label-font",e.labelFont]]){let y=R(d);i.style.setProperty(o,y==="inherit"?"var(--canopy-font)":y)}i.style.setProperty("--canopy-font-size",`${(r=e.fontSize)!=null?r:x.fontSize}px`);let t=E(e.text,x.text);i.style.setProperty("--canopy-text",t),i.style.setProperty("--canopy-bg",E(e.background,x.background)),i.style.setProperty("--canopy-field-bg",E(e.fieldBackground,x.fieldBackground));let s=E(e.primary,x.primary);i.style.setProperty("--canopy-primary",s),i.style.setProperty("--canopy-button-text",E(e.buttonTextColor,"")||ee(s,t)),i.style.setProperty("--canopy-border",E(e.border,x.border)),i.style.setProperty("--canopy-radius",`${(l=e.radius)!=null?l:x.radius}px`),i.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),i.style.setProperty("--canopy-button-align",e.buttonAlign||x.buttonAlign);let a={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"},c=(o,d)=>{var m;let y=Number(o);return y>0?`${y}px`:(m=a[String(o)])!=null?m:`${Number(d)}px`};i.style.setProperty("--canopy-title-size",c(e.titleSize,x.titleSize)),i.style.setProperty("--canopy-label-size",c(e.labelSize,x.labelSize));let u={light:"300",normal:"400",medium:"500",bold:"700",semibold:"700"};i.style.setProperty("--canopy-title-weight",(h=u[(f=e.titleWeight)!=null?f:"normal"])!=null?h:"400"),i.style.setProperty("--canopy-label-weight",(p=u[(b=e.labelWeight)!=null?b:"normal"])!=null?p:"400");for(let[o,d]of[["--canopy-title-color",e.titleColor],["--canopy-label-color",e.labelColor]]){let y=d?E(d,""):"";y?i.style.setProperty(o,y):i.style.removeProperty(o)}i.style.setProperty("--canopy-title-align",e.titleAlign==="center"?"center":"left")}function _(i){switch(i.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function R(i,e){return i&&i!=="inherit"?`'${i}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function W(i,e){let n=i.filter(c=>!!c&&c!=="inherit"&&!k.has(c));if(n.length===0)return;let t=n.map(c=>`family=${encodeURIComponent(c)}`).join("&"),s=`${e}/api/fonts?${t}`,a=document.createElement("link");a.rel="stylesheet",a.href=s,a.dataset.canopyFont="true",document.head.appendChild(a),n.forEach(c=>k.add(c))}function V(i){if(!i||k.has(i))return;let e=document.createElement("link");e.rel="stylesheet",e.href=i,e.dataset.canopyFont="true",document.head.appendChild(e),k.add(i)}var M="Name",te={first:"First",middle:"Middle",middleInitial:"M.I.",last:"Last",single:M},C=["first","last"],B=["first","middle","middleInitial","last","single"];function U(i){return[...i].sort((e,n)=>B.indexOf(e)-B.indexOf(n))}function S(i,e){var t;if(i!=null&&i.requiredParts)return i.requiredParts;let n=(t=i==null?void 0:i.parts)!=null?t:C;return e?n.filter(s=>s!=="middle"&&s!=="middleInitial"):[]}function N(i,e){return(e==null?void 0:e[i])||te[i]||i}var ne={line1:"Street",line2:"Apt, suite",city:"City",region:"State",postalCode:"ZIP"},j=["line1","line2","city","region","postalCode"];function F(i){var n;let e=(n=i==null?void 0:i.parts)!=null?n:j;return j.filter(t=>e.includes(t))}function L(i,e){return(e==null?void 0:e[i])||ne[i]||i}function I(i,e){return i!=null&&i.requiredParts?i.requiredParts:e?F(i).filter(n=>n!=="line2"):[]}var ae=/^\d{5}(-\d{4})?$/;function Z(i,e,n){let t=F(e),s=I(e,n),a=c=>{var u;return String((u=i==null?void 0:i[c])!=null?u:"").trim()};for(let c of t)if(s.includes(c)&&!a(c))return`${L(c,e==null?void 0:e.partLabels)} is required.`;return t.includes("postalCode")&&a("postalCode")&&!ae.test(a("postalCode"))?`${L("postalCode",e==null?void 0:e.partLabels)} must be a US ZIP code, like 12345 or 12345-6789.`:null}var re={TEXT:200,EMAIL:254,TEXTAREA:2e3};function D(i){var e;return(e=i.validation)!=null&&e.maxLength?i.validation.maxLength:re[i.type]}function oe(i){return i.label||i.name}function K(i,e){let n={};return i.forEach(t=>{var r,l,f,h,b;let s=e[t.name],a=oe(t);if(t.required){if(t.type==="CHECKBOX"){if(!s){n[t.name]=`${a} is required.`;return}}else if(t.type==="CHECKBOXES"){if(!Array.isArray(s)||s.length===0){n[t.name]=`${a} is required.`;return}}else if(t.type!=="NAME"){if(t.type!=="ADDRESS"){if(s==null||String(s).trim()===""){n[t.name]=`${a} is required.`;return}}}}if(t.type==="CHECKBOXES"){if(Array.isArray(s)&&s.length>0){let p=t.options,d=p&&typeof p=="object"&&"options"in p?p.options.map(y=>y.value):[];for(let y of s)if(!d.includes(String(y))){n[t.name]=`${a} contains an invalid option.`;return}}return}if(!(t.type==="NAME"||t.type==="ADDRESS")){if(s==null||String(s).trim()==="")return}if(t.type==="EMAIL"){let p=String(s);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(p)){n[t.name]="Enter a valid email address";return}let d=(r=t.validation)==null?void 0:r.domainRules;if(d){let y=(l=p.split("@")[1])==null?void 0:l.toLowerCase();if(d.allow&&d.allow.length>0&&!d.allow.map(g=>g.toLowerCase()).includes(y)){n[t.name]=`${a} must be from an allowed domain.`;return}if(d.block&&d.block.length>0&&d.block.map(g=>g.toLowerCase()).includes(y)){n[t.name]=`${a} domain is not allowed.`;return}}}if(t.type==="PHONE"){let p=String(s),o=((f=t.validation)==null?void 0:f.format)||"lenient";if(o==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(p)){n[t.name]=`${a} must be a valid phone number.`;return}}else if(o==="strict"){let d=p.replace(/[^\d+]/g,"");if(d.startsWith("+1"))d=d.substring(2);else if(d.startsWith("+")){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}else d.startsWith("1")&&d.length===11&&(d=d.substring(1));if(!/^\d{10}$/.test(d)){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}}return}if(t.type==="DATE"){let p=String(s),o=new Date(p);if(isNaN(o.getTime())){n[t.name]=`${a} must be a valid date.`;return}let d=new Date;d.setHours(0,0,0,0),o.setHours(0,0,0,0);let y=t.validation;if(y!=null&&y.minDate){let m=new Date(y.minDate==="today"?d:y.minDate);if(m.setHours(0,0,0,0),o<m){n[t.name]=`${a} must be on or after ${m.toLocaleDateString()}.`;return}}if(y!=null&&y.maxDate){let m=new Date(y.maxDate==="today"?d:y.maxDate);if(m.setHours(0,0,0,0),o>m){n[t.name]=`${a} must be on or before ${m.toLocaleDateString()}.`;return}}}if(t.type==="NUMBER"){let p=Number(s);if(isNaN(p)){n[t.name]=`${a} must be a number.`;return}let o=t.validation;if(o!=null&&o.integer&&!Number.isInteger(p)){n[t.name]=`${a} must be a whole number.`;return}if((o==null?void 0:o.min)!==void 0&&p<o.min){n[t.name]=`${a} must be at least ${o.min}.`;return}if((o==null?void 0:o.max)!==void 0&&p>o.max){n[t.name]=`${a} must be at most ${o.max}.`;return}return}if(t.type==="NAME"){let p=s,o=t.options||{},d=o.parts||C,y=S(o,t.required);for(let m of d){let g=p==null?void 0:p[m];if(y.includes(m)&&(!g||g.trim()==="")){let v=m==="single"?a:N(m,o.partLabels);n[t.name]=`${v} is required.`;return}}return}if(t.type==="ADDRESS"){let p=Z(s,t.options,t.required);p&&(n[t.name]=p);return}if(t.type==="DROPDOWN"){let p=t.options,o=p!=null&&typeof p=="object"&&!Array.isArray(p)&&"options"in p,d=o?p.options.map(m=>m.value):Array.isArray(p)?p.map(m=>m.value):[],y=o&&p.allowOther===!0;if(d.length>0&&!y&&!d.includes(String(s))){n[t.name]=`${a} must be a valid option.`;return}}let c=String(s),u=D(t);if((h=t.validation)!=null&&h.minLength&&c.length<t.validation.minLength){n[t.name]=`${a} must be at least ${t.validation.minLength} characters.`;return}if(u&&c.length>u){n[t.name]=`${a} must be at most ${u} characters.`;return}if(t.type==="TEXT"||t.type==="TEXTAREA"){let p=(b=t.validation)==null?void 0:b.format;if(p&&p!=="alphanumeric"){let o=!0,d=`${a} is invalid.`;switch(p){case"numbers":o=/^\d+$/.test(c),d=`${a} must contain only numbers.`;break;case"letters":o=/^[A-Za-z]+$/.test(c),d=`${a} must contain only letters.`;break;case"url":{let y=c.startsWith("http")?c:`https://${c}`;try{o=new URL(y).hostname.includes(".")}catch(m){o=!1}d=`${a} must be a valid URL.`;break}case"postal-us":o=/^\d{5}(-\d{4})?$/.test(c),d=`${a} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":o=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(c),d=`${a} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}o||(n[t.name]=d)}}}),n}var X=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var ie="feedback@canopyds.com",se=0,A=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},w=class extends Error{constructor(e){super(e),this.name="HostedOnlyFormError"}},T=class{constructor(e,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${se++}`;this.container=e,this.options=n}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof A){this.renderInactive();return}if(e instanceof w){this.renderHostedOnly();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var s;let e=this.options.baseUrl||"",n=this.options.formId||((s=this.formDefinition)==null?void 0:s.formId);if(!n)throw new Error("Form configuration error: no formId");let t=await fetch(`${e}/api/embed/${n}`,{method:"GET",credentials:"omit"});if(!t.ok){if(t.status===403)try{let a=await t.json();if((a==null?void 0:a.code)==="FORM_INACTIVE")throw new A(a.error||"Form is inactive");if((a==null?void 0:a.code)==="FORM_HOSTED_ONLY")throw new w(a.error||"Form is only available at its hosted URL")}catch(a){if(a instanceof A||a instanceof w)throw a}throw new Error("Failed to load form definition")}return t.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let n=z(e.defaultTheme,this.options.themeOverrides);q(this.container,n),W([n.bodyFont,n.titleFont,n.labelFont],this.options.baseUrl||""),!n.bodyFont&&!n.titleFont&&!n.labelFont&&V(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(_(n));let t=e.fields&&e.fields.length>0,s=e.title||e.description;if(!t&&!s){this.renderSkeleton();return}if(e.title||e.description){let o=document.createElement("div");if(o.className="canopy-header",e.title){let d=document.createElement("h2");d.className="canopy-title",d.textContent=e.title,o.appendChild(d)}if(e.description){let d=document.createElement("p");d.className="canopy-description",d.textContent=e.description,o.appendChild(d)}this.container.appendChild(o)}let a=document.createElement("div");a.className="canopy-status",a.setAttribute("role","alert"),a.setAttribute("aria-live","assertive"),this.statusEl=a;let c=document.createElement("form");c.className="canopy-form",c.addEventListener("submit",o=>this.handleSubmit(o)),this.formEl=c,e.fields.forEach(o=>{let{wrapper:d,input:y,errorEl:m}=this.createField(o);d&&(d.dataset.fieldName=o.name,c.appendChild(d)),this.fieldElements.set(o.name,{input:y,errorEl:m})});let u=document.createElement("button");u.type="submit",u.className="canopy-submit",u.textContent=n.buttonText||"Submit",this.options.preview&&(u.classList.add("canopy-submit-preview"),u.setAttribute("data-preview-tooltip","For preview only. No submission will be created"));let r=getComputedStyle(this.container),l=r.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",f=r.getPropertyValue("--canopy-button-text").trim()||"#ffffff",h=r.getPropertyValue("--canopy-radius").trim()||"8px",b=r.getPropertyValue("--canopy-button-width").trim()||"100%";u.style.cssText=`
      display: block !important;
      width: ${b} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${h} !important;
      padding: 10px 16px !important;
      font-family: var(--canopy-font, inherit) !important;
      font-size: var(--canopy-font-size, 16px) !important;
      font-weight: 600 !important;
      background: ${l} !important;
      background-color: ${l} !important;
      color: ${f} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=u;let p=document.createElement("div");p.className="canopy-form-actions",p.appendChild(u),c.appendChild(p),this.container.appendChild(a),this.container.appendChild(c),this.container.appendChild(this.renderWatermark(e))}renderWatermark(e){let n=document.createElement("div");n.className="canopy-watermark";let t=document.createElement("span");t.className="canopy-watermark-brand",t.textContent="Powered by Canopy Forms (Beta)",n.appendChild(t);let s=document.createElement("span");s.className="canopy-watermark-sep",s.setAttribute("aria-hidden","true"),s.textContent="\xB7",n.appendChild(s);let a=(e==null?void 0:e.title)||(e==null?void 0:e.name)||(e==null?void 0:e.formId)||"unknown form",c=(e==null?void 0:e.formId)||"unknown",u=`Canopy Forms issue \u2014 ${a}`,r=[`Form: ${a}`,`Form ID: ${c}`,"","Describe the issue:",""].join(`
`),l=`mailto:${ie}?subject=${encodeURIComponent(u)}&body=${encodeURIComponent(r)}`,f=document.createElement("a");return f.className="canopy-watermark-link",f.href=l,f.textContent="Report an issue",f.rel="noopener",n.appendChild(f),n}createField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let s=document.createElement("label");if(s.className="canopy-label",s.dataset.fieldPart="label",s.htmlFor=n,s.textContent=e.label||e.name,e.required){let r=document.createElement("span");r.className="canopy-required",r.textContent=" *",r.setAttribute("aria-hidden","true"),s.appendChild(r)}let a;switch(e.type){case"TEXTAREA":{let r=document.createElement("textarea");r.className="canopy-textarea";let l=D(e);if(l){let f=Math.min(Math.max(Math.ceil(l/60),4),15);r.rows=f}else r.rows=4;a=r;break}case"DROPDOWN":{let r=e.options,l=r&&typeof r=="object"&&"options"in r&&!Array.isArray(r),f=l?r.options:Array.isArray(r)?r:[],h=l?r.defaultValue:void 0,b=l?r.allowOther:!1,p=document.createElement("select");if(p.className="canopy-select",!h){let o=document.createElement("option");o.value="",o.textContent="Choose one...",o.disabled=!0,o.selected=!0,p.appendChild(o)}if(f.forEach(o=>{let d=document.createElement("option");d.value=o.value,d.textContent=o.label,h&&o.value===h&&(d.selected=!0),p.appendChild(d)}),b){let o=document.createElement("option");o.value="__other__",o.textContent="Other",p.appendChild(o)}if(a=p,b){let o=document.createElement("input");o.type="text",o.className="canopy-input canopy-select-other",o.name=`${e.name}_other`,o.placeholder="Please specify...",o.style.setProperty("display","none","important"),o.style.marginTop="0.5rem",o.addEventListener("input",()=>{o.setCustomValidity("")}),p.addEventListener("change",()=>{p.value==="__other__"?(o.style.setProperty("display","block","important"),e.required&&(o.required=!0)):(o.style.setProperty("display","none","important"),o.required=!1,o.value="")}),p.__otherInput=o}break}case"CHECKBOX":{let r=document.createElement("label");r.className="canopy-checkbox";let l=document.createElement("input");l.type="checkbox",l.id=n,l.name=e.name,e.required&&l.setAttribute("aria-required","true"),l.addEventListener("change",()=>{l.setCustomValidity("")}),r.appendChild(l);let f=document.createElement("span");if(f.dataset.fieldPart="label",f.textContent=e.label||e.name,r.appendChild(f),t.appendChild(r),e.helpText){let b=document.createElement("p");b.className="canopy-help-text",b.textContent=e.helpText,t.appendChild(b)}let h=document.createElement("span");return h.className="canopy-error",h.id=`${n}-error`,t.appendChild(h),l.setAttribute("aria-describedby",h.id),l.setAttribute("aria-invalid","false"),{wrapper:t,input:l,errorEl:h}}case"CHECKBOXES":{let r=e.options,f=r&&typeof r=="object"&&"options"in r&&!Array.isArray(r)?r.options:Array.isArray(r)?r:[],h=document.createElement("div");h.className="canopy-checkboxes",h.setAttribute("data-checkbox-group",e.name),f.forEach(o=>{let d=document.createElement("label");d.className="canopy-checkbox";let y=document.createElement("input");y.type="checkbox",y.name=e.name,y.value=o.value,y.addEventListener("change",()=>{let g=h.querySelector("input[type=checkbox]");g&&g.setCustomValidity("")});let m=document.createElement("span");m.textContent=o.label,d.appendChild(y),d.appendChild(m),h.appendChild(d)});let b=document.createElement("input");if(b.type="hidden",b.id=n,b.name=e.name,t.appendChild(s),t.appendChild(h),e.helpText){let o=document.createElement("p");o.className="canopy-help-text",o.textContent=e.helpText,t.appendChild(o)}let p=document.createElement("span");return p.className="canopy-error",p.id=`${n}-error`,t.appendChild(p),b.setAttribute("aria-describedby",p.id),b.setAttribute("aria-invalid","false"),{wrapper:t,input:b,errorEl:p}}case"EMAIL":{let r=document.createElement("input");r.type="email",r.className="canopy-input",a=r;break}case"PHONE":{let r=document.createElement("input");r.type="tel",r.setAttribute("inputmode","tel"),r.setAttribute("autocomplete","tel"),r.className="canopy-input",a=r;break}case"DATE":{let r=document.createElement("input");r.type="date",r.className="canopy-input";let l=e.validation;l&&(l.minDate&&(r.min=this.resolveDate(l.minDate)),l.maxDate&&(r.max=this.resolveDate(l.maxDate))),a=r;break}case"NUMBER":{let r=document.createElement("input");r.type="number",r.className="canopy-input";let l=e.validation;l!=null&&l.integer?(r.setAttribute("inputmode","numeric"),r.setAttribute("step","1")):(r.setAttribute("inputmode","decimal"),r.setAttribute("step","any")),(l==null?void 0:l.min)!==void 0&&r.setAttribute("min",String(l.min)),(l==null?void 0:l.max)!==void 0&&r.setAttribute("max",String(l.max)),a=r;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);default:{let r=document.createElement("input");r.type="text",r.className="canopy-input",a=r}}a.id=n,a.name=e.name,a.setAttribute("aria-invalid","false"),e.required&&a.setAttribute("aria-required","true"),e.placeholder&&a.setAttribute("placeholder",e.placeholder);let c=D(e);c&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=c),a.addEventListener("input",()=>{a.setCustomValidity("")});let u=document.createElement("span");if(u.className="canopy-error",u.id=`${n}-error`,a.setAttribute("aria-describedby",u.id),t.appendChild(s),t.appendChild(a),a.__otherInput&&t.appendChild(a.__otherInput),e.helpText){let r=document.createElement("p");r.className="canopy-help-text",r.textContent=e.helpText,t.appendChild(r)}return t.appendChild(u),{wrapper:t,input:a,errorEl:u}}resolveDate(e){return e==="today"?new Date().toISOString().split("T")[0]:e}createNameField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-name-group",t.setAttribute("role","group");let s=e.options||{},a=U(s.parts||C),c=S(s,e.required),u=e.label||M,r=a.includes("single");if(r)t.setAttribute("aria-label",u);else{let b=document.createElement("span");b.id=`${n}-group-label`,b.className="canopy-label",b.dataset.fieldPart="label",b.textContent=u,t.appendChild(b),t.setAttribute("aria-labelledby",b.id)}let l=document.createElement("div");l.className="canopy-name-parts";let f=document.createElement("input");f.type="hidden",f.id=n,f.name=e.name;let h=document.createElement("span");if(h.className="canopy-error",h.id=`${n}-error`,a.forEach(b=>{let p=document.createElement("div");p.className=b==="middleInitial"?"canopy-name-part canopy-name-part-initial":"canopy-name-part";let o=document.createElement("label");o.className=r?"canopy-label":"canopy-name-part-label";let d=`${n}-${b}`;o.htmlFor=d,o.textContent=r?u:N(b,s.partLabels),o.dataset.fieldPart=r?"label":`label-${b}`;let y=c.includes(b);if(y){let g=document.createElement("span");g.className="canopy-required",g.textContent=" *",g.setAttribute("aria-hidden","true"),o.appendChild(g)}let m=document.createElement("input");m.type="text",m.className="canopy-input",m.id=d,m.name=`${e.name}.${b}`,m.setAttribute("data-name-part",b),m.setAttribute("data-name-field",e.name),b==="middleInitial"&&(m.maxLength=2),y&&m.setAttribute("aria-required","true"),m.addEventListener("input",()=>{l.querySelectorAll("input[data-name-part]").forEach(g=>g.setCustomValidity(""))}),p.appendChild(o),p.appendChild(m),l.appendChild(p)}),t.appendChild(l),e.helpText){let b=document.createElement("p");b.className="canopy-help-text",b.textContent=e.helpText,t.appendChild(b)}return t.appendChild(h),{wrapper:t,input:f,errorEl:h}}createAddressField(e){let n=`${this.instanceId}-${e.name}`,t=e.options||{},s=document.createElement("div");s.className="canopy-field canopy-address-group",s.setAttribute("role","group"),s.setAttribute("aria-labelledby",`${n}-group-label`);let a=document.createElement("span");a.id=`${n}-group-label`,a.className="canopy-label",a.dataset.fieldPart="label",a.textContent=e.label||"Address",s.appendChild(a);let c=document.createElement("div");c.className="canopy-address-parts";let u=document.createElement("input");u.type="hidden",u.id=n,u.name=e.name;let r=document.createElement("span");r.className="canopy-error",r.id=`${n}-error`;let l={postalCode:{maxlength:"10",inputmode:"numeric"}},f=I(t,e.required);if(F(t).forEach(h=>{let b=f.includes(h),p=document.createElement("div");p.className=`canopy-address-part canopy-address-part-${h}`;let o=document.createElement("label");o.className="canopy-address-part-label";let d=`${n}-${h}`;if(o.htmlFor=d,o.textContent=L(h,t.partLabels),o.dataset.fieldPart=`label-${h}`,b){let m=document.createElement("span");m.className="canopy-required",m.textContent=" *",m.setAttribute("aria-hidden","true"),o.appendChild(m)}let y;if(h==="region"){let m=document.createElement("select");m.className="canopy-select";let g=document.createElement("option");g.value="",g.textContent="Select...",m.appendChild(g),X.forEach(v=>{let $=document.createElement("option");$.value=v.value,$.textContent=v.label,m.appendChild($)}),m.addEventListener("change",()=>{c.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(v=>v.setCustomValidity(""))}),y=m}else{let m=document.createElement("input");m.type="text",m.className="canopy-input",l[h]&&Object.entries(l[h]).forEach(([g,v])=>m.setAttribute(g,v)),m.addEventListener("input",()=>{c.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(g=>g.setCustomValidity(""))}),y=m}y.id=d,y.setAttribute("data-address-part",h),y.setAttribute("data-address-field",e.name),b&&y.setAttribute("aria-required","true"),p.appendChild(o),p.appendChild(y),c.appendChild(p)}),s.appendChild(c),e.helpText){let h=document.createElement("p");h.className="canopy-help-text",h.textContent=e.helpText,s.appendChild(h)}return s.appendChild(r),{wrapper:s,input:u,errorEl:r}}collectValues(){let e={};return this.fieldElements.forEach((n,t)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")e[t]=n.input.checked;else if(n.input.type==="hidden"){let s=this.container.querySelector(`[data-checkbox-group="${t}"]`);if(s){let a=[];s.querySelectorAll("input[type=checkbox]:checked").forEach(c=>{a.push(c.value)}),e[t]=a}else{let a=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(a.length>0){let c={};a.forEach(u=>{let r=u,l=r.getAttribute("data-name-part");l&&(c[l]=r.value)}),e[t]=c}else{let c=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(c.length>0){let u={};c.forEach(r=>{let l=r.getAttribute("data-address-part");l&&(u[l]=r.value)}),e[t]=u}else e[t]=n.input.value}}}else e[t]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?e[t]=n.input.__otherInput.value:e[t]=n.input.value}),e}findFailingInput(e){let n=this.container.querySelectorAll(`input[data-name-field="${e}"]`),t=a=>a.getAttribute("aria-required")==="true"&&!a.value.trim();if(n.length>0){for(let a of n)if(t(a))return a;return n[0]}let s=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(s.length>0){for(let a of s)if(t(a))return a;for(let a of s)if(a.getAttribute("data-address-part")==="postalCode")return a;return s[0]}return null}showErrors(e){this.fieldElements.forEach((t,s)=>{let a=e[s]||"";if(t.input.type==="hidden"){let c=this.container.querySelector(`[data-checkbox-group="${s}"]`);if(c){let u=c.querySelector("input[type=checkbox]");u&&u.setCustomValidity(a)}else{let u=a?this.findFailingInput(s):null;u?u.setCustomValidity(a):this.container.querySelectorAll(`input[data-name-field="${s}"], input[data-address-field="${s}"], select[data-address-field="${s}"]`).forEach(l=>l.setCustomValidity(""))}}else t.input.setCustomValidity(a);t.errorEl.textContent=a,t.input.setAttribute("aria-invalid",a?"true":"false")});let n=Object.keys(e);if(n.length>0){let t=this.fieldElements.get(n[0]);if(t)if(t.input.type==="hidden"){let s=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(s){let a=s.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.findFailingInput(n[0]);a&&(a.reportValidity(),a.focus())}}else t.input.reportValidity(),t.input.focus()}}setStatus(e,n){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(e){var s,a,c;if(e.preventDefault(),!this.formDefinition||this.options.preview)return;this.setStatus("","info"),this.fieldElements.forEach((u,r)=>{if(u.input.setCustomValidity(""),u.input.type==="hidden"){let l=this.container.querySelector(`[data-checkbox-group="${r}"]`);if(l){let f=l.querySelector("input[type=checkbox]");f&&f.setCustomValidity("")}else this.container.querySelectorAll(`input[data-name-field="${r}"], input[data-address-field="${r}"], select[data-address-field="${r}"]`).forEach(h=>h.setCustomValidity(""))}});let n=this.collectValues(),t=K(this.formDefinition.fields,n);if(this.showErrors(t),Object.keys(t).length>0){let u=Object.keys(t).length;this.setStatus(`Please fix ${u} field${u>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let u=this.options.baseUrl||"",r=this.options.formId||((s=this.formDefinition)==null?void 0:s.formId);if(!r){this.setStatus("Form configuration error.","error");return}let l=await fetch(`${u}/api/embed/${r}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),f=await l.json();if(!l.ok){f!=null&&f.fields&&this.showErrors(f.fields),this.setStatus((f==null?void 0:f.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(u){console.error(u),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let u=((c=(a=this.formDefinition)==null?void 0:a.defaultTheme)==null?void 0:c.buttonText)||"Submit";this.submitButton.textContent=u,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let n=this.container.querySelector(".canopy-success");n&&n.remove();let t=document.createElement("div");t.className="canopy-success",t.setAttribute("role","status"),t.setAttribute("aria-live","polite");let s=document.createElement("div");s.className="canopy-success-icon",s.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',t.appendChild(s);let a=document.createElement("p");a.className="canopy-success-message",a.textContent=e,t.appendChild(a);let c=document.createElement("button");c.type="button",c.className="canopy-success-reset",c.textContent="Submit another response",c.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),t.appendChild(c),this.container.appendChild(t)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let n=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],t=0,s=document.createElement("div");s.className="canopy-skeleton-bar canopy-skeleton-title",s.style.animationDelay=`${t}s`,e.appendChild(s),t+=.15;let a=document.createElement("div");a.className="canopy-skeleton-bar canopy-skeleton-desc",a.style.animationDelay=`${t}s`,e.appendChild(a),t+=.15;for(let u of n){let r=document.createElement("div");r.className="canopy-skeleton-field";let l=document.createElement("div");l.className="canopy-skeleton-bar canopy-skeleton-label",l.style.width=u.labelW,l.style.animationDelay=`${t}s`,r.appendChild(l),t+=.1;let f=document.createElement("div");f.className=`canopy-skeleton-bar canopy-skeleton-${u.type}`,f.style.animationDelay=`${t}s`,r.appendChild(f),t+=.15,e.appendChild(r)}let c=document.createElement("div");c.className="canopy-skeleton-bar canopy-skeleton-button",c.style.animationDelay=`${t}s`,e.appendChild(c),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=e,this.container.appendChild(n),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderHostedOnly(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is only available at its hosted URL and cannot be embedded. Please contact the form owner.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}};var G=`
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
`;var Y="canopy-embed-styles";function le(){if(document.getElementById(Y))return;let i=document.createElement("style");i.id=Y,i.textContent=G,document.head.appendChild(i)}function ce(i){var e;return i.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function pe(i){let e=i.dataset.theme;if(e)try{return JSON.parse(e)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function O(){le(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=e.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let t=pe(e),s=ce(e);new T(e,{formId:n,themeOverrides:t,baseUrl:s}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",O):O();window.CanopyForms={init:O,CanopyForm:T};})();
