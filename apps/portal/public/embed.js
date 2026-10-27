"use strict";(()=>{var C={fontSize:16,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:28,titleWeight:"normal",titleAlign:"left",labelSize:"md",labelWeight:"normal",labelTransform:"none"},L=new Set;function A(c,e){if(!c)return e;let n=c.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:e:e}function I(c){if(!c)return{};let{headingFont:e,...n}=c;return e?{titleFont:e,labelFont:e,...n}:n}function H(c,e){return{...C,...I(c),...I(e)}}function U(c){let e=/^#?([0-9a-f]{6})$/i.exec(c.trim());if(!e)return null;let n=parseInt(e[1],16);return[n>>16&255,n>>8&255,n&255]}function j(c,e,n){let[t,r,a]=[c,e,n].map(l=>{let d=l/255;return d<=.03928?d/12.92:Math.pow((d+.055)/1.055,2.4)});return .2126*t+.7152*r+.0722*a}function K(c){try{let e=U(c);return e&&j(...e)>.179?"#18181b":"#ffffff"}catch(e){return"#ffffff"}}function z(c,e){var d,o,i,u,b,g,h,p;let n=O(e.bodyFont,e.fontFamily);c.style.setProperty("--canopy-font",n);for(let[y,v]of[["--canopy-title-font",e.titleFont],["--canopy-label-font",e.labelFont]]){let s=O(v);c.style.setProperty(y,s==="inherit"?"var(--canopy-font)":s)}c.style.setProperty("--canopy-font-size",`${(d=e.fontSize)!=null?d:C.fontSize}px`),c.style.setProperty("--canopy-text",A(e.text,C.text)),c.style.setProperty("--canopy-bg",A(e.background,C.background)),c.style.setProperty("--canopy-field-bg",A(e.fieldBackground,C.fieldBackground));let t=A(e.primary,C.primary);c.style.setProperty("--canopy-primary",t),c.style.setProperty("--canopy-button-text",K(t)),c.style.setProperty("--canopy-border",A(e.border,C.border)),c.style.setProperty("--canopy-radius",`${(o=e.radius)!=null?o:C.radius}px`),c.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),c.style.setProperty("--canopy-button-align",e.buttonAlign||C.buttonAlign);let r={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"},a=Number(e.titleSize);c.style.setProperty("--canopy-title-size",a>0?`${a}px`:(i=r[String(e.titleSize)])!=null?i:`${C.titleSize}px`),c.style.setProperty("--canopy-label-size",r[(u=e.labelSize)!=null?u:"md"]);let l={light:"300",normal:"400",medium:"500",bold:"700",semibold:"700"};c.style.setProperty("--canopy-title-weight",(g=l[(b=e.titleWeight)!=null?b:"normal"])!=null?g:"400"),c.style.setProperty("--canopy-label-weight",(p=l[(h=e.labelWeight)!=null?h:"normal"])!=null?p:"400");for(let[y,v]of[["--canopy-title-color",e.titleColor],["--canopy-label-color",e.labelColor]]){let s=v?A(v,""):"";s?c.style.setProperty(y,s):c.style.removeProperty(y)}c.style.setProperty("--canopy-title-align",e.titleAlign==="center"?"center":"left"),c.style.setProperty("--canopy-label-transform",e.labelTransform==="uppercase"?"uppercase":"none")}function R(c){switch(c.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function O(c,e){return c&&c!=="inherit"?`'${c}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function q(c,e){let n=c.filter(l=>!!l&&l!=="inherit"&&!L.has(l));if(n.length===0)return;let t=n.map(l=>`family=${encodeURIComponent(l)}`).join("&"),r=`${e}/api/fonts?${t}`,a=document.createElement("link");a.rel="stylesheet",a.href=r,a.dataset.canopyFont="true",document.head.appendChild(a),n.forEach(l=>L.add(l))}function P(c){if(!c||L.has(c))return;let e=document.createElement("link");e.rel="stylesheet",e.href=c,e.dataset.canopyFont="true",document.head.appendChild(e),L.add(c)}var Z={TEXT:200,EMAIL:254,TEXTAREA:2e3};function F(c){var e;return(e=c.validation)!=null&&e.maxLength?c.validation.maxLength:Z[c.type]}function X(c){return c.label||c.name}function W(c,e){let n={};return c.forEach(t=>{var o,i,u,b,g,h,p,y,v;let r=e[t.name],a=X(t);if(t.required){if(t.type==="CHECKBOX"){if(!r){n[t.name]=`${a} is required.`;return}}else if(t.type==="CHECKBOXES"){if(!Array.isArray(r)||r.length===0){n[t.name]=`${a} is required.`;return}}else if(t.type!=="NAME"){if(t.type!=="ADDRESS"){if(r==null||String(r).trim()===""){n[t.name]=`${a} is required.`;return}}}}if(t.type==="CHECKBOXES"){if(Array.isArray(r)&&r.length>0){let s=t.options,f=s&&typeof s=="object"&&"options"in s?s.options.map(x=>x.value):[];for(let x of r)if(!f.includes(String(x))){n[t.name]=`${a} contains an invalid option.`;return}}return}if(!(t.type==="NAME"||t.type==="ADDRESS")){if(r==null||String(r).trim()==="")return}if(t.type==="EMAIL"){let s=String(r);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(s)){n[t.name]="Enter a valid email address";return}let f=(o=t.validation)==null?void 0:o.domainRules;if(f){let x=(i=s.split("@")[1])==null?void 0:i.toLowerCase();if(f.allow&&f.allow.length>0&&!f.allow.map(k=>k.toLowerCase()).includes(x)){n[t.name]=`${a} must be from an allowed domain.`;return}if(f.block&&f.block.length>0&&f.block.map(k=>k.toLowerCase()).includes(x)){n[t.name]=`${a} domain is not allowed.`;return}}}if(t.type==="PHONE"){let s=String(r),m=((u=t.validation)==null?void 0:u.format)||"lenient";if(m==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(s)){n[t.name]=`${a} must be a valid phone number.`;return}}else if(m==="strict"){let f=s.replace(/[^\d+]/g,"");if(f.startsWith("+1"))f=f.substring(2);else if(f.startsWith("+")){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}else f.startsWith("1")&&f.length===11&&(f=f.substring(1));if(!/^\d{10}$/.test(f)){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}}return}if(t.type==="DATE"){let s=String(r),m=new Date(s);if(isNaN(m.getTime())){n[t.name]=`${a} must be a valid date.`;return}let f=new Date;f.setHours(0,0,0,0),m.setHours(0,0,0,0);let x=t.validation;if(x!=null&&x.minDate){let E=new Date(x.minDate==="today"?f:x.minDate);if(E.setHours(0,0,0,0),m<E){n[t.name]=`${a} must be on or after ${E.toLocaleDateString()}.`;return}}if(x!=null&&x.maxDate){let E=new Date(x.maxDate==="today"?f:x.maxDate);if(E.setHours(0,0,0,0),m>E){n[t.name]=`${a} must be on or before ${E.toLocaleDateString()}.`;return}}}if(t.type==="NUMBER"){let s=Number(r);if(isNaN(s)){n[t.name]=`${a} must be a number.`;return}let m=t.validation;if(m!=null&&m.integer&&!Number.isInteger(s)){n[t.name]=`${a} must be a whole number.`;return}if((m==null?void 0:m.min)!==void 0&&s<m.min){n[t.name]=`${a} must be at least ${m.min}.`;return}if((m==null?void 0:m.max)!==void 0&&s>m.max){n[t.name]=`${a} must be at most ${m.max}.`;return}return}if(t.type==="NAME"){let s=r,m=t.options||{parts:["first","last"]},f=m.parts||["first","last"],x=m.partsRequired||{};for(let E of f){let k=s[E];if((t.required||x[E])&&(!k||k.trim()==="")){let w=((b=m.partLabels)==null?void 0:b[E])||E;n[t.name]=`${w} is required.`;return}}return}if(t.type==="ADDRESS"){let s=r,m=t.options||{},f=["line1","city","region","postalCode"];if(!(m.showLine2!==!1?["line1","line2","city","region","postalCode"]:f).some(w=>{var M;return(M=s==null?void 0:s[w])==null?void 0:M.trim()})&&!t.required)return;let k={line1:"Street address",city:"City",region:"State",postalCode:"ZIP code"};for(let w of f)if(!((g=s==null?void 0:s[w])!=null&&g.trim())){n[t.name]=`${k[w]} is required.`;return}let D=(p=(h=s==null?void 0:s.postalCode)==null?void 0:h.trim())!=null?p:"";if(!/^\d{5}(-\d{4})?$/.test(D)){n[t.name]="ZIP code must be a valid US postal code (e.g., 12345 or 12345-6789).";return}return}if(t.type==="DROPDOWN"){let s=t.options,m=s!=null&&typeof s=="object"&&!Array.isArray(s)&&"options"in s,f=m?s.options.map(E=>E.value):Array.isArray(s)?s.map(E=>E.value):[],x=m&&s.allowOther===!0;if(f.length>0&&!x&&!f.includes(String(r))){n[t.name]=`${a} must be a valid option.`;return}}let l=String(r),d=F(t);if((y=t.validation)!=null&&y.minLength&&l.length<t.validation.minLength){n[t.name]=`${a} must be at least ${t.validation.minLength} characters.`;return}if(d&&l.length>d){n[t.name]=`${a} must be at most ${d} characters.`;return}if(t.type==="TEXT"||t.type==="TEXTAREA"){let s=(v=t.validation)==null?void 0:v.format;if(s&&s!=="alphanumeric"){let m=!0,f=`${a} is invalid.`;switch(s){case"numbers":m=/^\d+$/.test(l),f=`${a} must contain only numbers.`;break;case"letters":m=/^[A-Za-z]+$/.test(l),f=`${a} must contain only letters.`;break;case"url":{let x=l.startsWith("http")?l:`https://${l}`;try{m=new URL(x).hostname.includes(".")}catch(E){m=!1}f=`${a} must be a valid URL.`;break}case"postal-us":m=/^\d{5}(-\d{4})?$/.test(l),f=`${a} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":m=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(l),f=`${a} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}m||(n[t.name]=f)}}}),n}var V=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var G="feedback@canopyds.com",Y=0,T=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},S=class extends Error{constructor(e){super(e),this.name="HostedOnlyFormError"}},N=class{constructor(e,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${Y++}`;this.container=e,this.options=n}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof T){this.renderInactive();return}if(e instanceof S){this.renderHostedOnly();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var r;let e=this.options.baseUrl||"",n=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!n)throw new Error("Form configuration error: no formId");let t=await fetch(`${e}/api/embed/${n}`,{method:"GET",credentials:"omit"});if(!t.ok){if(t.status===403)try{let a=await t.json();if((a==null?void 0:a.code)==="FORM_INACTIVE")throw new T(a.error||"Form is inactive");if((a==null?void 0:a.code)==="FORM_HOSTED_ONLY")throw new S(a.error||"Form is only available at its hosted URL")}catch(a){if(a instanceof T||a instanceof S)throw a}throw new Error("Failed to load form definition")}return t.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let n=H(e.defaultTheme,this.options.themeOverrides);z(this.container,n),q([n.bodyFont,n.titleFont,n.labelFont],this.options.baseUrl||""),!n.bodyFont&&!n.titleFont&&!n.labelFont&&P(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(R(n));let t=e.fields&&e.fields.length>0,r=e.title||e.description;if(!t&&!r){this.renderSkeleton();return}if(e.title||e.description){let p=document.createElement("div");if(p.className="canopy-header",e.title){let y=document.createElement("h2");y.className="canopy-title",y.textContent=e.title,p.appendChild(y)}if(e.description){let y=document.createElement("p");y.className="canopy-description",y.textContent=e.description,p.appendChild(y)}this.container.appendChild(p)}let a=document.createElement("div");a.className="canopy-status",a.setAttribute("role","alert"),a.setAttribute("aria-live","assertive"),this.statusEl=a;let l=document.createElement("form");l.className="canopy-form",l.addEventListener("submit",p=>this.handleSubmit(p)),this.formEl=l,e.fields.forEach(p=>{let{wrapper:y,input:v,errorEl:s}=this.createField(p);y&&l.appendChild(y),this.fieldElements.set(p.name,{input:v,errorEl:s})});let d=document.createElement("button");d.type="submit",d.className="canopy-submit",d.textContent=n.buttonText||"Submit",this.options.preview&&(d.classList.add("canopy-submit-preview"),d.setAttribute("data-preview-tooltip","For preview only. No submission will be created"));let o=getComputedStyle(this.container),i=o.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",u=o.getPropertyValue("--canopy-button-text").trim()||"#ffffff",b=o.getPropertyValue("--canopy-radius").trim()||"8px",g=o.getPropertyValue("--canopy-button-width").trim()||"100%";d.style.cssText=`
      display: block !important;
      width: ${g} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${b} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${i} !important;
      background-color: ${i} !important;
      color: ${u} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=d;let h=document.createElement("div");h.className="canopy-form-actions",h.appendChild(d),l.appendChild(h),this.container.appendChild(a),this.container.appendChild(l),this.container.appendChild(this.renderWatermark(e))}renderWatermark(e){let n=document.createElement("div");n.className="canopy-watermark";let t=document.createElement("span");t.className="canopy-watermark-brand",t.textContent="Powered by Canopy Forms (Beta)",n.appendChild(t);let r=document.createElement("span");r.className="canopy-watermark-sep",r.setAttribute("aria-hidden","true"),r.textContent="\xB7",n.appendChild(r);let a=(e==null?void 0:e.title)||(e==null?void 0:e.name)||(e==null?void 0:e.formId)||"unknown form",l=(e==null?void 0:e.formId)||"unknown",d=`Canopy Forms issue \u2014 ${a}`,o=[`Form: ${a}`,`Form ID: ${l}`,"","Describe the issue:",""].join(`
`),i=`mailto:${G}?subject=${encodeURIComponent(d)}&body=${encodeURIComponent(o)}`,u=document.createElement("a");return u.className="canopy-watermark-link",u.href=i,u.textContent="Report an issue",u.rel="noopener",n.appendChild(u),n}createField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field",t.dataset.fieldName=e.name;let r=document.createElement("label");if(r.className="canopy-label",r.htmlFor=n,r.textContent=e.label||e.name,e.required){let o=document.createElement("span");o.className="canopy-required",o.textContent=" *",o.setAttribute("aria-hidden","true"),r.appendChild(o)}let a;switch(e.type){case"TEXTAREA":{let o=document.createElement("textarea");o.className="canopy-textarea";let i=F(e);if(i){let u=Math.min(Math.max(Math.ceil(i/60),4),15);o.rows=u}else o.rows=4;a=o;break}case"DROPDOWN":{let o=e.options,i=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o),u=i?o.options:Array.isArray(o)?o:[],b=i?o.defaultValue:void 0,g=i?o.allowOther:!1,h=document.createElement("select");if(h.className="canopy-select",!b){let p=document.createElement("option");p.value="",p.textContent="Choose one...",p.disabled=!0,p.selected=!0,h.appendChild(p)}if(u.forEach(p=>{let y=document.createElement("option");y.value=p.value,y.textContent=p.label,b&&p.value===b&&(y.selected=!0),h.appendChild(y)}),g){let p=document.createElement("option");p.value="__other__",p.textContent="Other",h.appendChild(p)}if(a=h,g){let p=document.createElement("input");p.type="text",p.className="canopy-input canopy-select-other",p.name=`${e.name}_other`,p.placeholder="Please specify...",p.style.setProperty("display","none","important"),p.style.marginTop="0.5rem",p.addEventListener("input",()=>{p.setCustomValidity("")}),h.addEventListener("change",()=>{h.value==="__other__"?(p.style.setProperty("display","block","important"),e.required&&(p.required=!0)):(p.style.setProperty("display","none","important"),p.required=!1,p.value="")}),h.__otherInput=p}break}case"CHECKBOX":{let o=document.createElement("label");o.className="canopy-checkbox";let i=document.createElement("input");i.type="checkbox",i.id=n,i.name=e.name,e.required&&i.setAttribute("aria-required","true"),i.addEventListener("change",()=>{i.setCustomValidity("")}),o.appendChild(i);let u=document.createElement("span");if(u.textContent=e.label||e.name,o.appendChild(u),t.appendChild(o),e.helpText){let g=document.createElement("p");g.className="canopy-help-text",g.textContent=e.helpText,t.appendChild(g)}let b=document.createElement("span");return b.className="canopy-error",b.id=`${n}-error`,t.appendChild(b),i.setAttribute("aria-describedby",b.id),i.setAttribute("aria-invalid","false"),{wrapper:t,input:i,errorEl:b}}case"CHECKBOXES":{let o=e.options,u=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o)?o.options:Array.isArray(o)?o:[],b=document.createElement("div");b.className="canopy-checkboxes",b.setAttribute("data-checkbox-group",e.name),u.forEach(p=>{let y=document.createElement("label");y.className="canopy-checkbox";let v=document.createElement("input");v.type="checkbox",v.name=e.name,v.value=p.value,v.addEventListener("change",()=>{let m=b.querySelector("input[type=checkbox]");m&&m.setCustomValidity("")});let s=document.createElement("span");s.textContent=p.label,y.appendChild(v),y.appendChild(s),b.appendChild(y)});let g=document.createElement("input");if(g.type="hidden",g.id=n,g.name=e.name,t.appendChild(r),t.appendChild(b),e.helpText){let p=document.createElement("p");p.className="canopy-help-text",p.textContent=e.helpText,t.appendChild(p)}let h=document.createElement("span");return h.className="canopy-error",h.id=`${n}-error`,t.appendChild(h),g.setAttribute("aria-describedby",h.id),g.setAttribute("aria-invalid","false"),{wrapper:t,input:g,errorEl:h}}case"EMAIL":{let o=document.createElement("input");o.type="email",o.className="canopy-input",a=o;break}case"PHONE":{let o=document.createElement("input");o.type="tel",o.setAttribute("inputmode","tel"),o.setAttribute("autocomplete","tel"),o.className="canopy-input",a=o;break}case"DATE":{let o=document.createElement("input");o.type="date",o.className="canopy-input";let i=e.validation;i&&(i.minDate&&(o.min=this.resolveDate(i.minDate)),i.maxDate&&(o.max=this.resolveDate(i.maxDate))),a=o;break}case"NUMBER":{let o=document.createElement("input");o.type="number",o.className="canopy-input";let i=e.validation;i!=null&&i.integer?(o.setAttribute("inputmode","numeric"),o.setAttribute("step","1")):(o.setAttribute("inputmode","decimal"),o.setAttribute("step","any")),(i==null?void 0:i.min)!==void 0&&o.setAttribute("min",String(i.min)),(i==null?void 0:i.max)!==void 0&&o.setAttribute("max",String(i.max)),a=o;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);default:{let o=document.createElement("input");o.type="text",o.className="canopy-input",a=o}}a.id=n,a.name=e.name,a.setAttribute("aria-invalid","false"),e.required&&a.setAttribute("aria-required","true"),e.placeholder&&a.setAttribute("placeholder",e.placeholder);let l=F(e);l&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=l),a.addEventListener("input",()=>{a.setCustomValidity("")});let d=document.createElement("span");if(d.className="canopy-error",d.id=`${n}-error`,a.setAttribute("aria-describedby",d.id),t.appendChild(r),t.appendChild(a),a.__otherInput&&t.appendChild(a.__otherInput),e.helpText){let o=document.createElement("p");o.className="canopy-help-text",o.textContent=e.helpText,t.appendChild(o)}return t.appendChild(d),{wrapper:t,input:a,errorEl:d}}resolveDate(e){return e==="today"?new Date().toISOString().split("T")[0]:e}createNameField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-name-group",t.setAttribute("role","group"),t.setAttribute("aria-labelledby",`${n}-group-label`);let r=document.createElement("span");r.id=`${n}-group-label`,r.className="canopy-label",r.textContent=e.label||e.name,t.appendChild(r);let a=e.options||{parts:["first","last"]},l=a.parts||["first","last"],d=a.partLabels||{},o=a.partsRequired||{},i={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},u=document.createElement("div");u.className="canopy-name-parts";let b=document.createElement("input");b.type="hidden",b.id=n,b.name=e.name;let g=document.createElement("span");if(g.className="canopy-error",g.id=`${n}-error`,l.forEach(h=>{let p=document.createElement("div");p.className="canopy-name-part";let y=document.createElement("label");y.className="canopy-name-part-label";let v=`${n}-${h}`;if(y.htmlFor=v,y.textContent=d[h]||i[h]||h,e.required||o[h]){let m=document.createElement("span");m.className="canopy-required",m.textContent=" *",m.setAttribute("aria-hidden","true"),y.appendChild(m)}let s=document.createElement("input");s.type="text",s.className="canopy-input",s.id=v,s.name=`${e.name}.${h}`,s.setAttribute("data-name-part",h),s.setAttribute("data-name-field",e.name),(e.required||o[h])&&s.setAttribute("aria-required","true"),s.addEventListener("input",()=>{u.querySelectorAll("input[data-name-part]").forEach(m=>m.setCustomValidity(""))}),p.appendChild(y),p.appendChild(s),u.appendChild(p)}),t.appendChild(u),e.helpText){let h=document.createElement("p");h.className="canopy-help-text",h.textContent=e.helpText,t.appendChild(h)}return t.appendChild(g),{wrapper:t,input:b,errorEl:g}}createAddressField(e){let n=`${this.instanceId}-${e.name}`,t=e.options||{},r=document.createElement("div");r.className="canopy-field canopy-address-group",r.setAttribute("role","group"),r.setAttribute("aria-labelledby",`${n}-group-label`);let a=document.createElement("span");a.id=`${n}-group-label`,a.className="canopy-label",a.textContent=e.label||"Address",r.appendChild(a);let l=document.createElement("div");l.className="canopy-address-parts";let d=document.createElement("input");d.type="hidden",d.id=n,d.name=e.name;let o=document.createElement("span");o.className="canopy-error",o.id=`${n}-error`;let i=[{key:"line1",label:"Street Address",tag:"input"}];if(t.showLine2!==!1&&i.push({key:"line2",label:"Apt, Suite, etc.",tag:"input"}),i.push({key:"city",label:"City",tag:"input"},{key:"region",label:"State",tag:"select"},{key:"postalCode",label:"ZIP Code",tag:"input",attrs:{maxlength:"10",inputmode:"numeric"}}),i.forEach(u=>{let b=document.createElement("div");b.className="canopy-address-part";let g=document.createElement("label");g.className="canopy-address-part-label";let h=`${n}-${u.key}`;if(g.htmlFor=h,g.textContent=u.label,e.required&&u.key!=="line2"){let y=document.createElement("span");y.className="canopy-required",y.textContent=" *",y.setAttribute("aria-hidden","true"),g.appendChild(y)}let p;if(u.tag==="select"){let y=document.createElement("select");y.className="canopy-select";let v=document.createElement("option");v.value="",v.textContent="Select...",y.appendChild(v),V.forEach(s=>{let m=document.createElement("option");m.value=s.value,m.textContent=s.label,y.appendChild(m)}),y.addEventListener("change",()=>{l.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(s=>s.setCustomValidity(""))}),p=y}else{let y=document.createElement("input");y.type="text",y.className="canopy-input",u.attrs&&Object.entries(u.attrs).forEach(([v,s])=>y.setAttribute(v,s)),y.addEventListener("input",()=>{l.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(v=>v.setCustomValidity(""))}),p=y}p.id=h,p.setAttribute("data-address-part",u.key),p.setAttribute("data-address-field",e.name),e.required&&u.key!=="line2"&&p.setAttribute("aria-required","true"),b.appendChild(g),b.appendChild(p),l.appendChild(b)}),r.appendChild(l),e.helpText){let u=document.createElement("p");u.className="canopy-help-text",u.textContent=e.helpText,r.appendChild(u)}return r.appendChild(o),{wrapper:r,input:d,errorEl:o}}collectValues(){let e={};return this.fieldElements.forEach((n,t)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")e[t]=n.input.checked;else if(n.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${t}"]`);if(r){let a=[];r.querySelectorAll("input[type=checkbox]:checked").forEach(l=>{a.push(l.value)}),e[t]=a}else{let a=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(a.length>0){let l={};a.forEach(d=>{let o=d,i=o.getAttribute("data-name-part");i&&(l[i]=o.value)}),e[t]=l}else{let l=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(l.length>0){let d={};l.forEach(o=>{let i=o.getAttribute("data-address-part");i&&(d[i]=o.value)}),e[t]=d}else e[t]=n.input.value}}}else e[t]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?e[t]=n.input.__otherInput.value:e[t]=n.input.value}),e}findFailingInput(e){let n=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(n.length>0){for(let a of n)if(!a.value.trim())return a;return n[0]}let t=["line1","city","region","postalCode"],r=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(r.length>0){for(let a of r){let l=a.getAttribute("data-address-part");if(l&&t.includes(l)&&!a.value.trim())return a}for(let a of r)if(a.getAttribute("data-address-part")==="postalCode")return a;return r[0]}return null}showErrors(e){this.fieldElements.forEach((t,r)=>{let a=e[r]||"";if(t.input.type==="hidden"){let l=this.container.querySelector(`[data-checkbox-group="${r}"]`);if(l){let d=l.querySelector("input[type=checkbox]");d&&d.setCustomValidity(a)}else{let d=a?this.findFailingInput(r):null;d?d.setCustomValidity(a):this.container.querySelectorAll(`input[data-name-field="${r}"], input[data-address-field="${r}"], select[data-address-field="${r}"]`).forEach(i=>i.setCustomValidity(""))}}else t.input.setCustomValidity(a);t.errorEl.textContent=a,t.input.setAttribute("aria-invalid",a?"true":"false")});let n=Object.keys(e);if(n.length>0){let t=this.fieldElements.get(n[0]);if(t)if(t.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(r){let a=r.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.findFailingInput(n[0]);a&&(a.reportValidity(),a.focus())}}else t.input.reportValidity(),t.input.focus()}}setStatus(e,n){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(e){var r,a,l;if(e.preventDefault(),!this.formDefinition||this.options.preview)return;this.setStatus("","info"),this.fieldElements.forEach((d,o)=>{if(d.input.setCustomValidity(""),d.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${o}"]`);if(i){let u=i.querySelector("input[type=checkbox]");u&&u.setCustomValidity("")}else this.container.querySelectorAll(`input[data-name-field="${o}"], input[data-address-field="${o}"], select[data-address-field="${o}"]`).forEach(b=>b.setCustomValidity(""))}});let n=this.collectValues(),t=W(this.formDefinition.fields,n);if(this.showErrors(t),Object.keys(t).length>0){let d=Object.keys(t).length;this.setStatus(`Please fix ${d} field${d>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let d=this.options.baseUrl||"",o=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!o){this.setStatus("Form configuration error.","error");return}let i=await fetch(`${d}/api/embed/${o}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),u=await i.json();if(!i.ok){u!=null&&u.fields&&this.showErrors(u.fields),this.setStatus((u==null?void 0:u.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(d){console.error(d),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let d=((l=(a=this.formDefinition)==null?void 0:a.defaultTheme)==null?void 0:l.buttonText)||"Submit";this.submitButton.textContent=d,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let n=this.container.querySelector(".canopy-success");n&&n.remove();let t=document.createElement("div");t.className="canopy-success",t.setAttribute("role","status"),t.setAttribute("aria-live","polite");let r=document.createElement("div");r.className="canopy-success-icon",r.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',t.appendChild(r);let a=document.createElement("p");a.className="canopy-success-message",a.textContent=e,t.appendChild(a);let l=document.createElement("button");l.type="button",l.className="canopy-success-reset",l.textContent="Submit another response",l.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),t.appendChild(l),this.container.appendChild(t)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let n=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],t=0,r=document.createElement("div");r.className="canopy-skeleton-bar canopy-skeleton-title",r.style.animationDelay=`${t}s`,e.appendChild(r),t+=.15;let a=document.createElement("div");a.className="canopy-skeleton-bar canopy-skeleton-desc",a.style.animationDelay=`${t}s`,e.appendChild(a),t+=.15;for(let d of n){let o=document.createElement("div");o.className="canopy-skeleton-field";let i=document.createElement("div");i.className="canopy-skeleton-bar canopy-skeleton-label",i.style.width=d.labelW,i.style.animationDelay=`${t}s`,o.appendChild(i),t+=.1;let u=document.createElement("div");u.className=`canopy-skeleton-bar canopy-skeleton-${d.type}`,u.style.animationDelay=`${t}s`,o.appendChild(u),t+=.15,e.appendChild(o)}let l=document.createElement("div");l.className="canopy-skeleton-bar canopy-skeleton-button",l.style.animationDelay=`${t}s`,e.appendChild(l),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=e,this.container.appendChild(n),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderHostedOnly(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is only available at its hosted URL and cannot be embedded. Please contact the form owner.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}};var _=`
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
  font-size: var(--canopy-label-size, 1.5em);
  font-weight: var(--canopy-label-weight, 400);
  color: var(--canopy-label-color, var(--canopy-text, #18181b));
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
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.canopy-name-part {
  display: grid;
  gap: 4px;
}

.canopy-name-part-label {
  font-size: calc(var(--canopy-font-size, 16px) - 1px);
  font-weight: 500;
  color: var(--canopy-text, #18181b);
}

.canopy-address-parts {
  display: grid;
  gap: 12px;
}

.canopy-address-part {
  display: grid;
  gap: 4px;
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
`;var B="canopy-embed-styles";function J(){if(document.getElementById(B))return;let c=document.createElement("style");c.id=B,c.textContent=_,document.head.appendChild(c)}function Q(c){var e;return c.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function ee(c){let e=c.dataset.theme;if(e)try{return JSON.parse(e)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function $(){J(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=e.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let t=ee(e),r=Q(e);new N(e,{formId:n,themeOverrides:t,baseUrl:r}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",$):$();window.CanopyForms={init:$,CanopyForm:N};})();
