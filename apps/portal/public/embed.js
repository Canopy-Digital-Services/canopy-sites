"use strict";(()=>{var E={fontSize:16,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:28,titleWeight:"normal",titleAlign:"left",labelSize:18,labelWeight:"normal"},S=new Set;function A(s,e){if(!s)return e;let n=s.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:e:e}function H(s){if(!s)return{};let{headingFont:e,...n}=s;return e?{titleFont:e,labelFont:e,...n}:n}function R(s,e){return{...E,...H(s),...H(e)}}function Y(s){let e=/^#?([0-9a-f]{6})$/i.exec(s.trim());if(!e)return null;let n=parseInt(e[1],16);return[n>>16&255,n>>8&255,n&255]}function J(s,e,n){let[t,r,a]=[s,e,n].map(c=>{let d=c/255;return d<=.03928?d/12.92:Math.pow((d+.055)/1.055,2.4)});return .2126*t+.7152*r+.0722*a}function P(s){let e=Y(s);return e?J(...e):null}function Q(s,e){let n=P(s);if(n===null||n<=.179)return"#ffffff";let t=P(e);return t!==null&&(n+.05)/(t+.05)>=4.5?e:E.text}function q(s,e){var o,l,m,h,g,b;let n=z(e.bodyFont,e.fontFamily);s.style.setProperty("--canopy-font",n);for(let[p,y]of[["--canopy-title-font",e.titleFont],["--canopy-label-font",e.labelFont]]){let i=z(y);s.style.setProperty(p,i==="inherit"?"var(--canopy-font)":i)}s.style.setProperty("--canopy-font-size",`${(o=e.fontSize)!=null?o:E.fontSize}px`);let t=A(e.text,E.text);s.style.setProperty("--canopy-text",t),s.style.setProperty("--canopy-bg",A(e.background,E.background)),s.style.setProperty("--canopy-field-bg",A(e.fieldBackground,E.fieldBackground));let r=A(e.primary,E.primary);s.style.setProperty("--canopy-primary",r),s.style.setProperty("--canopy-button-text",A(e.buttonTextColor,"")||Q(r,t)),s.style.setProperty("--canopy-border",A(e.border,E.border)),s.style.setProperty("--canopy-radius",`${(l=e.radius)!=null?l:E.radius}px`),s.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),s.style.setProperty("--canopy-button-align",e.buttonAlign||E.buttonAlign);let a={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"},c=(p,y)=>{var u;let i=Number(p);return i>0?`${i}px`:(u=a[String(p)])!=null?u:`${Number(y)}px`};s.style.setProperty("--canopy-title-size",c(e.titleSize,E.titleSize)),s.style.setProperty("--canopy-label-size",c(e.labelSize,E.labelSize));let d={light:"300",normal:"400",medium:"500",bold:"700",semibold:"700"};s.style.setProperty("--canopy-title-weight",(h=d[(m=e.titleWeight)!=null?m:"normal"])!=null?h:"400"),s.style.setProperty("--canopy-label-weight",(b=d[(g=e.labelWeight)!=null?g:"normal"])!=null?b:"400");for(let[p,y]of[["--canopy-title-color",e.titleColor],["--canopy-label-color",e.labelColor]]){let i=y?A(y,""):"";i?s.style.setProperty(p,i):s.style.removeProperty(p)}s.style.setProperty("--canopy-title-align",e.titleAlign==="center"?"center":"left")}function W(s){switch(s.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function z(s,e){return s&&s!=="inherit"?`'${s}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function _(s,e){let n=s.filter(c=>!!c&&c!=="inherit"&&!S.has(c));if(n.length===0)return;let t=n.map(c=>`family=${encodeURIComponent(c)}`).join("&"),r=`${e}/api/fonts?${t}`,a=document.createElement("link");a.rel="stylesheet",a.href=r,a.dataset.canopyFont="true",document.head.appendChild(a),n.forEach(c=>S.add(c))}function V(s){if(!s||S.has(s))return;let e=document.createElement("link");e.rel="stylesheet",e.href=s,e.dataset.canopyFont="true",document.head.appendChild(e),S.add(s)}var M="Name",ee={first:"First",middle:"Middle",middleInitial:"M.I.",last:"Last",single:M},L=["first","last"],B=["first","middle","middleInitial","last","single"];function U(s){return[...s].sort((e,n)=>B.indexOf(e)-B.indexOf(n))}function F(s,e){return e&&s!=="middle"&&s!=="middleInitial"}function D(s,e){return(e==null?void 0:e[s])||ee[s]||s}var te={TEXT:200,EMAIL:254,TEXTAREA:2e3};function $(s){var e;return(e=s.validation)!=null&&e.maxLength?s.validation.maxLength:te[s.type]}function ne(s){return s.label||s.name}function j(s,e){let n={};return s.forEach(t=>{var o,l,m,h,g,b,p,y;let r=e[t.name],a=ne(t);if(t.required){if(t.type==="CHECKBOX"){if(!r){n[t.name]=`${a} is required.`;return}}else if(t.type==="CHECKBOXES"){if(!Array.isArray(r)||r.length===0){n[t.name]=`${a} is required.`;return}}else if(t.type!=="NAME"){if(t.type!=="ADDRESS"){if(r==null||String(r).trim()===""){n[t.name]=`${a} is required.`;return}}}}if(t.type==="CHECKBOXES"){if(Array.isArray(r)&&r.length>0){let i=t.options,f=i&&typeof i=="object"&&"options"in i?i.options.map(x=>x.value):[];for(let x of r)if(!f.includes(String(x))){n[t.name]=`${a} contains an invalid option.`;return}}return}if(!(t.type==="NAME"||t.type==="ADDRESS")){if(r==null||String(r).trim()==="")return}if(t.type==="EMAIL"){let i=String(r);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(i)){n[t.name]="Enter a valid email address";return}let f=(o=t.validation)==null?void 0:o.domainRules;if(f){let x=(l=i.split("@")[1])==null?void 0:l.toLowerCase();if(f.allow&&f.allow.length>0&&!f.allow.map(C=>C.toLowerCase()).includes(x)){n[t.name]=`${a} must be from an allowed domain.`;return}if(f.block&&f.block.length>0&&f.block.map(C=>C.toLowerCase()).includes(x)){n[t.name]=`${a} domain is not allowed.`;return}}}if(t.type==="PHONE"){let i=String(r),u=((m=t.validation)==null?void 0:m.format)||"lenient";if(u==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(i)){n[t.name]=`${a} must be a valid phone number.`;return}}else if(u==="strict"){let f=i.replace(/[^\d+]/g,"");if(f.startsWith("+1"))f=f.substring(2);else if(f.startsWith("+")){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}else f.startsWith("1")&&f.length===11&&(f=f.substring(1));if(!/^\d{10}$/.test(f)){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}}return}if(t.type==="DATE"){let i=String(r),u=new Date(i);if(isNaN(u.getTime())){n[t.name]=`${a} must be a valid date.`;return}let f=new Date;f.setHours(0,0,0,0),u.setHours(0,0,0,0);let x=t.validation;if(x!=null&&x.minDate){let v=new Date(x.minDate==="today"?f:x.minDate);if(v.setHours(0,0,0,0),u<v){n[t.name]=`${a} must be on or after ${v.toLocaleDateString()}.`;return}}if(x!=null&&x.maxDate){let v=new Date(x.maxDate==="today"?f:x.maxDate);if(v.setHours(0,0,0,0),u>v){n[t.name]=`${a} must be on or before ${v.toLocaleDateString()}.`;return}}}if(t.type==="NUMBER"){let i=Number(r);if(isNaN(i)){n[t.name]=`${a} must be a number.`;return}let u=t.validation;if(u!=null&&u.integer&&!Number.isInteger(i)){n[t.name]=`${a} must be a whole number.`;return}if((u==null?void 0:u.min)!==void 0&&i<u.min){n[t.name]=`${a} must be at least ${u.min}.`;return}if((u==null?void 0:u.max)!==void 0&&i>u.max){n[t.name]=`${a} must be at most ${u.max}.`;return}return}if(t.type==="NAME"){let i=r,u=t.options||{},f=u.parts||L;for(let x of f){let v=i[x];if(F(x,t.required)&&(!v||v.trim()==="")){let C=x==="single"?a:D(x,u.partLabels);n[t.name]=`${C} is required.`;return}}return}if(t.type==="ADDRESS"){let i=r,u=t.options||{},f=["line1","city","region","postalCode"];if(!(u.showLine2!==!1?["line1","line2","city","region","postalCode"]:f).some(N=>{var O;return(O=i==null?void 0:i[N])==null?void 0:O.trim()})&&!t.required)return;let C={line1:"Street address",city:"City",region:"State",postalCode:"ZIP code"};for(let N of f)if(!((h=i==null?void 0:i[N])!=null&&h.trim())){n[t.name]=`${C[N]} is required.`;return}let G=(b=(g=i==null?void 0:i.postalCode)==null?void 0:g.trim())!=null?b:"";if(!/^\d{5}(-\d{4})?$/.test(G)){n[t.name]="ZIP code must be a valid US postal code (e.g., 12345 or 12345-6789).";return}return}if(t.type==="DROPDOWN"){let i=t.options,u=i!=null&&typeof i=="object"&&!Array.isArray(i)&&"options"in i,f=u?i.options.map(v=>v.value):Array.isArray(i)?i.map(v=>v.value):[],x=u&&i.allowOther===!0;if(f.length>0&&!x&&!f.includes(String(r))){n[t.name]=`${a} must be a valid option.`;return}}let c=String(r),d=$(t);if((p=t.validation)!=null&&p.minLength&&c.length<t.validation.minLength){n[t.name]=`${a} must be at least ${t.validation.minLength} characters.`;return}if(d&&c.length>d){n[t.name]=`${a} must be at most ${d} characters.`;return}if(t.type==="TEXT"||t.type==="TEXTAREA"){let i=(y=t.validation)==null?void 0:y.format;if(i&&i!=="alphanumeric"){let u=!0,f=`${a} is invalid.`;switch(i){case"numbers":u=/^\d+$/.test(c),f=`${a} must contain only numbers.`;break;case"letters":u=/^[A-Za-z]+$/.test(c),f=`${a} must contain only letters.`;break;case"url":{let x=c.startsWith("http")?c:`https://${c}`;try{u=new URL(x).hostname.includes(".")}catch(v){u=!1}f=`${a} must be a valid URL.`;break}case"postal-us":u=/^\d{5}(-\d{4})?$/.test(c),f=`${a} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":u=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(c),f=`${a} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}u||(n[t.name]=f)}}}),n}var K=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var ae="feedback@canopyds.com",oe=0,w=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},k=class extends Error{constructor(e){super(e),this.name="HostedOnlyFormError"}},T=class{constructor(e,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${oe++}`;this.container=e,this.options=n}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof w){this.renderInactive();return}if(e instanceof k){this.renderHostedOnly();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var r;let e=this.options.baseUrl||"",n=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!n)throw new Error("Form configuration error: no formId");let t=await fetch(`${e}/api/embed/${n}`,{method:"GET",credentials:"omit"});if(!t.ok){if(t.status===403)try{let a=await t.json();if((a==null?void 0:a.code)==="FORM_INACTIVE")throw new w(a.error||"Form is inactive");if((a==null?void 0:a.code)==="FORM_HOSTED_ONLY")throw new k(a.error||"Form is only available at its hosted URL")}catch(a){if(a instanceof w||a instanceof k)throw a}throw new Error("Failed to load form definition")}return t.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let n=R(e.defaultTheme,this.options.themeOverrides);q(this.container,n),_([n.bodyFont,n.titleFont,n.labelFont],this.options.baseUrl||""),!n.bodyFont&&!n.titleFont&&!n.labelFont&&V(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(W(n));let t=e.fields&&e.fields.length>0,r=e.title||e.description;if(!t&&!r){this.renderSkeleton();return}if(e.title||e.description){let p=document.createElement("div");if(p.className="canopy-header",e.title){let y=document.createElement("h2");y.className="canopy-title",y.textContent=e.title,p.appendChild(y)}if(e.description){let y=document.createElement("p");y.className="canopy-description",y.textContent=e.description,p.appendChild(y)}this.container.appendChild(p)}let a=document.createElement("div");a.className="canopy-status",a.setAttribute("role","alert"),a.setAttribute("aria-live","assertive"),this.statusEl=a;let c=document.createElement("form");c.className="canopy-form",c.addEventListener("submit",p=>this.handleSubmit(p)),this.formEl=c,e.fields.forEach(p=>{let{wrapper:y,input:i,errorEl:u}=this.createField(p);y&&(y.dataset.fieldName=p.name,c.appendChild(y)),this.fieldElements.set(p.name,{input:i,errorEl:u})});let d=document.createElement("button");d.type="submit",d.className="canopy-submit",d.textContent=n.buttonText||"Submit",this.options.preview&&(d.classList.add("canopy-submit-preview"),d.setAttribute("data-preview-tooltip","For preview only. No submission will be created"));let o=getComputedStyle(this.container),l=o.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",m=o.getPropertyValue("--canopy-button-text").trim()||"#ffffff",h=o.getPropertyValue("--canopy-radius").trim()||"8px",g=o.getPropertyValue("--canopy-button-width").trim()||"100%";d.style.cssText=`
      display: block !important;
      width: ${g} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${h} !important;
      padding: 10px 16px !important;
      font-family: var(--canopy-font, inherit) !important;
      font-size: var(--canopy-font-size, 16px) !important;
      font-weight: 600 !important;
      background: ${l} !important;
      background-color: ${l} !important;
      color: ${m} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=d;let b=document.createElement("div");b.className="canopy-form-actions",b.appendChild(d),c.appendChild(b),this.container.appendChild(a),this.container.appendChild(c),this.container.appendChild(this.renderWatermark(e))}renderWatermark(e){let n=document.createElement("div");n.className="canopy-watermark";let t=document.createElement("span");t.className="canopy-watermark-brand",t.textContent="Powered by Canopy Forms (Beta)",n.appendChild(t);let r=document.createElement("span");r.className="canopy-watermark-sep",r.setAttribute("aria-hidden","true"),r.textContent="\xB7",n.appendChild(r);let a=(e==null?void 0:e.title)||(e==null?void 0:e.name)||(e==null?void 0:e.formId)||"unknown form",c=(e==null?void 0:e.formId)||"unknown",d=`Canopy Forms issue \u2014 ${a}`,o=[`Form: ${a}`,`Form ID: ${c}`,"","Describe the issue:",""].join(`
`),l=`mailto:${ae}?subject=${encodeURIComponent(d)}&body=${encodeURIComponent(o)}`,m=document.createElement("a");return m.className="canopy-watermark-link",m.href=l,m.textContent="Report an issue",m.rel="noopener",n.appendChild(m),n}createField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let r=document.createElement("label");if(r.className="canopy-label",r.dataset.fieldPart="label",r.htmlFor=n,r.textContent=e.label||e.name,e.required){let o=document.createElement("span");o.className="canopy-required",o.textContent=" *",o.setAttribute("aria-hidden","true"),r.appendChild(o)}let a;switch(e.type){case"TEXTAREA":{let o=document.createElement("textarea");o.className="canopy-textarea";let l=$(e);if(l){let m=Math.min(Math.max(Math.ceil(l/60),4),15);o.rows=m}else o.rows=4;a=o;break}case"DROPDOWN":{let o=e.options,l=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o),m=l?o.options:Array.isArray(o)?o:[],h=l?o.defaultValue:void 0,g=l?o.allowOther:!1,b=document.createElement("select");if(b.className="canopy-select",!h){let p=document.createElement("option");p.value="",p.textContent="Choose one...",p.disabled=!0,p.selected=!0,b.appendChild(p)}if(m.forEach(p=>{let y=document.createElement("option");y.value=p.value,y.textContent=p.label,h&&p.value===h&&(y.selected=!0),b.appendChild(y)}),g){let p=document.createElement("option");p.value="__other__",p.textContent="Other",b.appendChild(p)}if(a=b,g){let p=document.createElement("input");p.type="text",p.className="canopy-input canopy-select-other",p.name=`${e.name}_other`,p.placeholder="Please specify...",p.style.setProperty("display","none","important"),p.style.marginTop="0.5rem",p.addEventListener("input",()=>{p.setCustomValidity("")}),b.addEventListener("change",()=>{b.value==="__other__"?(p.style.setProperty("display","block","important"),e.required&&(p.required=!0)):(p.style.setProperty("display","none","important"),p.required=!1,p.value="")}),b.__otherInput=p}break}case"CHECKBOX":{let o=document.createElement("label");o.className="canopy-checkbox";let l=document.createElement("input");l.type="checkbox",l.id=n,l.name=e.name,e.required&&l.setAttribute("aria-required","true"),l.addEventListener("change",()=>{l.setCustomValidity("")}),o.appendChild(l);let m=document.createElement("span");if(m.dataset.fieldPart="label",m.textContent=e.label||e.name,o.appendChild(m),t.appendChild(o),e.helpText){let g=document.createElement("p");g.className="canopy-help-text",g.textContent=e.helpText,t.appendChild(g)}let h=document.createElement("span");return h.className="canopy-error",h.id=`${n}-error`,t.appendChild(h),l.setAttribute("aria-describedby",h.id),l.setAttribute("aria-invalid","false"),{wrapper:t,input:l,errorEl:h}}case"CHECKBOXES":{let o=e.options,m=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o)?o.options:Array.isArray(o)?o:[],h=document.createElement("div");h.className="canopy-checkboxes",h.setAttribute("data-checkbox-group",e.name),m.forEach(p=>{let y=document.createElement("label");y.className="canopy-checkbox";let i=document.createElement("input");i.type="checkbox",i.name=e.name,i.value=p.value,i.addEventListener("change",()=>{let f=h.querySelector("input[type=checkbox]");f&&f.setCustomValidity("")});let u=document.createElement("span");u.textContent=p.label,y.appendChild(i),y.appendChild(u),h.appendChild(y)});let g=document.createElement("input");if(g.type="hidden",g.id=n,g.name=e.name,t.appendChild(r),t.appendChild(h),e.helpText){let p=document.createElement("p");p.className="canopy-help-text",p.textContent=e.helpText,t.appendChild(p)}let b=document.createElement("span");return b.className="canopy-error",b.id=`${n}-error`,t.appendChild(b),g.setAttribute("aria-describedby",b.id),g.setAttribute("aria-invalid","false"),{wrapper:t,input:g,errorEl:b}}case"EMAIL":{let o=document.createElement("input");o.type="email",o.className="canopy-input",a=o;break}case"PHONE":{let o=document.createElement("input");o.type="tel",o.setAttribute("inputmode","tel"),o.setAttribute("autocomplete","tel"),o.className="canopy-input",a=o;break}case"DATE":{let o=document.createElement("input");o.type="date",o.className="canopy-input";let l=e.validation;l&&(l.minDate&&(o.min=this.resolveDate(l.minDate)),l.maxDate&&(o.max=this.resolveDate(l.maxDate))),a=o;break}case"NUMBER":{let o=document.createElement("input");o.type="number",o.className="canopy-input";let l=e.validation;l!=null&&l.integer?(o.setAttribute("inputmode","numeric"),o.setAttribute("step","1")):(o.setAttribute("inputmode","decimal"),o.setAttribute("step","any")),(l==null?void 0:l.min)!==void 0&&o.setAttribute("min",String(l.min)),(l==null?void 0:l.max)!==void 0&&o.setAttribute("max",String(l.max)),a=o;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);default:{let o=document.createElement("input");o.type="text",o.className="canopy-input",a=o}}a.id=n,a.name=e.name,a.setAttribute("aria-invalid","false"),e.required&&a.setAttribute("aria-required","true"),e.placeholder&&a.setAttribute("placeholder",e.placeholder);let c=$(e);c&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=c),a.addEventListener("input",()=>{a.setCustomValidity("")});let d=document.createElement("span");if(d.className="canopy-error",d.id=`${n}-error`,a.setAttribute("aria-describedby",d.id),t.appendChild(r),t.appendChild(a),a.__otherInput&&t.appendChild(a.__otherInput),e.helpText){let o=document.createElement("p");o.className="canopy-help-text",o.textContent=e.helpText,t.appendChild(o)}return t.appendChild(d),{wrapper:t,input:a,errorEl:d}}resolveDate(e){return e==="today"?new Date().toISOString().split("T")[0]:e}createNameField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-name-group",t.setAttribute("role","group");let r=e.options||{},a=U(r.parts||L),c=e.label||M,d=a.includes("single");if(d)t.setAttribute("aria-label",c);else{let h=document.createElement("span");h.id=`${n}-group-label`,h.className="canopy-label",h.dataset.fieldPart="label",h.textContent=c,t.appendChild(h),t.setAttribute("aria-labelledby",h.id)}let o=document.createElement("div");o.className="canopy-name-parts";let l=document.createElement("input");l.type="hidden",l.id=n,l.name=e.name;let m=document.createElement("span");if(m.className="canopy-error",m.id=`${n}-error`,a.forEach(h=>{let g=document.createElement("div");g.className=h==="middleInitial"?"canopy-name-part canopy-name-part-initial":"canopy-name-part";let b=document.createElement("label");b.className=d?"canopy-label":"canopy-name-part-label";let p=`${n}-${h}`;b.htmlFor=p,b.textContent=d?c:D(h,r.partLabels),b.dataset.fieldPart=d?"label":`label-${h}`;let y=F(h,e.required);if(y){let u=document.createElement("span");u.className="canopy-required",u.textContent=" *",u.setAttribute("aria-hidden","true"),b.appendChild(u)}let i=document.createElement("input");i.type="text",i.className="canopy-input",i.id=p,i.name=`${e.name}.${h}`,i.setAttribute("data-name-part",h),i.setAttribute("data-name-field",e.name),h==="middleInitial"&&(i.maxLength=2),y&&i.setAttribute("aria-required","true"),i.addEventListener("input",()=>{o.querySelectorAll("input[data-name-part]").forEach(u=>u.setCustomValidity(""))}),g.appendChild(b),g.appendChild(i),o.appendChild(g)}),t.appendChild(o),e.helpText){let h=document.createElement("p");h.className="canopy-help-text",h.textContent=e.helpText,t.appendChild(h)}return t.appendChild(m),{wrapper:t,input:l,errorEl:m}}createAddressField(e){let n=`${this.instanceId}-${e.name}`,t=e.options||{},r=document.createElement("div");r.className="canopy-field canopy-address-group",r.setAttribute("role","group"),r.setAttribute("aria-labelledby",`${n}-group-label`);let a=document.createElement("span");a.id=`${n}-group-label`,a.className="canopy-label",a.dataset.fieldPart="label",a.textContent=e.label||"Address",r.appendChild(a);let c=document.createElement("div");c.className="canopy-address-parts";let d=document.createElement("input");d.type="hidden",d.id=n,d.name=e.name;let o=document.createElement("span");o.className="canopy-error",o.id=`${n}-error`;let l=[{key:"line1",label:"Street Address",tag:"input"}];if(t.showLine2!==!1&&l.push({key:"line2",label:"Apt, Suite, etc.",tag:"input"}),l.push({key:"city",label:"City",tag:"input"},{key:"region",label:"State",tag:"select"},{key:"postalCode",label:"ZIP Code",tag:"input",attrs:{maxlength:"10",inputmode:"numeric"}}),l.forEach(m=>{let h=document.createElement("div");h.className="canopy-address-part";let g=document.createElement("label");g.className="canopy-address-part-label";let b=`${n}-${m.key}`;if(g.htmlFor=b,g.textContent=m.label,e.required&&m.key!=="line2"){let y=document.createElement("span");y.className="canopy-required",y.textContent=" *",y.setAttribute("aria-hidden","true"),g.appendChild(y)}let p;if(m.tag==="select"){let y=document.createElement("select");y.className="canopy-select";let i=document.createElement("option");i.value="",i.textContent="Select...",y.appendChild(i),K.forEach(u=>{let f=document.createElement("option");f.value=u.value,f.textContent=u.label,y.appendChild(f)}),y.addEventListener("change",()=>{c.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(u=>u.setCustomValidity(""))}),p=y}else{let y=document.createElement("input");y.type="text",y.className="canopy-input",m.attrs&&Object.entries(m.attrs).forEach(([i,u])=>y.setAttribute(i,u)),y.addEventListener("input",()=>{c.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(i=>i.setCustomValidity(""))}),p=y}p.id=b,p.setAttribute("data-address-part",m.key),p.setAttribute("data-address-field",e.name),e.required&&m.key!=="line2"&&p.setAttribute("aria-required","true"),h.appendChild(g),h.appendChild(p),c.appendChild(h)}),r.appendChild(c),e.helpText){let m=document.createElement("p");m.className="canopy-help-text",m.textContent=e.helpText,r.appendChild(m)}return r.appendChild(o),{wrapper:r,input:d,errorEl:o}}collectValues(){let e={};return this.fieldElements.forEach((n,t)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")e[t]=n.input.checked;else if(n.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${t}"]`);if(r){let a=[];r.querySelectorAll("input[type=checkbox]:checked").forEach(c=>{a.push(c.value)}),e[t]=a}else{let a=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(a.length>0){let c={};a.forEach(d=>{let o=d,l=o.getAttribute("data-name-part");l&&(c[l]=o.value)}),e[t]=c}else{let c=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(c.length>0){let d={};c.forEach(o=>{let l=o.getAttribute("data-address-part");l&&(d[l]=o.value)}),e[t]=d}else e[t]=n.input.value}}}else e[t]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?e[t]=n.input.__otherInput.value:e[t]=n.input.value}),e}findFailingInput(e){let n=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(n.length>0){for(let a of n)if(!a.value.trim())return a;return n[0]}let t=["line1","city","region","postalCode"],r=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(r.length>0){for(let a of r){let c=a.getAttribute("data-address-part");if(c&&t.includes(c)&&!a.value.trim())return a}for(let a of r)if(a.getAttribute("data-address-part")==="postalCode")return a;return r[0]}return null}showErrors(e){this.fieldElements.forEach((t,r)=>{let a=e[r]||"";if(t.input.type==="hidden"){let c=this.container.querySelector(`[data-checkbox-group="${r}"]`);if(c){let d=c.querySelector("input[type=checkbox]");d&&d.setCustomValidity(a)}else{let d=a?this.findFailingInput(r):null;d?d.setCustomValidity(a):this.container.querySelectorAll(`input[data-name-field="${r}"], input[data-address-field="${r}"], select[data-address-field="${r}"]`).forEach(l=>l.setCustomValidity(""))}}else t.input.setCustomValidity(a);t.errorEl.textContent=a,t.input.setAttribute("aria-invalid",a?"true":"false")});let n=Object.keys(e);if(n.length>0){let t=this.fieldElements.get(n[0]);if(t)if(t.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(r){let a=r.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.findFailingInput(n[0]);a&&(a.reportValidity(),a.focus())}}else t.input.reportValidity(),t.input.focus()}}setStatus(e,n){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(e){var r,a,c;if(e.preventDefault(),!this.formDefinition||this.options.preview)return;this.setStatus("","info"),this.fieldElements.forEach((d,o)=>{if(d.input.setCustomValidity(""),d.input.type==="hidden"){let l=this.container.querySelector(`[data-checkbox-group="${o}"]`);if(l){let m=l.querySelector("input[type=checkbox]");m&&m.setCustomValidity("")}else this.container.querySelectorAll(`input[data-name-field="${o}"], input[data-address-field="${o}"], select[data-address-field="${o}"]`).forEach(h=>h.setCustomValidity(""))}});let n=this.collectValues(),t=j(this.formDefinition.fields,n);if(this.showErrors(t),Object.keys(t).length>0){let d=Object.keys(t).length;this.setStatus(`Please fix ${d} field${d>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let d=this.options.baseUrl||"",o=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!o){this.setStatus("Form configuration error.","error");return}let l=await fetch(`${d}/api/embed/${o}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),m=await l.json();if(!l.ok){m!=null&&m.fields&&this.showErrors(m.fields),this.setStatus((m==null?void 0:m.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(d){console.error(d),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let d=((c=(a=this.formDefinition)==null?void 0:a.defaultTheme)==null?void 0:c.buttonText)||"Submit";this.submitButton.textContent=d,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let n=this.container.querySelector(".canopy-success");n&&n.remove();let t=document.createElement("div");t.className="canopy-success",t.setAttribute("role","status"),t.setAttribute("aria-live","polite");let r=document.createElement("div");r.className="canopy-success-icon",r.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',t.appendChild(r);let a=document.createElement("p");a.className="canopy-success-message",a.textContent=e,t.appendChild(a);let c=document.createElement("button");c.type="button",c.className="canopy-success-reset",c.textContent="Submit another response",c.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),t.appendChild(c),this.container.appendChild(t)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let n=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],t=0,r=document.createElement("div");r.className="canopy-skeleton-bar canopy-skeleton-title",r.style.animationDelay=`${t}s`,e.appendChild(r),t+=.15;let a=document.createElement("div");a.className="canopy-skeleton-bar canopy-skeleton-desc",a.style.animationDelay=`${t}s`,e.appendChild(a),t+=.15;for(let d of n){let o=document.createElement("div");o.className="canopy-skeleton-field";let l=document.createElement("div");l.className="canopy-skeleton-bar canopy-skeleton-label",l.style.width=d.labelW,l.style.animationDelay=`${t}s`,o.appendChild(l),t+=.1;let m=document.createElement("div");m.className=`canopy-skeleton-bar canopy-skeleton-${d.type}`,m.style.animationDelay=`${t}s`,o.appendChild(m),t+=.15,e.appendChild(o)}let c=document.createElement("div");c.className="canopy-skeleton-bar canopy-skeleton-button",c.style.animationDelay=`${t}s`,e.appendChild(c),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=e,this.container.appendChild(n),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderHostedOnly(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is only available at its hosted URL and cannot be embedded. Please contact the form owner.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}};var Z=`
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
`;var X="canopy-embed-styles";function re(){if(document.getElementById(X))return;let s=document.createElement("style");s.id=X,s.textContent=Z,document.head.appendChild(s)}function ie(s){var e;return s.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function se(s){let e=s.dataset.theme;if(e)try{return JSON.parse(e)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function I(){re(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=e.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let t=se(e),r=ie(e);new T(e,{formId:n,themeOverrides:t,baseUrl:r}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",I):I();window.CanopyForms={init:I,CanopyForm:T};})();
