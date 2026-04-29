"use strict";(()=>{var C={fontSize:14,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:"md",titleWeight:"normal",labelSize:"md",labelWeight:"medium",labelTransform:"none"},L=new Set;function A(s,e){if(!s)return e;let a=s.trim();return a?/^var\(/i.test(a)||/^rgb/i.test(a)||/^hsl/i.test(a)||/^color\(/i.test(a)||/^(transparent|currentcolor|inherit)$/i.test(a)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(a)?a:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(a)?`#${a}`:e:e}function O(s,e){return{...C,...s!=null?s:{},...e!=null?e:{}}}function B(s){let e=/^#?([0-9a-f]{6})$/i.exec(s.trim());if(!e)return null;let a=parseInt(e[1],16);return[a>>16&255,a>>8&255,a&255]}function U(s,e,a){let[t,r,n]=[s,e,a].map(p=>{let d=p/255;return d<=.03928?d/12.92:Math.pow((d+.055)/1.055,2.4)});return .2126*t+.7152*r+.0722*n}function j(s){try{let e=B(s);return e&&U(...e)>.179?"#18181b":"#ffffff"}catch(e){return"#ffffff"}}function H(s,e){var i,u,b,g,h,c;let a=I(e.bodyFont,e.fontFamily);s.style.setProperty("--canopy-font",a);let t=I(e.headingFont);s.style.setProperty("--canopy-heading-font",t==="inherit"?"var(--canopy-font)":t),s.style.setProperty("--canopy-font-size",`${(i=e.fontSize)!=null?i:C.fontSize}px`),s.style.setProperty("--canopy-text",A(e.text,C.text)),s.style.setProperty("--canopy-bg",A(e.background,C.background)),s.style.setProperty("--canopy-field-bg",A(e.fieldBackground,C.fieldBackground));let r=A(e.primary,C.primary);s.style.setProperty("--canopy-primary",r),s.style.setProperty("--canopy-button-text",j(r)),s.style.setProperty("--canopy-border",A(e.border,C.border)),s.style.setProperty("--canopy-radius",`${(u=e.radius)!=null?u:C.radius}px`),s.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),s.style.setProperty("--canopy-button-align",e.buttonAlign||C.buttonAlign);let n={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"};s.style.setProperty("--canopy-title-size",n[(b=e.titleSize)!=null?b:"md"]),s.style.setProperty("--canopy-label-size",n[(g=e.labelSize)!=null?g:"md"]);let p={light:"300",normal:"400",bold:"700",semibold:"700"},d=(h=e.titleWeight)!=null?h:"normal";s.style.setProperty("--canopy-title-weight",(c=p[d])!=null?c:"400");let o=e.titleColor?A(e.titleColor,""):"";o?s.style.setProperty("--canopy-title-color",o):s.style.removeProperty("--canopy-title-color"),s.style.setProperty("--canopy-heading-transform",e.labelTransform==="uppercase"?"uppercase":"none")}function z(s){switch(s.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function I(s,e){return s&&s!=="inherit"?`'${s}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function R(s){let e=s.filter(n=>!!n&&n!=="inherit"&&!L.has(n));if(e.length===0)return;let t=`https://fonts.googleapis.com/css2?${e.map(n=>`family=${encodeURIComponent(n)}:wght@300;400;700`).join("&")}&display=swap`,r=document.createElement("link");r.rel="stylesheet",r.href=t,r.dataset.canopyFont="true",document.head.appendChild(r),e.forEach(n=>L.add(n))}function q(s){if(!s||L.has(s))return;let e=document.createElement("link");e.rel="stylesheet",e.href=s,e.dataset.canopyFont="true",document.head.appendChild(e),L.add(s)}var K={TEXT:200,EMAIL:254,TEXTAREA:2e3};function F(s){var e;return(e=s.validation)!=null&&e.maxLength?s.validation.maxLength:K[s.type]}function Z(s){return s.label||s.name}function P(s,e){let a={};return s.forEach(t=>{var o,i,u,b,g,h,c,y,x;let r=e[t.name],n=Z(t);if(t.required){if(t.type==="CHECKBOX"){if(!r){a[t.name]=`${n} is required.`;return}}else if(t.type==="CHECKBOXES"){if(!Array.isArray(r)||r.length===0){a[t.name]=`${n} is required.`;return}}else if(t.type!=="NAME"){if(t.type!=="ADDRESS"){if(r==null||String(r).trim()===""){a[t.name]=`${n} is required.`;return}}}}if(t.type==="CHECKBOXES"){if(Array.isArray(r)&&r.length>0){let l=t.options,f=l&&typeof l=="object"&&"options"in l?l.options.map(v=>v.value):[];for(let v of r)if(!f.includes(String(v))){a[t.name]=`${n} contains an invalid option.`;return}}return}if(!(t.type==="NAME"||t.type==="ADDRESS")){if(r==null||String(r).trim()==="")return}if(t.type==="EMAIL"){let l=String(r);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(l)){a[t.name]="Enter a valid email address";return}let f=(o=t.validation)==null?void 0:o.domainRules;if(f){let v=(i=l.split("@")[1])==null?void 0:i.toLowerCase();if(f.allow&&f.allow.length>0&&!f.allow.map(w=>w.toLowerCase()).includes(v)){a[t.name]=`${n} must be from an allowed domain.`;return}if(f.block&&f.block.length>0&&f.block.map(w=>w.toLowerCase()).includes(v)){a[t.name]=`${n} domain is not allowed.`;return}}}if(t.type==="PHONE"){let l=String(r),m=((u=t.validation)==null?void 0:u.format)||"lenient";if(m==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(l)){a[t.name]=`${n} must be a valid phone number.`;return}}else if(m==="strict"){let f=l.replace(/[^\d+]/g,"");if(f.startsWith("+1"))f=f.substring(2);else if(f.startsWith("+")){a[t.name]=`${n} must be a valid US phone number (10 digits).`;return}else f.startsWith("1")&&f.length===11&&(f=f.substring(1));if(!/^\d{10}$/.test(f)){a[t.name]=`${n} must be a valid US phone number (10 digits).`;return}}return}if(t.type==="DATE"){let l=String(r),m=new Date(l);if(isNaN(m.getTime())){a[t.name]=`${n} must be a valid date.`;return}let f=new Date;f.setHours(0,0,0,0),m.setHours(0,0,0,0);let v=t.validation;if(v!=null&&v.minDate){let E=new Date(v.minDate==="today"?f:v.minDate);if(E.setHours(0,0,0,0),m<E){a[t.name]=`${n} must be on or after ${E.toLocaleDateString()}.`;return}}if(v!=null&&v.maxDate){let E=new Date(v.maxDate==="today"?f:v.maxDate);if(E.setHours(0,0,0,0),m>E){a[t.name]=`${n} must be on or before ${E.toLocaleDateString()}.`;return}}}if(t.type==="NUMBER"){let l=Number(r);if(isNaN(l)){a[t.name]=`${n} must be a number.`;return}let m=t.validation;if(m!=null&&m.integer&&!Number.isInteger(l)){a[t.name]=`${n} must be a whole number.`;return}if((m==null?void 0:m.min)!==void 0&&l<m.min){a[t.name]=`${n} must be at least ${m.min}.`;return}if((m==null?void 0:m.max)!==void 0&&l>m.max){a[t.name]=`${n} must be at most ${m.max}.`;return}return}if(t.type==="NAME"){let l=r,m=t.options||{parts:["first","last"]},f=m.parts||["first","last"],v=m.partsRequired||{};for(let E of f){let w=l[E];if((t.required||v[E])&&(!w||w.trim()==="")){let k=((b=m.partLabels)==null?void 0:b[E])||E;a[t.name]=`${k} is required.`;return}}return}if(t.type==="ADDRESS"){let l=r,m=t.options||{},f=["line1","city","region","postalCode"];if(!(m.showLine2!==!1?["line1","line2","city","region","postalCode"]:f).some(k=>{var M;return(M=l==null?void 0:l[k])==null?void 0:M.trim()})&&!t.required)return;let w={line1:"Street address",city:"City",region:"State",postalCode:"ZIP code"};for(let k of f)if(!((g=l==null?void 0:l[k])!=null&&g.trim())){a[t.name]=`${w[k]} is required.`;return}let D=(c=(h=l==null?void 0:l.postalCode)==null?void 0:h.trim())!=null?c:"";if(!/^\d{5}(-\d{4})?$/.test(D)){a[t.name]="ZIP code must be a valid US postal code (e.g., 12345 or 12345-6789).";return}return}if(t.type==="DROPDOWN"){let l=t.options,m=l!=null&&typeof l=="object"&&!Array.isArray(l)&&"options"in l,f=m?l.options.map(E=>E.value):Array.isArray(l)?l.map(E=>E.value):[],v=m&&l.allowOther===!0;if(f.length>0&&!v&&!f.includes(String(r))){a[t.name]=`${n} must be a valid option.`;return}}let p=String(r),d=F(t);if((y=t.validation)!=null&&y.minLength&&p.length<t.validation.minLength){a[t.name]=`${n} must be at least ${t.validation.minLength} characters.`;return}if(d&&p.length>d){a[t.name]=`${n} must be at most ${d} characters.`;return}if(t.type==="TEXT"||t.type==="TEXTAREA"){let l=(x=t.validation)==null?void 0:x.format;if(l&&l!=="alphanumeric"){let m=!0,f=`${n} is invalid.`;switch(l){case"numbers":m=/^\d+$/.test(p),f=`${n} must contain only numbers.`;break;case"letters":m=/^[A-Za-z]+$/.test(p),f=`${n} must contain only letters.`;break;case"url":{let v=p.startsWith("http")?p:`https://${p}`;try{m=new URL(v).hostname.includes(".")}catch(E){m=!1}f=`${n} must be a valid URL.`;break}case"postal-us":m=/^\d{5}(-\d{4})?$/.test(p),f=`${n} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":m=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(p),f=`${n} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}m||(a[t.name]=f)}}}),a}var W=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var X="feedback@canopyds.com",G=0,T=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},S=class extends Error{constructor(e){super(e),this.name="HostedOnlyFormError"}},N=class{constructor(e,a){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${G++}`;this.container=e,this.options=a}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof T){this.renderInactive();return}if(e instanceof S){this.renderHostedOnly();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var r;let e=this.options.baseUrl||"",a=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!a)throw new Error("Form configuration error: no formId");let t=await fetch(`${e}/api/embed/${a}`,{method:"GET",credentials:"omit"});if(!t.ok){if(t.status===403)try{let n=await t.json();if((n==null?void 0:n.code)==="FORM_INACTIVE")throw new T(n.error||"Form is inactive");if((n==null?void 0:n.code)==="FORM_HOSTED_ONLY")throw new S(n.error||"Form is only available at its hosted URL")}catch(n){if(n instanceof T||n instanceof S)throw n}throw new Error("Failed to load form definition")}return t.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let a=O(e.defaultTheme,this.options.themeOverrides);H(this.container,a),R([a.bodyFont,a.headingFont]),!a.bodyFont&&!a.headingFont&&q(a.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(z(a));let t=e.fields&&e.fields.length>0,r=e.title||e.description;if(!t&&!r){this.renderSkeleton();return}if(e.title||e.description){let c=document.createElement("div");if(c.className="canopy-header",e.title){let y=document.createElement("h2");y.className="canopy-title",y.textContent=e.title,c.appendChild(y)}if(e.description){let y=document.createElement("p");y.className="canopy-description",y.textContent=e.description,c.appendChild(y)}this.container.appendChild(c)}let n=document.createElement("div");n.className="canopy-status",n.setAttribute("role","alert"),n.setAttribute("aria-live","assertive"),this.statusEl=n;let p=document.createElement("form");p.className="canopy-form",p.addEventListener("submit",c=>this.handleSubmit(c)),this.formEl=p,e.fields.forEach(c=>{let{wrapper:y,input:x,errorEl:l}=this.createField(c);y&&p.appendChild(y),this.fieldElements.set(c.name,{input:x,errorEl:l})});let d=document.createElement("button");d.type="submit",d.className="canopy-submit",d.textContent=a.buttonText||"Submit",this.options.preview&&(d.classList.add("canopy-submit-preview"),d.setAttribute("data-preview-tooltip","For preview only. No submission will be created"));let o=getComputedStyle(this.container),i=o.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",u=o.getPropertyValue("--canopy-button-text").trim()||"#ffffff",b=o.getPropertyValue("--canopy-radius").trim()||"8px",g=o.getPropertyValue("--canopy-button-width").trim()||"100%";d.style.cssText=`
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
    `,this.submitButton=d;let h=document.createElement("div");h.className="canopy-form-actions",h.appendChild(d),p.appendChild(h),this.container.appendChild(n),this.container.appendChild(p),this.container.appendChild(this.renderWatermark(e))}renderWatermark(e){let a=document.createElement("div");a.className="canopy-watermark";let t=document.createElement("span");t.className="canopy-watermark-brand",t.textContent="Powered by Canopy Forms (Beta)",a.appendChild(t);let r=document.createElement("span");r.className="canopy-watermark-sep",r.setAttribute("aria-hidden","true"),r.textContent="\xB7",a.appendChild(r);let n=(e==null?void 0:e.title)||(e==null?void 0:e.name)||(e==null?void 0:e.formId)||"unknown form",p=(e==null?void 0:e.formId)||"unknown",d=`Canopy Forms issue \u2014 ${n}`,o=[`Form: ${n}`,`Form ID: ${p}`,"","Describe the issue:",""].join(`
`),i=`mailto:${X}?subject=${encodeURIComponent(d)}&body=${encodeURIComponent(o)}`,u=document.createElement("a");return u.className="canopy-watermark-link",u.href=i,u.textContent="Report an issue",u.rel="noopener",a.appendChild(u),a}createField(e){let a=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let r=document.createElement("label");if(r.className="canopy-label",r.htmlFor=a,r.textContent=e.label||e.name,e.required){let o=document.createElement("span");o.className="canopy-required",o.textContent=" *",o.setAttribute("aria-hidden","true"),r.appendChild(o)}let n;switch(e.type){case"TEXTAREA":{let o=document.createElement("textarea");o.className="canopy-textarea";let i=F(e);if(i){let u=Math.min(Math.max(Math.ceil(i/60),4),15);o.rows=u}else o.rows=4;n=o;break}case"DROPDOWN":{let o=e.options,i=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o),u=i?o.options:Array.isArray(o)?o:[],b=i?o.defaultValue:void 0,g=i?o.allowOther:!1,h=document.createElement("select");if(h.className="canopy-select",!b){let c=document.createElement("option");c.value="",c.textContent="Choose one...",c.disabled=!0,c.selected=!0,h.appendChild(c)}if(u.forEach(c=>{let y=document.createElement("option");y.value=c.value,y.textContent=c.label,b&&c.value===b&&(y.selected=!0),h.appendChild(y)}),g){let c=document.createElement("option");c.value="__other__",c.textContent="Other",h.appendChild(c)}if(n=h,g){let c=document.createElement("input");c.type="text",c.className="canopy-input canopy-select-other",c.name=`${e.name}_other`,c.placeholder="Please specify...",c.style.setProperty("display","none","important"),c.style.marginTop="0.5rem",c.addEventListener("input",()=>{c.setCustomValidity("")}),h.addEventListener("change",()=>{h.value==="__other__"?(c.style.setProperty("display","block","important"),e.required&&(c.required=!0)):(c.style.setProperty("display","none","important"),c.required=!1,c.value="")}),h.__otherInput=c}break}case"CHECKBOX":{let o=document.createElement("label");o.className="canopy-checkbox";let i=document.createElement("input");i.type="checkbox",i.id=a,i.name=e.name,e.required&&i.setAttribute("aria-required","true"),i.addEventListener("change",()=>{i.setCustomValidity("")}),o.appendChild(i);let u=document.createElement("span");if(u.textContent=e.label||e.name,o.appendChild(u),t.appendChild(o),e.helpText){let g=document.createElement("p");g.className="canopy-help-text",g.textContent=e.helpText,t.appendChild(g)}let b=document.createElement("span");return b.className="canopy-error",b.id=`${a}-error`,t.appendChild(b),i.setAttribute("aria-describedby",b.id),i.setAttribute("aria-invalid","false"),{wrapper:t,input:i,errorEl:b}}case"CHECKBOXES":{let o=e.options,u=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o)?o.options:Array.isArray(o)?o:[],b=document.createElement("div");b.className="canopy-checkboxes",b.setAttribute("data-checkbox-group",e.name),u.forEach(c=>{let y=document.createElement("label");y.className="canopy-checkbox";let x=document.createElement("input");x.type="checkbox",x.name=e.name,x.value=c.value,x.addEventListener("change",()=>{let m=b.querySelector("input[type=checkbox]");m&&m.setCustomValidity("")});let l=document.createElement("span");l.textContent=c.label,y.appendChild(x),y.appendChild(l),b.appendChild(y)});let g=document.createElement("input");if(g.type="hidden",g.id=a,g.name=e.name,t.appendChild(r),t.appendChild(b),e.helpText){let c=document.createElement("p");c.className="canopy-help-text",c.textContent=e.helpText,t.appendChild(c)}let h=document.createElement("span");return h.className="canopy-error",h.id=`${a}-error`,t.appendChild(h),g.setAttribute("aria-describedby",h.id),g.setAttribute("aria-invalid","false"),{wrapper:t,input:g,errorEl:h}}case"EMAIL":{let o=document.createElement("input");o.type="email",o.className="canopy-input",n=o;break}case"PHONE":{let o=document.createElement("input");o.type="tel",o.setAttribute("inputmode","tel"),o.setAttribute("autocomplete","tel"),o.className="canopy-input",n=o;break}case"DATE":{let o=document.createElement("input");o.type="date",o.className="canopy-input";let i=e.validation;i&&(i.minDate&&(o.min=this.resolveDate(i.minDate)),i.maxDate&&(o.max=this.resolveDate(i.maxDate))),n=o;break}case"NUMBER":{let o=document.createElement("input");o.type="number",o.className="canopy-input";let i=e.validation;i!=null&&i.integer?(o.setAttribute("inputmode","numeric"),o.setAttribute("step","1")):(o.setAttribute("inputmode","decimal"),o.setAttribute("step","any")),(i==null?void 0:i.min)!==void 0&&o.setAttribute("min",String(i.min)),(i==null?void 0:i.max)!==void 0&&o.setAttribute("max",String(i.max)),n=o;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);default:{let o=document.createElement("input");o.type="text",o.className="canopy-input",n=o}}n.id=a,n.name=e.name,n.setAttribute("aria-invalid","false"),e.required&&n.setAttribute("aria-required","true"),e.placeholder&&n.setAttribute("placeholder",e.placeholder);let p=F(e);p&&(n instanceof HTMLInputElement||n instanceof HTMLTextAreaElement)&&(n.maxLength=p),n.addEventListener("input",()=>{n.setCustomValidity("")});let d=document.createElement("span");if(d.className="canopy-error",d.id=`${a}-error`,n.setAttribute("aria-describedby",d.id),t.appendChild(r),t.appendChild(n),n.__otherInput&&t.appendChild(n.__otherInput),e.helpText){let o=document.createElement("p");o.className="canopy-help-text",o.textContent=e.helpText,t.appendChild(o)}return t.appendChild(d),{wrapper:t,input:n,errorEl:d}}resolveDate(e){return e==="today"?new Date().toISOString().split("T")[0]:e}createNameField(e){let a=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-name-group",t.setAttribute("role","group"),t.setAttribute("aria-labelledby",`${a}-group-label`);let r=document.createElement("span");r.id=`${a}-group-label`,r.className="canopy-label",r.textContent=e.label||e.name,t.appendChild(r);let n=e.options||{parts:["first","last"]},p=n.parts||["first","last"],d=n.partLabels||{},o=n.partsRequired||{},i={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},u=document.createElement("div");u.className="canopy-name-parts";let b=document.createElement("input");b.type="hidden",b.id=a,b.name=e.name;let g=document.createElement("span");if(g.className="canopy-error",g.id=`${a}-error`,p.forEach(h=>{let c=document.createElement("div");c.className="canopy-name-part";let y=document.createElement("label");y.className="canopy-name-part-label";let x=`${a}-${h}`;if(y.htmlFor=x,y.textContent=d[h]||i[h]||h,e.required||o[h]){let m=document.createElement("span");m.className="canopy-required",m.textContent=" *",m.setAttribute("aria-hidden","true"),y.appendChild(m)}let l=document.createElement("input");l.type="text",l.className="canopy-input",l.id=x,l.name=`${e.name}.${h}`,l.setAttribute("data-name-part",h),l.setAttribute("data-name-field",e.name),(e.required||o[h])&&l.setAttribute("aria-required","true"),l.addEventListener("input",()=>{u.querySelectorAll("input[data-name-part]").forEach(m=>m.setCustomValidity(""))}),c.appendChild(y),c.appendChild(l),u.appendChild(c)}),t.appendChild(u),e.helpText){let h=document.createElement("p");h.className="canopy-help-text",h.textContent=e.helpText,t.appendChild(h)}return t.appendChild(g),{wrapper:t,input:b,errorEl:g}}createAddressField(e){let a=`${this.instanceId}-${e.name}`,t=e.options||{},r=document.createElement("div");r.className="canopy-field canopy-address-group",r.setAttribute("role","group"),r.setAttribute("aria-labelledby",`${a}-group-label`);let n=document.createElement("span");n.id=`${a}-group-label`,n.className="canopy-label",n.textContent=e.label||"Address",r.appendChild(n);let p=document.createElement("div");p.className="canopy-address-parts";let d=document.createElement("input");d.type="hidden",d.id=a,d.name=e.name;let o=document.createElement("span");o.className="canopy-error",o.id=`${a}-error`;let i=[{key:"line1",label:"Street Address",tag:"input"}];if(t.showLine2!==!1&&i.push({key:"line2",label:"Apt, Suite, etc.",tag:"input"}),i.push({key:"city",label:"City",tag:"input"},{key:"region",label:"State",tag:"select"},{key:"postalCode",label:"ZIP Code",tag:"input",attrs:{maxlength:"10",inputmode:"numeric"}}),i.forEach(u=>{let b=document.createElement("div");b.className="canopy-address-part";let g=document.createElement("label");g.className="canopy-address-part-label";let h=`${a}-${u.key}`;if(g.htmlFor=h,g.textContent=u.label,e.required&&u.key!=="line2"){let y=document.createElement("span");y.className="canopy-required",y.textContent=" *",y.setAttribute("aria-hidden","true"),g.appendChild(y)}let c;if(u.tag==="select"){let y=document.createElement("select");y.className="canopy-select";let x=document.createElement("option");x.value="",x.textContent="Select...",y.appendChild(x),W.forEach(l=>{let m=document.createElement("option");m.value=l.value,m.textContent=l.label,y.appendChild(m)}),y.addEventListener("change",()=>{p.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(l=>l.setCustomValidity(""))}),c=y}else{let y=document.createElement("input");y.type="text",y.className="canopy-input",u.attrs&&Object.entries(u.attrs).forEach(([x,l])=>y.setAttribute(x,l)),y.addEventListener("input",()=>{p.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(x=>x.setCustomValidity(""))}),c=y}c.id=h,c.setAttribute("data-address-part",u.key),c.setAttribute("data-address-field",e.name),e.required&&u.key!=="line2"&&c.setAttribute("aria-required","true"),b.appendChild(g),b.appendChild(c),p.appendChild(b)}),r.appendChild(p),e.helpText){let u=document.createElement("p");u.className="canopy-help-text",u.textContent=e.helpText,r.appendChild(u)}return r.appendChild(o),{wrapper:r,input:d,errorEl:o}}collectValues(){let e={};return this.fieldElements.forEach((a,t)=>{if(a.input instanceof HTMLInputElement)if(a.input.type==="checkbox")e[t]=a.input.checked;else if(a.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${t}"]`);if(r){let n=[];r.querySelectorAll("input[type=checkbox]:checked").forEach(p=>{n.push(p.value)}),e[t]=n}else{let n=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(n.length>0){let p={};n.forEach(d=>{let o=d,i=o.getAttribute("data-name-part");i&&(p[i]=o.value)}),e[t]=p}else{let p=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(p.length>0){let d={};p.forEach(o=>{let i=o.getAttribute("data-address-part");i&&(d[i]=o.value)}),e[t]=d}else e[t]=a.input.value}}}else e[t]=a.input.value;else a.input instanceof HTMLSelectElement&&a.input.value==="__other__"&&a.input.__otherInput?e[t]=a.input.__otherInput.value:e[t]=a.input.value}),e}findFailingInput(e){let a=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(a.length>0){for(let n of a)if(!n.value.trim())return n;return a[0]}let t=["line1","city","region","postalCode"],r=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(r.length>0){for(let n of r){let p=n.getAttribute("data-address-part");if(p&&t.includes(p)&&!n.value.trim())return n}for(let n of r)if(n.getAttribute("data-address-part")==="postalCode")return n;return r[0]}return null}showErrors(e){this.fieldElements.forEach((t,r)=>{let n=e[r]||"";if(t.input.type==="hidden"){let p=this.container.querySelector(`[data-checkbox-group="${r}"]`);if(p){let d=p.querySelector("input[type=checkbox]");d&&d.setCustomValidity(n)}else{let d=n?this.findFailingInput(r):null;d?d.setCustomValidity(n):this.container.querySelectorAll(`input[data-name-field="${r}"], input[data-address-field="${r}"], select[data-address-field="${r}"]`).forEach(i=>i.setCustomValidity(""))}}else t.input.setCustomValidity(n);t.errorEl.textContent=n,t.input.setAttribute("aria-invalid",n?"true":"false")});let a=Object.keys(e);if(a.length>0){let t=this.fieldElements.get(a[0]);if(t)if(t.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${a[0]}"]`);if(r){let n=r.querySelector("input[type=checkbox]");n&&(n.reportValidity(),n.focus())}else{let n=this.findFailingInput(a[0]);n&&(n.reportValidity(),n.focus())}}else t.input.reportValidity(),t.input.focus()}}setStatus(e,a){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${a}`)}async handleSubmit(e){var r,n,p;if(e.preventDefault(),!this.formDefinition||this.options.preview)return;this.setStatus("","info"),this.fieldElements.forEach((d,o)=>{if(d.input.setCustomValidity(""),d.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${o}"]`);if(i){let u=i.querySelector("input[type=checkbox]");u&&u.setCustomValidity("")}else this.container.querySelectorAll(`input[data-name-field="${o}"], input[data-address-field="${o}"], select[data-address-field="${o}"]`).forEach(b=>b.setCustomValidity(""))}});let a=this.collectValues(),t=P(this.formDefinition.fields,a);if(this.showErrors(t),Object.keys(t).length>0){let d=Object.keys(t).length;this.setStatus(`Please fix ${d} field${d>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let d=this.options.baseUrl||"",o=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!o){this.setStatus("Form configuration error.","error");return}let i=await fetch(`${d}/api/embed/${o}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)}),u=await i.json();if(!i.ok){u!=null&&u.fields&&this.showErrors(u.fields),this.setStatus((u==null?void 0:u.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(d){console.error(d),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let d=((p=(n=this.formDefinition)==null?void 0:n.defaultTheme)==null?void 0:p.buttonText)||"Submit";this.submitButton.textContent=d,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let a=this.container.querySelector(".canopy-success");a&&a.remove();let t=document.createElement("div");t.className="canopy-success",t.setAttribute("role","status"),t.setAttribute("aria-live","polite");let r=document.createElement("div");r.className="canopy-success-icon",r.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',t.appendChild(r);let n=document.createElement("p");n.className="canopy-success-message",n.textContent=e,t.appendChild(n);let p=document.createElement("button");p.type="button",p.className="canopy-success-reset",p.textContent="Submit another response",p.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),t.appendChild(p),this.container.appendChild(t)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let a=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],t=0,r=document.createElement("div");r.className="canopy-skeleton-bar canopy-skeleton-title",r.style.animationDelay=`${t}s`,e.appendChild(r),t+=.15;let n=document.createElement("div");n.className="canopy-skeleton-bar canopy-skeleton-desc",n.style.animationDelay=`${t}s`,e.appendChild(n),t+=.15;for(let d of a){let o=document.createElement("div");o.className="canopy-skeleton-field";let i=document.createElement("div");i.className="canopy-skeleton-bar canopy-skeleton-label",i.style.width=d.labelW,i.style.animationDelay=`${t}s`,o.appendChild(i),t+=.1;let u=document.createElement("div");u.className=`canopy-skeleton-bar canopy-skeleton-${d.type}`,u.style.animationDelay=`${t}s`,o.appendChild(u),t+=.15,e.appendChild(o)}let p=document.createElement("div");p.className="canopy-skeleton-bar canopy-skeleton-button",p.style.animationDelay=`${t}s`,e.appendChild(p),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let a=document.createElement("div");a.className="canopy-status canopy-status-error",a.textContent=e,this.container.appendChild(a),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let a=document.createElement("h2");a.className="canopy-inactive-heading",a.textContent="Form Not Available",e.appendChild(a);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderHostedOnly(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let a=document.createElement("h2");a.className="canopy-inactive-heading",a.textContent="Form Not Available",e.appendChild(a);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is only available at its hosted URL and cannot be embedded. Please contact the form owner.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}};var V=`
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
`;var _="canopy-embed-styles";function Y(){if(document.getElementById(_))return;let s=document.createElement("style");s.id=_,s.textContent=V,document.head.appendChild(s)}function J(s){var e;return s.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function Q(s){let e=s.dataset.theme;if(e)try{return JSON.parse(e)}catch(a){console.warn("Canopy Forms: invalid data-theme JSON");return}}function $(){Y(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let a=e.dataset.canopyForm;if(!a){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let t=Q(e),r=J(e);new N(e,{formId:a,themeOverrides:t,baseUrl:r}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",$):$();window.CanopyForms={init:$,CanopyForm:N};})();
