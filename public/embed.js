"use strict";(()=>{var v={fontSize:14,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:"md",titleWeight:"normal",labelSize:"md",labelWeight:"medium",labelTransform:"none"},A=new Set;function C(l,e){if(!l)return e;let n=l.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:e:e}function $(l,e){return{...v,...l!=null?l:{},...e!=null?e:{}}}function P(l){let e=/^#?([0-9a-f]{6})$/i.exec(l.trim());if(!e)return null;let n=parseInt(e[1],16);return[n>>16&255,n>>8&255,n&255]}function q(l,e,n){let[t,r,a]=[l,e,n].map(m=>{let u=m/255;return u<=.03928?u/12.92:Math.pow((u+.055)/1.055,2.4)});return .2126*t+.7152*r+.0722*a}function V(l){try{let e=P(l);return e&&q(...e)>.179?"#18181b":"#ffffff"}catch(e){return"#ffffff"}}function D(l,e){var i,y,b,g,f,d;let n=N(e.bodyFont,e.fontFamily);l.style.setProperty("--canopy-font",n);let t=N(e.headingFont);l.style.setProperty("--canopy-heading-font",t==="inherit"?"var(--canopy-font)":t),l.style.setProperty("--canopy-font-size",`${(i=e.fontSize)!=null?i:v.fontSize}px`),l.style.setProperty("--canopy-text",C(e.text,v.text)),l.style.setProperty("--canopy-bg",C(e.background,v.background)),l.style.setProperty("--canopy-field-bg",C(e.fieldBackground,v.fieldBackground));let r=C(e.primary,v.primary);l.style.setProperty("--canopy-primary",r),l.style.setProperty("--canopy-button-text",V(r)),l.style.setProperty("--canopy-border",C(e.border,v.border)),l.style.setProperty("--canopy-radius",`${(y=e.radius)!=null?y:v.radius}px`),l.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),l.style.setProperty("--canopy-button-align",e.buttonAlign||v.buttonAlign);let a={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"};l.style.setProperty("--canopy-title-size",a[(b=e.titleSize)!=null?b:"md"]),l.style.setProperty("--canopy-label-size",a[(g=e.labelSize)!=null?g:"md"]);let m={light:"300",normal:"400",bold:"700",semibold:"700"},u=(f=e.titleWeight)!=null?f:"normal";l.style.setProperty("--canopy-title-weight",(d=m[u])!=null?d:"400");let o=e.titleColor?C(e.titleColor,""):"";o?l.style.setProperty("--canopy-title-color",o):l.style.removeProperty("--canopy-title-color"),l.style.setProperty("--canopy-heading-transform",e.labelTransform==="uppercase"?"uppercase":"none")}function F(l){switch(l.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function N(l,e){return l&&l!=="inherit"?`'${l}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function M(l){let e=l.filter(a=>!!a&&a!=="inherit"&&!A.has(a));if(e.length===0)return;let t=`https://fonts.googleapis.com/css2?${e.map(a=>`family=${encodeURIComponent(a)}:wght@300;400;700`).join("&")}&display=swap`,r=document.createElement("link");r.rel="stylesheet",r.href=t,r.dataset.canopyFont="true",document.head.appendChild(r),e.forEach(a=>A.add(a))}function I(l){if(!l||A.has(l))return;let e=document.createElement("link");e.rel="stylesheet",e.href=l,e.dataset.canopyFont="true",document.head.appendChild(e),A.add(l)}var W={TEXT:200,EMAIL:254,TEXTAREA:2e3};function L(l){var e;return(e=l.validation)!=null&&e.maxLength?l.validation.maxLength:W[l.type]}function _(l){return l.label||l.name}function O(l,e){let n={};return l.forEach(t=>{var o,i,y,b,g,f,d;let r=e[t.name],a=_(t);if(t.required){if(t.type==="CHECKBOX"){if(!r){n[t.name]=`${a} is required.`;return}}else if(t.type==="CHECKBOXES"){if(!Array.isArray(r)||r.length===0){n[t.name]=`${a} is required.`;return}}else if(t.type!=="NAME"){if(t.type!=="ADDRESS"){if(r==null||String(r).trim()===""){n[t.name]=`${a} is required.`;return}}}}if(t.type==="CHECKBOXES"){if(Array.isArray(r)&&r.length>0){let s=t.options,p=s&&typeof s=="object"&&"options"in s?s.options.map(h=>h.value):[];for(let h of r)if(!p.includes(String(h))){n[t.name]=`${a} contains an invalid option.`;return}}return}if(!(t.type==="NAME"||t.type==="ADDRESS")){if(r==null||String(r).trim()==="")return}if(t.type==="EMAIL"){let s=String(r);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(s)){n[t.name]="Enter a valid email address";return}let p=(o=t.validation)==null?void 0:o.domainRules;if(p){let h=(i=s.split("@")[1])==null?void 0:i.toLowerCase();if(p.allow&&p.allow.length>0&&!p.allow.map(E=>E.toLowerCase()).includes(h)){n[t.name]=`${a} must be from an allowed domain.`;return}if(p.block&&p.block.length>0&&p.block.map(E=>E.toLowerCase()).includes(h)){n[t.name]=`${a} domain is not allowed.`;return}}}if(t.type==="PHONE"){let s=String(r),c=((y=t.validation)==null?void 0:y.format)||"lenient";if(c==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(s)){n[t.name]=`${a} must be a valid phone number.`;return}}else if(c==="strict"){let p=s.replace(/[^\d+]/g,"");if(p.startsWith("+1"))p=p.substring(2);else if(p.startsWith("+")){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}else p.startsWith("1")&&p.length===11&&(p=p.substring(1));if(!/^\d{10}$/.test(p)){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}}return}if(t.type==="DATE"){let s=String(r),c=new Date(s);if(isNaN(c.getTime())){n[t.name]=`${a} must be a valid date.`;return}let p=new Date;p.setHours(0,0,0,0),c.setHours(0,0,0,0);let h=t.validation;if(h!=null&&h.noFuture&&c>p){n[t.name]=`${a} cannot be a future date.`;return}if(h!=null&&h.noPast&&c<p){n[t.name]=`${a} cannot be a past date.`;return}if(h!=null&&h.minDate){let x=new Date(h.minDate==="today"?p:h.minDate);if(x.setHours(0,0,0,0),c<x){n[t.name]=`${a} must be on or after ${x.toLocaleDateString()}.`;return}}if(h!=null&&h.maxDate){let x=new Date(h.maxDate==="today"?p:h.maxDate);if(x.setHours(0,0,0,0),c>x){n[t.name]=`${a} must be on or before ${x.toLocaleDateString()}.`;return}}}if(t.type==="NUMBER"){let s=Number(r);if(isNaN(s)){n[t.name]=`${a} must be a number.`;return}let c=t.validation;if(c!=null&&c.integer&&!Number.isInteger(s)){n[t.name]=`${a} must be a whole number.`;return}if((c==null?void 0:c.min)!==void 0&&s<c.min){n[t.name]=`${a} must be at least ${c.min}.`;return}if((c==null?void 0:c.max)!==void 0&&s>c.max){n[t.name]=`${a} must be at most ${c.max}.`;return}return}if(t.type==="NAME"){let s=r,c=t.options||{parts:["first","last"]},p=c.parts||["first","last"],h=c.partsRequired||{};for(let x of p){let E=s[x];if((t.required||h[x])&&(!E||E.trim()==="")){let S=((b=c.partLabels)==null?void 0:b[x])||x;n[t.name]=`${S} is required.`;return}}return}if(t.type==="ADDRESS"){let s=r,c=t.options||{},p=["line1","city","region","postalCode"];if(!(c.showLine2!==!1?["line1","line2","city","region","postalCode"]:p).some(k=>{var S;return(S=s==null?void 0:s[k])==null?void 0:S.trim()})&&!t.required)return;let E={line1:"Street address",city:"City",region:"State",postalCode:"ZIP code"};for(let k of p)if(!((g=s==null?void 0:s[k])!=null&&g.trim())){n[t.name]=`${E[k]} is required.`;return}return}if(t.type==="DROPDOWN"&&Array.isArray(t.options)&&!t.options.map(c=>c.value).includes(String(r))){n[t.name]=`${a} must be a valid option.`;return}let m=String(r),u=L(t);if((f=t.validation)!=null&&f.minLength&&m.length<t.validation.minLength){n[t.name]=`${a} must be at least ${t.validation.minLength} characters.`;return}if(u&&m.length>u){n[t.name]=`${a} must be at most ${u} characters.`;return}if(t.type==="TEXT"||t.type==="TEXTAREA"){let s=(d=t.validation)==null?void 0:d.format;if(s&&s!=="alphanumeric"){let c=!0,p=`${a} is invalid.`;switch(s){case"numbers":c=/^\d+$/.test(m),p=`${a} must contain only numbers.`;break;case"letters":c=/^[A-Za-z]+$/.test(m),p=`${a} must contain only letters.`;break;case"url":{let h=m.startsWith("http")?m:`https://${m}`;try{c=new URL(h).hostname.includes(".")}catch(x){c=!1}p=`${a} must be a valid URL.`;break}case"postal-us":c=/^\d{5}(-\d{4})?$/.test(m),p=`${a} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":c=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(m),p=`${a} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}c||(n[t.name]=p)}}}),n}var H=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var B=0,T=class{constructor(e,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.submitButton=null;this.instanceId=`canopy-${B++}`;this.container=e,this.options=n}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){console.error(e),this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var r;let e=this.options.baseUrl||"",n=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!n)throw new Error("Form configuration error: no formId");let t=await fetch(`${e}/api/embed/${n}`,{method:"GET",credentials:"omit"});if(!t.ok)throw new Error("Failed to load form definition");return t.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let n=$(e.defaultTheme,this.options.themeOverrides);D(this.container,n),M([n.bodyFont,n.headingFont]),!n.bodyFont&&!n.headingFont&&I(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(F(n));let t=e.fields&&e.fields.length>0,r=e.title||e.description;if(!t&&!r){this.renderSkeleton();return}if(e.title||e.description){let d=document.createElement("div");if(d.className="canopy-header",e.title){let s=document.createElement("h2");s.className="canopy-title",s.textContent=e.title,d.appendChild(s)}if(e.description){let s=document.createElement("p");s.className="canopy-description",s.textContent=e.description,d.appendChild(s)}this.container.appendChild(d)}let a=document.createElement("div");a.className="canopy-status",a.setAttribute("role","status"),this.statusEl=a;let m=document.createElement("form");m.className="canopy-form",m.addEventListener("submit",d=>this.handleSubmit(d)),e.fields.forEach(d=>{let{wrapper:s,input:c,errorEl:p}=this.createField(d);s&&m.appendChild(s),this.fieldElements.set(d.name,{input:c,errorEl:p})});let u=document.createElement("button");u.type="submit",u.className="canopy-submit",u.textContent=n.buttonText||"Submit";let o=getComputedStyle(this.container),i=o.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",y=o.getPropertyValue("--canopy-button-text").trim()||"#ffffff",b=o.getPropertyValue("--canopy-radius").trim()||"8px",g=o.getPropertyValue("--canopy-button-width").trim()||"100%";u.style.cssText=`
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
      color: ${y} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=u;let f=document.createElement("div");f.className="canopy-form-actions",f.appendChild(u),m.appendChild(f),this.container.appendChild(a),this.container.appendChild(m)}createField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let r=document.createElement("label");if(r.className="canopy-label",r.htmlFor=n,r.textContent=e.label||e.name,e.required){let o=document.createElement("span");o.className="canopy-required",o.textContent=" *",r.appendChild(o)}let a;switch(e.type){case"TEXTAREA":{let o=document.createElement("textarea");o.className="canopy-textarea";let i=L(e);if(i){let y=Math.min(Math.max(Math.ceil(i/60),4),15);o.rows=y}else o.rows=4;a=o;break}case"DROPDOWN":{let o=e.options,i=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o),y=i?o.options:Array.isArray(o)?o:[],b=i?o.defaultValue:void 0,g=i?o.allowOther:!1,f=document.createElement("select");if(f.className="canopy-select",y.forEach(d=>{let s=document.createElement("option");s.value=d.value,s.textContent=d.label,b&&d.value===b&&(s.selected=!0),f.appendChild(s)}),g){let d=document.createElement("option");d.value="__other__",d.textContent="Other",f.appendChild(d)}if(a=f,g){let d=document.createElement("input");d.type="text",d.className="canopy-input canopy-select-other",d.name=`${e.name}_other`,d.placeholder="Please specify...",d.style.setProperty("display","none","important"),d.style.marginTop="0.5rem",d.addEventListener("input",()=>{d.setCustomValidity("")}),f.addEventListener("change",()=>{f.value==="__other__"?(d.style.setProperty("display","block","important"),e.required&&(d.required=!0)):(d.style.setProperty("display","none","important"),d.required=!1,d.value="")}),f.__otherInput=d}break}case"CHECKBOX":{let o=document.createElement("label");o.className="canopy-checkbox";let i=document.createElement("input");i.type="checkbox",i.id=n,i.name=e.name,i.addEventListener("change",()=>{i.setCustomValidity("")}),o.appendChild(i);let y=document.createElement("span");if(y.textContent=e.label||e.name,o.appendChild(y),t.appendChild(o),e.helpText){let g=document.createElement("p");g.className="canopy-help-text",g.textContent=e.helpText,t.appendChild(g)}let b=document.createElement("span");return b.className="canopy-error",b.id=`${n}-error`,t.appendChild(b),i.setAttribute("aria-describedby",b.id),i.setAttribute("aria-invalid","false"),{wrapper:t,input:i,errorEl:b}}case"CHECKBOXES":{let o=e.options,y=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o)?o.options:Array.isArray(o)?o:[],b=document.createElement("div");b.className="canopy-checkboxes",b.setAttribute("data-checkbox-group",e.name),y.forEach(d=>{let s=document.createElement("label");s.className="canopy-checkbox";let c=document.createElement("input");c.type="checkbox",c.name=e.name,c.value=d.value,c.addEventListener("change",()=>{let h=b.querySelector("input[type=checkbox]");h&&h.setCustomValidity("")});let p=document.createElement("span");p.textContent=d.label,s.appendChild(c),s.appendChild(p),b.appendChild(s)});let g=document.createElement("input");if(g.type="hidden",g.id=n,g.name=e.name,t.appendChild(r),t.appendChild(b),e.helpText){let d=document.createElement("p");d.className="canopy-help-text",d.textContent=e.helpText,t.appendChild(d)}let f=document.createElement("span");return f.className="canopy-error",f.id=`${n}-error`,t.appendChild(f),g.setAttribute("aria-describedby",f.id),g.setAttribute("aria-invalid","false"),{wrapper:t,input:g,errorEl:f}}case"EMAIL":{let o=document.createElement("input");o.type="email",o.className="canopy-input",a=o;break}case"PHONE":{let o=document.createElement("input");o.type="tel",o.setAttribute("inputmode","tel"),o.setAttribute("autocomplete","tel"),o.className="canopy-input",a=o;break}case"DATE":{let o=document.createElement("input");o.type="date",o.className="canopy-input";let i=e.validation;i&&(i.minDate&&(o.min=this.resolveDate(i.minDate)),i.maxDate&&(o.max=this.resolveDate(i.maxDate)),i.noFuture&&(o.max=new Date().toISOString().split("T")[0]),i.noPast&&(o.min=new Date().toISOString().split("T")[0])),a=o;break}case"NUMBER":{let o=document.createElement("input");o.type="number",o.className="canopy-input";let i=e.validation;i!=null&&i.integer?(o.setAttribute("inputmode","numeric"),o.setAttribute("step","1")):(o.setAttribute("inputmode","decimal"),o.setAttribute("step","any")),(i==null?void 0:i.min)!==void 0&&o.setAttribute("min",String(i.min)),(i==null?void 0:i.max)!==void 0&&o.setAttribute("max",String(i.max)),a=o;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);default:{let o=document.createElement("input");o.type="text",o.className="canopy-input",a=o}}a.id=n,a.name=e.name,a.setAttribute("aria-invalid","false"),e.placeholder&&a.setAttribute("placeholder",e.placeholder);let m=L(e);m&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=m),a.addEventListener("input",()=>{a.setCustomValidity("")});let u=document.createElement("span");if(u.className="canopy-error",u.id=`${n}-error`,a.setAttribute("aria-describedby",u.id),t.appendChild(r),t.appendChild(a),a.__otherInput&&t.appendChild(a.__otherInput),e.helpText){let o=document.createElement("p");o.className="canopy-help-text",o.textContent=e.helpText,t.appendChild(o)}return t.appendChild(u),{wrapper:t,input:a,errorEl:u}}resolveDate(e){return e==="today"?new Date().toISOString().split("T")[0]:e}createNameField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-name-group";let r=document.createElement("label");r.className="canopy-label",r.textContent=e.label||e.name,t.appendChild(r);let a=e.options||{parts:["first","last"]},m=a.parts||["first","last"],u=a.partLabels||{},o=a.partsRequired||{},i={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},y=document.createElement("div");y.className="canopy-name-parts";let b=document.createElement("input");b.type="hidden",b.id=n,b.name=e.name;let g=document.createElement("span");if(g.className="canopy-error",g.id=`${n}-error`,m.forEach(f=>{let d=document.createElement("div");d.className="canopy-name-part";let s=document.createElement("label");s.className="canopy-name-part-label";let c=`${n}-${f}`;if(s.htmlFor=c,s.textContent=u[f]||i[f]||f,e.required||o[f]){let h=document.createElement("span");h.className="canopy-required",h.textContent=" *",s.appendChild(h)}let p=document.createElement("input");p.type="text",p.className="canopy-input",p.id=c,p.name=`${e.name}.${f}`,p.setAttribute("data-name-part",f),p.setAttribute("data-name-field",e.name),p.addEventListener("input",()=>{y.querySelectorAll("input[data-name-part]").forEach(h=>h.setCustomValidity(""))}),d.appendChild(s),d.appendChild(p),y.appendChild(d)}),t.appendChild(y),e.helpText){let f=document.createElement("p");f.className="canopy-help-text",f.textContent=e.helpText,t.appendChild(f)}return t.appendChild(g),{wrapper:t,input:b,errorEl:g}}createAddressField(e){let n=`${this.instanceId}-${e.name}`,t=e.options||{},r=document.createElement("div");r.className="canopy-field canopy-address-group";let a=document.createElement("label");a.className="canopy-label",a.textContent=e.label||"Address",r.appendChild(a);let m=document.createElement("div");m.className="canopy-address-parts";let u=document.createElement("input");u.type="hidden",u.id=n,u.name=e.name;let o=document.createElement("span");o.className="canopy-error",o.id=`${n}-error`;let i=[{key:"line1",label:"Street Address",tag:"input"}];if(t.showLine2!==!1&&i.push({key:"line2",label:"Apt, Suite, etc.",tag:"input"}),i.push({key:"city",label:"City",tag:"input"},{key:"region",label:"State",tag:"select"},{key:"postalCode",label:"ZIP Code",tag:"input",attrs:{maxlength:"10",inputmode:"numeric"}}),i.forEach(y=>{let b=document.createElement("div");b.className="canopy-address-part";let g=document.createElement("label");g.className="canopy-address-part-label";let f=`${n}-${y.key}`;if(g.htmlFor=f,g.textContent=y.label,e.required&&y.key!=="line2"){let s=document.createElement("span");s.className="canopy-required",s.textContent=" *",g.appendChild(s)}let d;if(y.tag==="select"){let s=document.createElement("select");s.className="canopy-select";let c=document.createElement("option");c.value="",c.textContent="Select...",s.appendChild(c),H.forEach(p=>{let h=document.createElement("option");h.value=p.value,h.textContent=p.label,s.appendChild(h)}),s.addEventListener("change",()=>{m.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(p=>p.setCustomValidity(""))}),d=s}else{let s=document.createElement("input");s.type="text",s.className="canopy-input",y.attrs&&Object.entries(y.attrs).forEach(([c,p])=>s.setAttribute(c,p)),s.addEventListener("input",()=>{m.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(c=>c.setCustomValidity(""))}),d=s}d.id=f,d.setAttribute("data-address-part",y.key),d.setAttribute("data-address-field",e.name),b.appendChild(g),b.appendChild(d),m.appendChild(b)}),r.appendChild(m),e.helpText){let y=document.createElement("p");y.className="canopy-help-text",y.textContent=e.helpText,r.appendChild(y)}return r.appendChild(o),{wrapper:r,input:u,errorEl:o}}collectValues(){let e={};return this.fieldElements.forEach((n,t)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")e[t]=n.input.checked;else if(n.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${t}"]`);if(r){let a=[];r.querySelectorAll("input[type=checkbox]:checked").forEach(m=>{a.push(m.value)}),e[t]=a}else{let a=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(a.length>0){let m={};a.forEach(u=>{let o=u,i=o.getAttribute("data-name-part");i&&(m[i]=o.value)}),e[t]=m}else{let m=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(m.length>0){let u={};m.forEach(o=>{let i=o.getAttribute("data-address-part");i&&(u[i]=o.value)}),e[t]=u}else e[t]=n.input.value}}}else e[t]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?e[t]=n.input.__otherInput.value:e[t]=n.input.value}),e}findFailingInput(e){let n=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(n.length>0){for(let a of n)if(!a.value.trim())return a;return n[0]}let t=["line1","city","region","postalCode"],r=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(r.length>0){for(let a of r){let m=a.getAttribute("data-address-part");if(m&&t.includes(m)&&!a.value.trim())return a}return r[0]}return null}showErrors(e){this.fieldElements.forEach((t,r)=>{let a=e[r]||"";if(t.input.type==="hidden"){let m=this.container.querySelector(`[data-checkbox-group="${r}"]`);if(m){let u=m.querySelector("input[type=checkbox]");u&&u.setCustomValidity(a)}else{let u=a?this.findFailingInput(r):null;u?u.setCustomValidity(a):this.container.querySelectorAll(`input[data-name-field="${r}"], input[data-address-field="${r}"], select[data-address-field="${r}"]`).forEach(i=>i.setCustomValidity(""))}}else t.input.setCustomValidity(a);t.errorEl.textContent=a,t.input.setAttribute("aria-invalid",a?"true":"false")});let n=Object.keys(e);if(n.length>0){let t=this.fieldElements.get(n[0]);if(t)if(t.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(r){let a=r.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.findFailingInput(n[0]);a&&(a.reportValidity(),a.focus())}}else t.input.reportValidity(),t.input.focus()}}setStatus(e,n){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(e){var r,a,m;if(e.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach((u,o)=>{if(u.input.setCustomValidity(""),u.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${o}"]`);if(i){let y=i.querySelector("input[type=checkbox]");y&&y.setCustomValidity("")}else this.container.querySelectorAll(`input[data-name-field="${o}"], input[data-address-field="${o}"], select[data-address-field="${o}"]`).forEach(b=>b.setCustomValidity(""))}});let n=this.collectValues(),t=O(this.formDefinition.fields,n);if(this.showErrors(t),Object.keys(t).length>0){let u=Object.keys(t).length;this.setStatus(`Please fix ${u} field${u>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let u=this.options.baseUrl||"",o=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!o){this.setStatus("Form configuration error.","error");return}let i=await fetch(`${u}/api/embed/${o}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),y=await i.json();if(!i.ok){y!=null&&y.fields&&this.showErrors(y.fields),this.setStatus((y==null?void 0:y.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}this.setStatus(this.formDefinition.successMessage||"Thanks for your submission!","success"),e.target.reset()}catch(u){console.error(u),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let u=((m=(a=this.formDefinition)==null?void 0:a.defaultTheme)==null?void 0:m.buttonText)||"Submit";this.submitButton.textContent=u,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let n=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],t=0,r=document.createElement("div");r.className="canopy-skeleton-bar canopy-skeleton-title",r.style.animationDelay=`${t}s`,e.appendChild(r),t+=.15;let a=document.createElement("div");a.className="canopy-skeleton-bar canopy-skeleton-desc",a.style.animationDelay=`${t}s`,e.appendChild(a),t+=.15;for(let u of n){let o=document.createElement("div");o.className="canopy-skeleton-field";let i=document.createElement("div");i.className="canopy-skeleton-bar canopy-skeleton-label",i.style.width=u.labelW,i.style.animationDelay=`${t}s`,o.appendChild(i),t+=.1;let y=document.createElement("div");y.className=`canopy-skeleton-bar canopy-skeleton-${u.type}`,y.style.animationDelay=`${t}s`,o.appendChild(y),t+=.15,e.appendChild(o)}let m=document.createElement("div");m.className="canopy-skeleton-bar canopy-skeleton-button",m.style.animationDelay=`${t}s`,e.appendChild(m),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=e,this.container.appendChild(n)}};var z=`
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

.canopy-status.canopy-status-success {
  color: #5FD48C;
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
`;var R="canopy-embed-styles";function U(){if(document.getElementById(R))return;let l=document.createElement("style");l.id=R,l.textContent=z,document.head.appendChild(l)}function K(l){var e;return l.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function Z(l){let e=l.dataset.theme;if(e)try{return JSON.parse(e)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function w(){U(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=e.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let t=Z(e),r=K(e);new T(e,{formId:n,themeOverrides:t,baseUrl:r}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",w):w();window.CanopyForms={init:w,CanopyForm:T};})();
