"use strict";(()=>{var C={fontSize:14,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:"md",titleWeight:"normal",labelSize:"md",labelWeight:"medium",labelTransform:"none"},N=new Set;function w(l,e){if(!l)return e;let n=l.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:e:e}function M(l,e){return{...C,...l!=null?l:{},...e!=null?e:{}}}function B(l){let e=/^#?([0-9a-f]{6})$/i.exec(l.trim());if(!e)return null;let n=parseInt(e[1],16);return[n>>16&255,n>>8&255,n&255]}function _(l,e,n){let[t,r,a]=[l,e,n].map(p=>{let d=p/255;return d<=.03928?d/12.92:Math.pow((d+.055)/1.055,2.4)});return .2126*t+.7152*r+.0722*a}function U(l){try{let e=B(l);return e&&_(...e)>.179?"#18181b":"#ffffff"}catch(e){return"#ffffff"}}function O(l,e){var s,u,b,g,h,c;let n=I(e.bodyFont,e.fontFamily);l.style.setProperty("--canopy-font",n);let t=I(e.headingFont);l.style.setProperty("--canopy-heading-font",t==="inherit"?"var(--canopy-font)":t),l.style.setProperty("--canopy-font-size",`${(s=e.fontSize)!=null?s:C.fontSize}px`),l.style.setProperty("--canopy-text",w(e.text,C.text)),l.style.setProperty("--canopy-bg",w(e.background,C.background)),l.style.setProperty("--canopy-field-bg",w(e.fieldBackground,C.fieldBackground));let r=w(e.primary,C.primary);l.style.setProperty("--canopy-primary",r),l.style.setProperty("--canopy-button-text",U(r)),l.style.setProperty("--canopy-border",w(e.border,C.border)),l.style.setProperty("--canopy-radius",`${(u=e.radius)!=null?u:C.radius}px`),l.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),l.style.setProperty("--canopy-button-align",e.buttonAlign||C.buttonAlign);let a={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"};l.style.setProperty("--canopy-title-size",a[(b=e.titleSize)!=null?b:"md"]),l.style.setProperty("--canopy-label-size",a[(g=e.labelSize)!=null?g:"md"]);let p={light:"300",normal:"400",bold:"700",semibold:"700"},d=(h=e.titleWeight)!=null?h:"normal";l.style.setProperty("--canopy-title-weight",(c=p[d])!=null?c:"400");let o=e.titleColor?w(e.titleColor,""):"";o?l.style.setProperty("--canopy-title-color",o):l.style.removeProperty("--canopy-title-color"),l.style.setProperty("--canopy-heading-transform",e.labelTransform==="uppercase"?"uppercase":"none")}function H(l){switch(l.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function I(l,e){return l&&l!=="inherit"?`'${l}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function z(l){let e=l.filter(a=>!!a&&a!=="inherit"&&!N.has(a));if(e.length===0)return;let t=`https://fonts.googleapis.com/css2?${e.map(a=>`family=${encodeURIComponent(a)}:wght@300;400;700`).join("&")}&display=swap`,r=document.createElement("link");r.rel="stylesheet",r.href=t,r.dataset.canopyFont="true",document.head.appendChild(r),e.forEach(a=>N.add(a))}function R(l){if(!l||N.has(l))return;let e=document.createElement("link");e.rel="stylesheet",e.href=l,e.dataset.canopyFont="true",document.head.appendChild(e),N.add(l)}var j={TEXT:200,EMAIL:254,TEXTAREA:2e3};function L(l){var e;return(e=l.validation)!=null&&e.maxLength?l.validation.maxLength:j[l.type]}function K(l){return l.label||l.name}function q(l,e){let n={};return l.forEach(t=>{var o,s,u,b,g,h,c,y,v;let r=e[t.name],a=K(t);if(t.required){if(t.type==="CHECKBOX"){if(!r){n[t.name]=`${a} is required.`;return}}else if(t.type==="CHECKBOXES"){if(!Array.isArray(r)||r.length===0){n[t.name]=`${a} is required.`;return}}else if(t.type!=="NAME"){if(t.type!=="ADDRESS"){if(r==null||String(r).trim()===""){n[t.name]=`${a} is required.`;return}}}}if(t.type==="CHECKBOXES"){if(Array.isArray(r)&&r.length>0){let i=t.options,f=i&&typeof i=="object"&&"options"in i?i.options.map(x=>x.value):[];for(let x of r)if(!f.includes(String(x))){n[t.name]=`${a} contains an invalid option.`;return}}return}if(!(t.type==="NAME"||t.type==="ADDRESS")){if(r==null||String(r).trim()==="")return}if(t.type==="EMAIL"){let i=String(r);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(i)){n[t.name]="Enter a valid email address";return}let f=(o=t.validation)==null?void 0:o.domainRules;if(f){let x=(s=i.split("@")[1])==null?void 0:s.toLowerCase();if(f.allow&&f.allow.length>0&&!f.allow.map(k=>k.toLowerCase()).includes(x)){n[t.name]=`${a} must be from an allowed domain.`;return}if(f.block&&f.block.length>0&&f.block.map(k=>k.toLowerCase()).includes(x)){n[t.name]=`${a} domain is not allowed.`;return}}}if(t.type==="PHONE"){let i=String(r),m=((u=t.validation)==null?void 0:u.format)||"lenient";if(m==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(i)){n[t.name]=`${a} must be a valid phone number.`;return}}else if(m==="strict"){let f=i.replace(/[^\d+]/g,"");if(f.startsWith("+1"))f=f.substring(2);else if(f.startsWith("+")){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}else f.startsWith("1")&&f.length===11&&(f=f.substring(1));if(!/^\d{10}$/.test(f)){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}}return}if(t.type==="DATE"){let i=String(r),m=new Date(i);if(isNaN(m.getTime())){n[t.name]=`${a} must be a valid date.`;return}let f=new Date;f.setHours(0,0,0,0),m.setHours(0,0,0,0);let x=t.validation;if(x!=null&&x.minDate){let E=new Date(x.minDate==="today"?f:x.minDate);if(E.setHours(0,0,0,0),m<E){n[t.name]=`${a} must be on or after ${E.toLocaleDateString()}.`;return}}if(x!=null&&x.maxDate){let E=new Date(x.maxDate==="today"?f:x.maxDate);if(E.setHours(0,0,0,0),m>E){n[t.name]=`${a} must be on or before ${E.toLocaleDateString()}.`;return}}}if(t.type==="NUMBER"){let i=Number(r);if(isNaN(i)){n[t.name]=`${a} must be a number.`;return}let m=t.validation;if(m!=null&&m.integer&&!Number.isInteger(i)){n[t.name]=`${a} must be a whole number.`;return}if((m==null?void 0:m.min)!==void 0&&i<m.min){n[t.name]=`${a} must be at least ${m.min}.`;return}if((m==null?void 0:m.max)!==void 0&&i>m.max){n[t.name]=`${a} must be at most ${m.max}.`;return}return}if(t.type==="NAME"){let i=r,m=t.options||{parts:["first","last"]},f=m.parts||["first","last"],x=m.partsRequired||{};for(let E of f){let k=i[E];if((t.required||x[E])&&(!k||k.trim()==="")){let A=((b=m.partLabels)==null?void 0:b[E])||E;n[t.name]=`${A} is required.`;return}}return}if(t.type==="ADDRESS"){let i=r,m=t.options||{},f=["line1","city","region","postalCode"];if(!(m.showLine2!==!1?["line1","line2","city","region","postalCode"]:f).some(A=>{var D;return(D=i==null?void 0:i[A])==null?void 0:D.trim()})&&!t.required)return;let k={line1:"Street address",city:"City",region:"State",postalCode:"ZIP code"};for(let A of f)if(!((g=i==null?void 0:i[A])!=null&&g.trim())){n[t.name]=`${k[A]} is required.`;return}let F=(c=(h=i==null?void 0:i.postalCode)==null?void 0:h.trim())!=null?c:"";if(!/^\d{5}(-\d{4})?$/.test(F)){n[t.name]="ZIP code must be a valid US postal code (e.g., 12345 or 12345-6789).";return}return}if(t.type==="DROPDOWN"){let i=t.options,m=i!=null&&typeof i=="object"&&!Array.isArray(i)&&"options"in i,f=m?i.options.map(E=>E.value):Array.isArray(i)?i.map(E=>E.value):[],x=m&&i.allowOther===!0;if(f.length>0&&!x&&!f.includes(String(r))){n[t.name]=`${a} must be a valid option.`;return}}let p=String(r),d=L(t);if((y=t.validation)!=null&&y.minLength&&p.length<t.validation.minLength){n[t.name]=`${a} must be at least ${t.validation.minLength} characters.`;return}if(d&&p.length>d){n[t.name]=`${a} must be at most ${d} characters.`;return}if(t.type==="TEXT"||t.type==="TEXTAREA"){let i=(v=t.validation)==null?void 0:v.format;if(i&&i!=="alphanumeric"){let m=!0,f=`${a} is invalid.`;switch(i){case"numbers":m=/^\d+$/.test(p),f=`${a} must contain only numbers.`;break;case"letters":m=/^[A-Za-z]+$/.test(p),f=`${a} must contain only letters.`;break;case"url":{let x=p.startsWith("http")?p:`https://${p}`;try{m=new URL(x).hostname.includes(".")}catch(E){m=!1}f=`${a} must be a valid URL.`;break}case"postal-us":m=/^\d{5}(-\d{4})?$/.test(p),f=`${a} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":m=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(p),f=`${a} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}m||(n[t.name]=f)}}}),n}var P=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var Z="feedback@canopyds.com",X=0,T=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},S=class{constructor(e,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${X++}`;this.container=e,this.options=n}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof T){this.renderInactive();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var r;let e=this.options.baseUrl||"",n=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!n)throw new Error("Form configuration error: no formId");let t=await fetch(`${e}/api/embed/${n}`,{method:"GET",credentials:"omit"});if(!t.ok){if(t.status===403)try{let a=await t.json();if((a==null?void 0:a.code)==="FORM_INACTIVE")throw new T(a.error||"Form is inactive")}catch(a){if(a instanceof T)throw a}throw new Error("Failed to load form definition")}return t.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let n=M(e.defaultTheme,this.options.themeOverrides);O(this.container,n),z([n.bodyFont,n.headingFont]),!n.bodyFont&&!n.headingFont&&R(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(H(n));let t=e.fields&&e.fields.length>0,r=e.title||e.description;if(!t&&!r){this.renderSkeleton();return}if(e.title||e.description){let c=document.createElement("div");if(c.className="canopy-header",e.title){let y=document.createElement("h2");y.className="canopy-title",y.textContent=e.title,c.appendChild(y)}if(e.description){let y=document.createElement("p");y.className="canopy-description",y.textContent=e.description,c.appendChild(y)}this.container.appendChild(c)}let a=document.createElement("div");a.className="canopy-status",a.setAttribute("role","alert"),a.setAttribute("aria-live","assertive"),this.statusEl=a;let p=document.createElement("form");p.className="canopy-form",p.addEventListener("submit",c=>this.handleSubmit(c)),this.formEl=p,e.fields.forEach(c=>{let{wrapper:y,input:v,errorEl:i}=this.createField(c);y&&p.appendChild(y),this.fieldElements.set(c.name,{input:v,errorEl:i})});let d=document.createElement("button");d.type="submit",d.className="canopy-submit",d.textContent=n.buttonText||"Submit";let o=getComputedStyle(this.container),s=o.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",u=o.getPropertyValue("--canopy-button-text").trim()||"#ffffff",b=o.getPropertyValue("--canopy-radius").trim()||"8px",g=o.getPropertyValue("--canopy-button-width").trim()||"100%";d.style.cssText=`
      display: block !important;
      width: ${g} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${b} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${s} !important;
      background-color: ${s} !important;
      color: ${u} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=d;let h=document.createElement("div");h.className="canopy-form-actions",h.appendChild(d),p.appendChild(h),this.container.appendChild(a),this.container.appendChild(p),this.container.appendChild(this.renderWatermark(e))}renderWatermark(e){let n=document.createElement("div");n.className="canopy-watermark";let t=document.createElement("span");t.className="canopy-watermark-brand",t.textContent="Powered by Canopy Forms (Beta)",n.appendChild(t);let r=document.createElement("span");r.className="canopy-watermark-sep",r.setAttribute("aria-hidden","true"),r.textContent="\xB7",n.appendChild(r);let a=(e==null?void 0:e.title)||(e==null?void 0:e.name)||(e==null?void 0:e.formId)||"unknown form",p=(e==null?void 0:e.formId)||"unknown",d=`Canopy Forms issue \u2014 ${a}`,o=[`Form: ${a}`,`Form ID: ${p}`,"","Describe the issue:",""].join(`
`),s=`mailto:${Z}?subject=${encodeURIComponent(d)}&body=${encodeURIComponent(o)}`,u=document.createElement("a");return u.className="canopy-watermark-link",u.href=s,u.textContent="Report an issue",u.rel="noopener",n.appendChild(u),n}createField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let r=document.createElement("label");if(r.className="canopy-label",r.htmlFor=n,r.textContent=e.label||e.name,e.required){let o=document.createElement("span");o.className="canopy-required",o.textContent=" *",o.setAttribute("aria-hidden","true"),r.appendChild(o)}let a;switch(e.type){case"TEXTAREA":{let o=document.createElement("textarea");o.className="canopy-textarea";let s=L(e);if(s){let u=Math.min(Math.max(Math.ceil(s/60),4),15);o.rows=u}else o.rows=4;a=o;break}case"DROPDOWN":{let o=e.options,s=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o),u=s?o.options:Array.isArray(o)?o:[],b=s?o.defaultValue:void 0,g=s?o.allowOther:!1,h=document.createElement("select");if(h.className="canopy-select",!b){let c=document.createElement("option");c.value="",c.textContent="Choose one...",c.disabled=!0,c.selected=!0,h.appendChild(c)}if(u.forEach(c=>{let y=document.createElement("option");y.value=c.value,y.textContent=c.label,b&&c.value===b&&(y.selected=!0),h.appendChild(y)}),g){let c=document.createElement("option");c.value="__other__",c.textContent="Other",h.appendChild(c)}if(a=h,g){let c=document.createElement("input");c.type="text",c.className="canopy-input canopy-select-other",c.name=`${e.name}_other`,c.placeholder="Please specify...",c.style.setProperty("display","none","important"),c.style.marginTop="0.5rem",c.addEventListener("input",()=>{c.setCustomValidity("")}),h.addEventListener("change",()=>{h.value==="__other__"?(c.style.setProperty("display","block","important"),e.required&&(c.required=!0)):(c.style.setProperty("display","none","important"),c.required=!1,c.value="")}),h.__otherInput=c}break}case"CHECKBOX":{let o=document.createElement("label");o.className="canopy-checkbox";let s=document.createElement("input");s.type="checkbox",s.id=n,s.name=e.name,e.required&&s.setAttribute("aria-required","true"),s.addEventListener("change",()=>{s.setCustomValidity("")}),o.appendChild(s);let u=document.createElement("span");if(u.textContent=e.label||e.name,o.appendChild(u),t.appendChild(o),e.helpText){let g=document.createElement("p");g.className="canopy-help-text",g.textContent=e.helpText,t.appendChild(g)}let b=document.createElement("span");return b.className="canopy-error",b.id=`${n}-error`,t.appendChild(b),s.setAttribute("aria-describedby",b.id),s.setAttribute("aria-invalid","false"),{wrapper:t,input:s,errorEl:b}}case"CHECKBOXES":{let o=e.options,u=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o)?o.options:Array.isArray(o)?o:[],b=document.createElement("div");b.className="canopy-checkboxes",b.setAttribute("data-checkbox-group",e.name),u.forEach(c=>{let y=document.createElement("label");y.className="canopy-checkbox";let v=document.createElement("input");v.type="checkbox",v.name=e.name,v.value=c.value,v.addEventListener("change",()=>{let m=b.querySelector("input[type=checkbox]");m&&m.setCustomValidity("")});let i=document.createElement("span");i.textContent=c.label,y.appendChild(v),y.appendChild(i),b.appendChild(y)});let g=document.createElement("input");if(g.type="hidden",g.id=n,g.name=e.name,t.appendChild(r),t.appendChild(b),e.helpText){let c=document.createElement("p");c.className="canopy-help-text",c.textContent=e.helpText,t.appendChild(c)}let h=document.createElement("span");return h.className="canopy-error",h.id=`${n}-error`,t.appendChild(h),g.setAttribute("aria-describedby",h.id),g.setAttribute("aria-invalid","false"),{wrapper:t,input:g,errorEl:h}}case"EMAIL":{let o=document.createElement("input");o.type="email",o.className="canopy-input",a=o;break}case"PHONE":{let o=document.createElement("input");o.type="tel",o.setAttribute("inputmode","tel"),o.setAttribute("autocomplete","tel"),o.className="canopy-input",a=o;break}case"DATE":{let o=document.createElement("input");o.type="date",o.className="canopy-input";let s=e.validation;s&&(s.minDate&&(o.min=this.resolveDate(s.minDate)),s.maxDate&&(o.max=this.resolveDate(s.maxDate))),a=o;break}case"NUMBER":{let o=document.createElement("input");o.type="number",o.className="canopy-input";let s=e.validation;s!=null&&s.integer?(o.setAttribute("inputmode","numeric"),o.setAttribute("step","1")):(o.setAttribute("inputmode","decimal"),o.setAttribute("step","any")),(s==null?void 0:s.min)!==void 0&&o.setAttribute("min",String(s.min)),(s==null?void 0:s.max)!==void 0&&o.setAttribute("max",String(s.max)),a=o;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);default:{let o=document.createElement("input");o.type="text",o.className="canopy-input",a=o}}a.id=n,a.name=e.name,a.setAttribute("aria-invalid","false"),e.required&&a.setAttribute("aria-required","true"),e.placeholder&&a.setAttribute("placeholder",e.placeholder);let p=L(e);p&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=p),a.addEventListener("input",()=>{a.setCustomValidity("")});let d=document.createElement("span");if(d.className="canopy-error",d.id=`${n}-error`,a.setAttribute("aria-describedby",d.id),t.appendChild(r),t.appendChild(a),a.__otherInput&&t.appendChild(a.__otherInput),e.helpText){let o=document.createElement("p");o.className="canopy-help-text",o.textContent=e.helpText,t.appendChild(o)}return t.appendChild(d),{wrapper:t,input:a,errorEl:d}}resolveDate(e){return e==="today"?new Date().toISOString().split("T")[0]:e}createNameField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-name-group",t.setAttribute("role","group"),t.setAttribute("aria-labelledby",`${n}-group-label`);let r=document.createElement("span");r.id=`${n}-group-label`,r.className="canopy-label",r.textContent=e.label||e.name,t.appendChild(r);let a=e.options||{parts:["first","last"]},p=a.parts||["first","last"],d=a.partLabels||{},o=a.partsRequired||{},s={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},u=document.createElement("div");u.className="canopy-name-parts";let b=document.createElement("input");b.type="hidden",b.id=n,b.name=e.name;let g=document.createElement("span");if(g.className="canopy-error",g.id=`${n}-error`,p.forEach(h=>{let c=document.createElement("div");c.className="canopy-name-part";let y=document.createElement("label");y.className="canopy-name-part-label";let v=`${n}-${h}`;if(y.htmlFor=v,y.textContent=d[h]||s[h]||h,e.required||o[h]){let m=document.createElement("span");m.className="canopy-required",m.textContent=" *",m.setAttribute("aria-hidden","true"),y.appendChild(m)}let i=document.createElement("input");i.type="text",i.className="canopy-input",i.id=v,i.name=`${e.name}.${h}`,i.setAttribute("data-name-part",h),i.setAttribute("data-name-field",e.name),(e.required||o[h])&&i.setAttribute("aria-required","true"),i.addEventListener("input",()=>{u.querySelectorAll("input[data-name-part]").forEach(m=>m.setCustomValidity(""))}),c.appendChild(y),c.appendChild(i),u.appendChild(c)}),t.appendChild(u),e.helpText){let h=document.createElement("p");h.className="canopy-help-text",h.textContent=e.helpText,t.appendChild(h)}return t.appendChild(g),{wrapper:t,input:b,errorEl:g}}createAddressField(e){let n=`${this.instanceId}-${e.name}`,t=e.options||{},r=document.createElement("div");r.className="canopy-field canopy-address-group",r.setAttribute("role","group"),r.setAttribute("aria-labelledby",`${n}-group-label`);let a=document.createElement("span");a.id=`${n}-group-label`,a.className="canopy-label",a.textContent=e.label||"Address",r.appendChild(a);let p=document.createElement("div");p.className="canopy-address-parts";let d=document.createElement("input");d.type="hidden",d.id=n,d.name=e.name;let o=document.createElement("span");o.className="canopy-error",o.id=`${n}-error`;let s=[{key:"line1",label:"Street Address",tag:"input"}];if(t.showLine2!==!1&&s.push({key:"line2",label:"Apt, Suite, etc.",tag:"input"}),s.push({key:"city",label:"City",tag:"input"},{key:"region",label:"State",tag:"select"},{key:"postalCode",label:"ZIP Code",tag:"input",attrs:{maxlength:"10",inputmode:"numeric"}}),s.forEach(u=>{let b=document.createElement("div");b.className="canopy-address-part";let g=document.createElement("label");g.className="canopy-address-part-label";let h=`${n}-${u.key}`;if(g.htmlFor=h,g.textContent=u.label,e.required&&u.key!=="line2"){let y=document.createElement("span");y.className="canopy-required",y.textContent=" *",y.setAttribute("aria-hidden","true"),g.appendChild(y)}let c;if(u.tag==="select"){let y=document.createElement("select");y.className="canopy-select";let v=document.createElement("option");v.value="",v.textContent="Select...",y.appendChild(v),P.forEach(i=>{let m=document.createElement("option");m.value=i.value,m.textContent=i.label,y.appendChild(m)}),y.addEventListener("change",()=>{p.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(i=>i.setCustomValidity(""))}),c=y}else{let y=document.createElement("input");y.type="text",y.className="canopy-input",u.attrs&&Object.entries(u.attrs).forEach(([v,i])=>y.setAttribute(v,i)),y.addEventListener("input",()=>{p.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(v=>v.setCustomValidity(""))}),c=y}c.id=h,c.setAttribute("data-address-part",u.key),c.setAttribute("data-address-field",e.name),e.required&&u.key!=="line2"&&c.setAttribute("aria-required","true"),b.appendChild(g),b.appendChild(c),p.appendChild(b)}),r.appendChild(p),e.helpText){let u=document.createElement("p");u.className="canopy-help-text",u.textContent=e.helpText,r.appendChild(u)}return r.appendChild(o),{wrapper:r,input:d,errorEl:o}}collectValues(){let e={};return this.fieldElements.forEach((n,t)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")e[t]=n.input.checked;else if(n.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${t}"]`);if(r){let a=[];r.querySelectorAll("input[type=checkbox]:checked").forEach(p=>{a.push(p.value)}),e[t]=a}else{let a=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(a.length>0){let p={};a.forEach(d=>{let o=d,s=o.getAttribute("data-name-part");s&&(p[s]=o.value)}),e[t]=p}else{let p=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(p.length>0){let d={};p.forEach(o=>{let s=o.getAttribute("data-address-part");s&&(d[s]=o.value)}),e[t]=d}else e[t]=n.input.value}}}else e[t]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?e[t]=n.input.__otherInput.value:e[t]=n.input.value}),e}findFailingInput(e){let n=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(n.length>0){for(let a of n)if(!a.value.trim())return a;return n[0]}let t=["line1","city","region","postalCode"],r=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(r.length>0){for(let a of r){let p=a.getAttribute("data-address-part");if(p&&t.includes(p)&&!a.value.trim())return a}for(let a of r)if(a.getAttribute("data-address-part")==="postalCode")return a;return r[0]}return null}showErrors(e){this.fieldElements.forEach((t,r)=>{let a=e[r]||"";if(t.input.type==="hidden"){let p=this.container.querySelector(`[data-checkbox-group="${r}"]`);if(p){let d=p.querySelector("input[type=checkbox]");d&&d.setCustomValidity(a)}else{let d=a?this.findFailingInput(r):null;d?d.setCustomValidity(a):this.container.querySelectorAll(`input[data-name-field="${r}"], input[data-address-field="${r}"], select[data-address-field="${r}"]`).forEach(s=>s.setCustomValidity(""))}}else t.input.setCustomValidity(a);t.errorEl.textContent=a,t.input.setAttribute("aria-invalid",a?"true":"false")});let n=Object.keys(e);if(n.length>0){let t=this.fieldElements.get(n[0]);if(t)if(t.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(r){let a=r.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.findFailingInput(n[0]);a&&(a.reportValidity(),a.focus())}}else t.input.reportValidity(),t.input.focus()}}setStatus(e,n){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(e){var r,a,p;if(e.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach((d,o)=>{if(d.input.setCustomValidity(""),d.input.type==="hidden"){let s=this.container.querySelector(`[data-checkbox-group="${o}"]`);if(s){let u=s.querySelector("input[type=checkbox]");u&&u.setCustomValidity("")}else this.container.querySelectorAll(`input[data-name-field="${o}"], input[data-address-field="${o}"], select[data-address-field="${o}"]`).forEach(b=>b.setCustomValidity(""))}});let n=this.collectValues(),t=q(this.formDefinition.fields,n);if(this.showErrors(t),Object.keys(t).length>0){let d=Object.keys(t).length;this.setStatus(`Please fix ${d} field${d>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let d=this.options.baseUrl||"",o=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!o){this.setStatus("Form configuration error.","error");return}let s=await fetch(`${d}/api/embed/${o}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),u=await s.json();if(!s.ok){u!=null&&u.fields&&this.showErrors(u.fields),this.setStatus((u==null?void 0:u.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(d){console.error(d),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let d=((p=(a=this.formDefinition)==null?void 0:a.defaultTheme)==null?void 0:p.buttonText)||"Submit";this.submitButton.textContent=d,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let n=this.container.querySelector(".canopy-success");n&&n.remove();let t=document.createElement("div");t.className="canopy-success",t.setAttribute("role","status"),t.setAttribute("aria-live","polite");let r=document.createElement("div");r.className="canopy-success-icon",r.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',t.appendChild(r);let a=document.createElement("p");a.className="canopy-success-message",a.textContent=e,t.appendChild(a);let p=document.createElement("button");p.type="button",p.className="canopy-success-reset",p.textContent="Submit another response",p.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),t.appendChild(p),this.container.appendChild(t)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let n=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],t=0,r=document.createElement("div");r.className="canopy-skeleton-bar canopy-skeleton-title",r.style.animationDelay=`${t}s`,e.appendChild(r),t+=.15;let a=document.createElement("div");a.className="canopy-skeleton-bar canopy-skeleton-desc",a.style.animationDelay=`${t}s`,e.appendChild(a),t+=.15;for(let d of n){let o=document.createElement("div");o.className="canopy-skeleton-field";let s=document.createElement("div");s.className="canopy-skeleton-bar canopy-skeleton-label",s.style.width=d.labelW,s.style.animationDelay=`${t}s`,o.appendChild(s),t+=.1;let u=document.createElement("div");u.className=`canopy-skeleton-bar canopy-skeleton-${d.type}`,u.style.animationDelay=`${t}s`,o.appendChild(u),t+=.15,e.appendChild(o)}let p=document.createElement("div");p.className="canopy-skeleton-bar canopy-skeleton-button",p.style.animationDelay=`${t}s`,e.appendChild(p),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=e,this.container.appendChild(n),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}};var W=`
.canopy-root {
  font-family: var(--canopy-font, inherit);
  font-size: var(--canopy-font-size, 14px);
  color: var(--canopy-text, #18181b);
  background: var(--canopy-bg, #ffffff);
  padding: 4px;
  --canopy-heading-font: var(--canopy-font, inherit);
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
  font-family: var(--canopy-heading-font, var(--canopy-font, inherit));
  font-size: var(--canopy-label-size, 1.5em);
  font-weight: var(--canopy-title-weight, 400);
  color: var(--canopy-title-color, var(--canopy-text, #18181b));
  text-transform: var(--canopy-heading-transform, none);
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

.canopy-address-parts {
  display: grid;
  gap: 12px;
}

.canopy-address-part {
  display: grid;
  gap: 4px;
}

.canopy-address-part-label {
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
  font-family: var(--canopy-heading-font, var(--canopy-font, inherit));
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--canopy-title-color, var(--canopy-text, #18181b));
}

.canopy-inactive-body {
  margin: 0;
  max-width: 360px;
  color: var(--canopy-muted-text, #71717a);
  font-size: var(--canopy-font-size, 14px);
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
  font-size: var(--canopy-font-size, 14px);
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
  font-size: calc(var(--canopy-font-size, 14px) - 1px);
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
  font-family: var(--canopy-heading-font, var(--canopy-font, inherit));
  font-size: var(--canopy-title-size, 1.5em);
  font-weight: var(--canopy-title-weight, 400);
  color: var(--canopy-title-color, var(--canopy-text, #18181b));
  text-transform: var(--canopy-heading-transform, none);
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
`;var V="canopy-embed-styles";function G(){if(document.getElementById(V))return;let l=document.createElement("style");l.id=V,l.textContent=W,document.head.appendChild(l)}function Y(l){var e;return l.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function J(l){let e=l.dataset.theme;if(e)try{return JSON.parse(e)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function $(){G(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=e.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let t=J(e),r=Y(e);new S(e,{formId:n,themeOverrides:t,baseUrl:r}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",$):$();window.CanopyForms={init:$,CanopyForm:S};})();
